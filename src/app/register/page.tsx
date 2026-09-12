"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { IconCheck } from "@/components/ui/icons";
import { consumeAuthReturnTo } from "@/components/shared/AuthGate";
import { TrustLayerVerification } from "@/components/shared/TrustLayerVerification";
import { useAuth } from "@/lib/auth-context";
import { ROLE_BLURBS, ROLE_LABELS, roleLandingHref } from "@/lib/roles";
import { RoleName } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIMARY_ROLES: RoleName[] = ["tenant-buyer", "landlord"];
const SECONDARY_ROLES: RoleName[] = ["service-provider", "advertiser"];

// Every role now goes through phone + document review — extended from the
// original landlord/service-provider-only scope (PRD §6.1) to all four.
const NEEDS_TRUST_LAYER: RoleName[] = ["landlord", "tenant-buyer", "service-provider", "advertiser"];

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
  const { register, isAuthenticated, isHydrating, user, roles: heldRoles } = useAuth();

  const suggested = searchParams.get("role") as RoleName | null;
  const nextParam = searchParams.get("next");

  const [step, setStep] = useState<Step>("role");
  const [selected, setSelected] = useState<RoleName[]>(() => (suggested ? [suggested] : []));
  const [returnContext] = useState(() => consumeAuthReturnTo());
  const [resumed, setResumed] = useState(false);

  // register() creates the real account at the "basic info" step, before
  // phone OTP / document review happen — so a refresh (or closed tab)
  // between then and "Submit for review" leaves a real, authenticated,
  // partially-verified account behind. Without this, that account is
  // stranded: its email/phone are now taken, but landing back on /register
  // just shows role selection again, which fails immediately with "already
  // in use". Detect that case once auth hydrates and jump straight to
  // wherever the account actually is instead.
  useEffect(() => {
    if (isHydrating || resumed || !isAuthenticated || !user) return;
    const incomplete = heldRoles.filter(
      (h) => NEEDS_TRUST_LAYER.includes(h.role) && h.state !== "role-verified"
    );
    if (incomplete.length === 0) return; // nothing unfinished — leave the fresh-signup form alone
    setSelected(user.roles);
    setStep(incomplete.some((h) => h.state === "role-added") ? "trust-layer" : "pending");
    setResumed(true);
  }, [isHydrating, isAuthenticated, user, heldRoles, resumed]);

  // Basic info — collected BEFORE register() is called, since the backend
  // needs all of this (including motherMaidenName) at registration time.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [motherMaidenName, setMotherMaidenName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    // Phone verification is a required part of the next step for these
    // roles (see the "Submit for review" gate below) — without a phone
    // number on file, POST /trust/phone/send-otp has nothing to text and
    // always fails, which would strand the user on trust-layer with no way
    // to complete it. Caught here, before an account with no phone even
    // gets created.
    if (needsTrustLayer && !phone.trim()) {
      setError("A phone number is required for identity verification.");
      return;
    }
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
                <Label htmlFor="phone">Phone number{needsTrustLayer ? "" : " (optional)"}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="u-ui mt-1 text-xs text-[var(--color-text-secondary)]">
                  {needsTrustLayer
                    ? "Required — we'll verify this on the next step."
                    : "Not required for your selected role(s)."}
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
          <TrustLayerVerification
            reviewRoles={reviewRoles}
            instantRoles={instantRoles}
            onComplete={() => setStep("pending")}
          />
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