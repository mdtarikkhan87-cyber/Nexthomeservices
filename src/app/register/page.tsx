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
import { ROLE_BLURBS, ROLE_LABELS, roleLandingHref } from "@/lib/roles";
import { RoleName } from "@/lib/types";
import { cn } from "@/lib/utils";

// ===========================================================================
// MULTI-ROLE REGISTRATION (Website Revision Spec §3B)
// ===========================================================================
// Spec, verbatim: "At registration, a user can select multiple roles at once —
// Renter and/or Landlord — via multi-select, not a single either/or choice."
//
// The account model already supported holding several roles at once
// (PRODUCT_DECISIONS.md §1/§8) and the account page could already add them one
// at a time — but this screen forced a single choice, so the model's central
// promise was unreachable at the only moment most people would use it. That
// is the gap this closes: the *registration form*, not the data model.
//
// SCOPE NOTE: the client discussed Renter and Landlord only. Service Provider
// and Advertiser are approved roles in PRODUCT_DECISIONS.md §1 and are still
// offered here, because removing them would delete approved product surface
// on the strength of them not being mentioned in one meeting. They are visually
// secondary to the two the client named. Confirming whether they stay in scope
// is Open Item 7 in the revision request.
// ===========================================================================

/** The two roles the client named, first and given the most weight. */
const PRIMARY_ROLES: RoleName[] = ["tenant-buyer", "landlord"];
/** Approved, still offered, deliberately quieter — see SCOPE NOTE above. */
const SECONDARY_ROLES: RoleName[] = ["service-provider", "advertiser"];

const NEEDS_TRUST_LAYER: RoleName[] = ["landlord", "service-provider"];

type Step = "role" | "basic-info" | "trust-layer" | "pending";

const STEP_ORDER: { key: Step; label: string }[] = [
  { key: "role", label: "Choose your roles" },
  { key: "basic-info", label: "Confirm phone & email" },
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
    // A real checkbox semantically (role="checkbox" + aria-checked) rather
    // than a styled div, so assistive tech announces this as a multi-select —
    // which is the entire point of the change. A visually-only "selected"
    // state would look like multi-select and behave like a mystery.
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
      {/* The tick box carries the multi-select affordance visually. Square,
          not round — a round control reads as "pick one" to most people, and
          this is explicitly not that. */}
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
  const { addRoles } = useAuth();

  // A suggested role arrives from a gated action ("Log in to list your
  // property" → ?role=landlord). It PRE-SELECTS rather than decides, so the
  // user can add a second role in the same pass.
  const suggested = searchParams.get("role") as RoleName | null;
  // The registration wall on a gated listing passes where to come back to.
  const nextParam = searchParams.get("next");

  const [step, setStep] = useState<Step>("role");
  const [selected, setSelected] = useState<RoleName[]>(() => (suggested ? [suggested] : []));
  const [otpSent, setOtpSent] = useState(false);
  const [returnContext] = useState(() => consumeAuthReturnTo());

  const returnTo = nextParam || returnContext?.returnTo || null;

  const toggle = (role: RoleName) =>
    setSelected((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));

  const needsTrustLayer = selected.some((r) => NEEDS_TRUST_LAYER.includes(r));
  // Roles that clear immediately vs. roles that enter document review — a
  // multi-role registration can be both at once, which the final step says
  // out loud rather than reporting one outcome for a mixed result.
  const instantRoles = selected.filter((r) => !NEEDS_TRUST_LAYER.includes(r));
  const reviewRoles = selected.filter((r) => NEEDS_TRUST_LAYER.includes(r));

  const goToBasicInfo = () => selected.length > 0 && setStep("basic-info");

  const completeBasicInfo = () => {
    if (selected.length === 0) return;
    if (needsTrustLayer) {
      setStep("trust-layer");
      return;
    }
    // PRODUCT_DECISIONS.md §5: Tenant/Buyer and Advertiser reach
    // "role verified" immediately — account-level email+phone is enough.
    addRoles(selected);
    router.push(returnTo || roleLandingHref(selected[0]));
  };

  const completeTrustLayer = () => {
    if (selected.length === 0) return;
    // Granted as one set: the instant roles are usable straight away and the
    // reviewed ones enter pending-admin-document-review. Registering as both
    // Renter and Landlord must not leave the Renter half waiting on the
    // Landlord half's paperwork (PRODUCT_DECISIONS.md §8.1 — adding a role
    // never restricts an existing one).
    addRoles(selected);
    setStep("pending");
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
            const active = i === currentStepIndex;
            return (
              <li key={s.key} className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    done
                      ? "bg-[var(--color-light-blue)] text-[var(--color-dark-blue)]"
                      : active
                        ? "border-2 border-[var(--color-light-blue)] text-white"
                        : "border border-[var(--color-border-inverted)] text-white/50"
                  )}
                >
                  {done ? <IconCheck className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <p className={cn("pt-0.5 text-sm font-bold", active || done ? "text-white" : "text-white/50")}>
                  {s.label}
                </p>
              </li>
            );
          })}
        </ol>

        {/* The roles chosen so far, echoed here. On a multi-select the user
            has made several decisions across a flow with several steps, and
            this is the only place they can confirm what they actually picked
            without going back. */}
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
            <h1 className="u-heading text-2xl text-[var(--color-text-primary)]">
              Confirm your phone &amp; email
            </h1>
            <p className="mt-1 text-[var(--color-text-secondary)]">
              This information is shared across every role on your account — you&apos;ll never re-enter it
              if you add another role later.
            </p>
            <div className="mt-6 flex flex-col gap-4">
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" type="tel" placeholder="+234 800 000 0000" />
              </div>
              {!otpSent ? (
                <Button variant="secondary" size="dense" className="self-start" onClick={() => setOtpSent(true)}>
                  Send verification code
                </Button>
              ) : (
                <div>
                  <Label htmlFor="otp">Enter code</Label>
                  <Input id="otp" inputMode="numeric" maxLength={6} placeholder="123456" />
                </div>
              )}
              <div>
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" placeholder="you@example.com" />
              </div>
            </div>
            <Button className="mt-6" onClick={completeBasicInfo}>
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
              one more identity check before you can publish. This is reviewed by our team, not automatic.
            </p>
            {instantRoles.length > 0 && (
              <p className="u-ui mt-3 text-sm text-[var(--color-text-secondary)]">
                Your {instantRoles.map((r) => ROLE_LABELS[r]).join(" and ")} access is not affected and
                works as soon as you finish.
              </p>
            )}
            <div className="mt-6 flex flex-col gap-4">
              <div>
                <Label htmlFor="mmn">Mother&apos;s maiden name</Label>
                <Input id="mmn" placeholder="Used for account recovery and fraud checks" />
              </div>
              <div>
                <Label htmlFor="doc">Upload ID or utility bill</Label>
                <input
                  id="doc"
                  type="file"
                  className="block w-full rounded-[var(--radius-control)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-3 text-sm"
                />
              </div>
            </div>
            <Button className="mt-6" onClick={completeTrustLayer}>
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
