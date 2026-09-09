"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { IconCheck } from "@/components/ui/icons";
import { consumeAuthReturnTo } from "@/components/shared/AuthGate";
import { useAuth } from "@/lib/auth-context";
import {
  apiSendPhoneOtp,
  apiVerifyPhoneOtp,
  apiGetPresignedUpload,
  apiSubmitTrustDocument,
} from "@/lib/backend-client";
import { ROLE_BLURBS, ROLE_LABELS, roleLandingHref } from "@/lib/roles";
import { RoleName } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIMARY_ROLES: RoleName[] = ["tenant-buyer", "landlord"];
const SECONDARY_ROLES: RoleName[] = ["service-provider", "advertiser"];

const NEEDS_TRUST_LAYER: RoleName[] = ["landlord", "service-provider"];

type Step = "role" | "basic-info" | "trust-layer" | "pending";

const STEP_ORDER: { key: Step; label: string }[] = [
  { key: "role", label: "Choose your roles" },
  { key: "basic-info", label: "Your details" },
  { key: "trust-layer", label: "Identity verification" },
  { key: "pending", label: "Under review" },
];

function RoleOption({
  role,
  selected,
  onToggle,
  emphasis,
}: {
  role: RoleName;
  selected: boolean;
  onToggle: () => void;
  emphasis: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        "flex w-full items-start gap-3.5 rounded-[var(--radius-card)] border p-4 text-left transition-[border-color,box-shadow,background-color] duration-[var(--motion-duration-short)]",
        selected
          ? "border-[var(--color-brand-primary)] bg-[color-mix(in_srgb,var(--color-brand-primary)_8%,transparent)] shadow-[var(--elevation-xs)]"
          : "border-[var(--color-border-hairline)] hover:border-[var(--color-brand-accent)] hover:shadow-[var(--elevation-xs)]"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors duration-[var(--motion-duration-short)]",
          selected
            ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white"
            : "border-[var(--color-border-default)]"
        )}
      >
        <AnimatePresence initial={false}>
          {selected && (
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="flex"
            >
              <IconCheck className="h-3 w-3" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block font-bold text-[var(--color-text-primary)]",
            emphasis === "secondary" && "text-sm"
          )}
        >
          {ROLE_LABELS[role]}
        </span>
        <span className="u-ui block text-sm text-[var(--color-text-secondary)]">{ROLE_BLURBS[role]}</span>
      </span>
    </button>
  );
}

function RegisterFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const suggested = searchParams.get("role") as RoleName | null;
  const nextParam = searchParams.get("next");

  const [step, setStep] = useState<Step>("role");
  const [selected, setSelected] = useState<RoleName[]>(() => (suggested ? [suggested] : []));
  const [returnContext] = useState(() => consumeAuthReturnTo());

  // Basic info — collected BEFORE register() is called, since the backend
  // needs all of this (including motherMaidenName) at registration time.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [motherMaidenName, setMotherMaidenName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trust-layer step state — the account already exists by the time we're
  // here, so these call real, authenticated endpoints.
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSubmitting, setOtpSubmitting] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentSubmitting, setDocumentSubmitting] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const returnTo = nextParam || returnContext?.returnTo || null;

  const toggle = (role: RoleName) =>
    setSelected((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));

  const needsTrustLayer = selected.some((r) => NEEDS_TRUST_LAYER.includes(r));
  const instantRoles = selected.filter((r) => !NEEDS_TRUST_LAYER.includes(r));
  const reviewRoles = selected.filter((r) => NEEDS_TRUST_LAYER.includes(r));

  const goToBasicInfo = () => selected.length > 0 && setStep("basic-info");

  // Creates the REAL account — name/email/password/roles/motherMaidenName
  // all go to the backend here, in one call, since that's what
  // POST /auth/register actually requires.
  const completeBasicInfo = async () => {
    if (selected.length === 0) return;
    setError(null);
    setSubmitting(true);
    try {
      await register({
        name,
        email,
        phone: phone || undefined,
        password,
        motherMaidenName: needsTrustLayer ? motherMaidenName : undefined,
        roles: selected,
      } as Parameters<typeof register>[0] & { motherMaidenName?: string });
      if (needsTrustLayer) {
        setStep("trust-layer");
      } else {
        router.push(returnTo || roleLandingHref(selected[0]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong creating your account.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Trust-layer step: real phone OTP ---
  const sendOtp = async () => {
    setOtpError(null);
    setOtpSubmitting(true);
    try {
      await apiSendPhoneOtp();
      setOtpSent(true);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Couldn't send a code. Try again.");
    } finally {
      setOtpSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    setOtpError(null);
    setOtpSubmitting(true);
    try {
      await apiVerifyPhoneOtp(otpCode);
      setPhoneVerified(true);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Incorrect code.");
    } finally {
      setOtpSubmitting(false);
    }
  };

  // --- Trust-layer step: real document upload ---
  // Uploads the file directly to storage (S3, or the dev-mode fake
  // endpoint), then tells the backend where it landed for EACH role that
  // needs review — a user can hold both Landlord and Service Provider at
  // once, and both need this same document on file.
  const submitDocument = async () => {
    if (!selectedFile) return;
    setDocumentError(null);
    setDocumentSubmitting(true);
    try {
      const presigned = await apiGetPresignedUpload({
        purpose: "trust-document",
        fileName: selectedFile.name,
        fileType: selectedFile.type,
      });

      await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      const documentReference = presigned.publicUrl || presigned.key;
      for (const role of reviewRoles) {
        await apiSubmitTrustDocument(role, documentReference);
      }

      setStep("pending");
    } catch (err) {
      setDocumentError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setDocumentSubmitting(false);
    }
  };

  const visibleSteps = needsTrustLayer ? STEP_ORDER : STEP_ORDER.slice(0, 2);
  const currentStepIndex = visibleSteps.findIndex((s) => s.key === step);

  return (
    <div className="grid grid-cols-1 lg:min-h-[640px] lg:grid-cols-[380px_1fr]">
      <div className="hidden bg-[var(--color-surface-inverted)] px-10 py-14 lg:block">
        <p className="u-label text-[var(--color-light-blue)]">Create your account</p>
        <h2 className="u-heading mt-3 text-2xl text-white">
          Join a trustworthy way to find your next home.
        </h2>
        <ol className="mt-10 flex flex-col gap-6">
          {visibleSteps.map((s, i) => {
            const done = i < currentStepIndex || (step === "pending" && s.key !== "pending");
            const active = s.key === step;
            return (
              <li key={s.key} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    done
                      ? "bg-[var(--color-light-blue)] text-[var(--color-dark-blue)]"
                      : active
                      ? "border-2 border-[var(--color-light-blue)] text-[var(--color-light-blue)]"
                      : "border-2 border-white/25 text-white/50"
                  )}
                >
                  {done ? <IconCheck className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={cn("u-ui text-sm", active || done ? "font-bold text-white" : "text-white/50")}>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>

        {selected.length > 0 && (
          <div className="mt-10 border-t border-[var(--color-border-inverted)] pt-6">
            <p className="u-label text-[var(--color-text-inverted-secondary)]">Registering as</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <AnimatePresence initial={false}>
                {selected.map((r) => (
                  <motion.span
                    key={r}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="u-ui rounded-full bg-white/12 px-3 py-1.5 text-[13px] font-bold text-white"
                  >
                    {ROLE_LABELS[r]}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 lg:px-12">
        {step === "role" && (
          <>
            <h1 className="u-heading text-2xl text-[var(--color-text-primary)]">Create your account</h1>
            {returnContext ? (
              <p className="mt-1 text-sm font-bold text-[var(--color-brand-primary-text)]">
                {returnContext.actionLabel}
              </p>
            ) : (
              <p className="mt-1 text-[var(--color-text-secondary)]">What brings you to NextHome?</p>
            )}
            <p className="u-ui mt-3 text-sm text-[var(--color-text-secondary)]">
              Pick as many as apply — you can be a Renter <em>and</em> a Landlord on one account, and add
              more later without registering again.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {PRIMARY_ROLES.map((r) => (
                <RoleOption
                  key={r}
                  role={r}
                  emphasis="primary"
                  selected={selected.includes(r)}
                  onToggle={() => toggle(r)}
                />
              ))}
            </div>

            <div className="mt-6">
              <p className="u-label text-[var(--color-text-secondary)]">Also available</p>
              <div className="mt-2.5 flex flex-col gap-2.5">
                {SECONDARY_ROLES.map((r) => (
                  <RoleOption
                    key={r}
                    role={r}
                    emphasis="secondary"
                    selected={selected.includes(r)}
                    onToggle={() => toggle(r)}
                  />
                ))}
              </div>
            </div>

            <Button className="mt-6" disabled={selected.length === 0} onClick={goToBasicInfo}>
              Continue
              {selected.length > 1 ? ` with ${selected.length} roles` : ""}
            </Button>
            {selected.length === 0 && (
              <p className="u-ui mt-2 text-sm text-[var(--color-text-secondary)]">
                Choose at least one role to continue.
              </p>
            )}
          </>
        )}

        {step === "basic-info" && (
          <>
            <h1 className="u-heading text-2xl text-[var(--color-text-primary)]">Your details</h1>
            <p className="mt-1 text-[var(--color-text-secondary)]">
              This information is shared across every role on your account — you&apos;ll never re-enter it
              if you add another role later.
            </p>
            <div className="mt-6 flex flex-col gap-4">
              <div>
                <Label htmlFor="reg-name">Full name</Label>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="u-ui mt-1 text-xs text-[var(--color-text-secondary)]">
                  We&apos;ll verify this on the next step.
                </p>
              </div>
              <div>
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {needsTrustLayer && (
                <div>
                  <Label htmlFor="mmn">Mother&apos;s maiden name</Label>
                  <Input
                    id="mmn"
                    placeholder="Used for account recovery and fraud checks"
                    value={motherMaidenName}
                    onChange={(e) => setMotherMaidenName(e.target.value)}
                  />
                  <p className="u-ui mt-1 text-xs text-[var(--color-text-secondary)]">
                    Required because {reviewRoles.map((r) => ROLE_LABELS[r]).join(" and ")} accounts go
                    through identity verification.
                  </p>
                </div>
              )}
            </div>
            {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
            <Button className="mt-6" loading={submitting} onClick={completeBasicInfo}>
              Continue
            </Button>
          </>
        )}

        {step === "trust-layer" && (
          <>
            <h1 className="u-heading text-2xl text-[var(--color-text-primary)]">A bit more verification</h1>
            <p className="mt-1 text-[var(--color-text-secondary)]">
              Because {reviewRoles.map((r) => ROLE_LABELS[r]).join(" and ")}
              {reviewRoles.length > 1 ? " roles" : "s"} list things others pay for and contact, we ask for
              phone verification and one identity document before you can publish. Document review is done
              by our team, not automatic.
            </p>
            {instantRoles.length > 0 && (
              <p className="u-ui mt-3 text-sm text-[var(--color-text-secondary)]">
                Your {instantRoles.map((r) => ROLE_LABELS[r]).join(" and ")} access is not affected and
                works already.
              </p>
            )}

            <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] p-4">
              <p className="font-bold text-[var(--color-text-primary)]">Phone verification</p>
              {phoneVerified ? (
                <p className="mt-2 flex items-center gap-2 text-sm font-bold text-[var(--color-brand-primary-text)]">
                  <IconCheck className="h-4 w-4" /> Verified
                </p>
              ) : !otpSent ? (
                <Button variant="secondary" size="dense" className="mt-3" loading={otpSubmitting} onClick={sendOtp}>
                  Send verification code
                </Button>
              ) : (
                <div className="mt-3 flex flex-col gap-2.5">
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                  <Button variant="secondary" size="dense" loading={otpSubmitting} onClick={verifyOtp}>
                    Verify code
                  </Button>
                </div>
              )}
              {otpError && <p className="mt-2 text-sm font-bold text-red-600">{otpError}</p>}
            </div>

            <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] p-4">
              <p className="font-bold text-[var(--color-text-primary)]">Identity document</p>
              <Label htmlFor="doc" className="mt-3 block">
                Upload ID or utility bill
              </Label>
              <input
                id="doc"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                className="block w-full rounded-[var(--radius-control)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-3 text-sm"
              />
              {documentError && <p className="mt-2 text-sm font-bold text-red-600">{documentError}</p>}
            </div>

            <Button
              className="mt-6"
              disabled={!selectedFile}
              loading={documentSubmitting}
              onClick={submitDocument}
            >
              Submit for review
            </Button>
          </>
        )}

        {step === "pending" && (
          <>
            <h1 className="u-heading text-2xl text-[var(--color-text-primary)]">Almost there</h1>
            <div className="mt-6">
              <StatusBanner
                kind="pending"
                title={`Your ${reviewRoles.map((r) => ROLE_LABELS[r]).join(" and ")} documents are under review`}
                description={
                  instantRoles.length > 0
                    ? `Our team is checking them. Your ${instantRoles
                        .map((r) => ROLE_LABELS[r])
                        .join(" and ")} access is already active — nothing else on your account is restricted while this is pending.`
                    : "This usually takes our team a short while. Nothing else on your account is restricted while this is pending."
                }
              />
            </div>
            <Button
              className="mt-6"
              onClick={() => router.push(returnTo || roleLandingHref(instantRoles[0] ?? selected[0]))}
            >
              {returnTo ? "Continue where I left off" : "Go to my dashboard"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterFlow />
    </Suspense>
  );
}