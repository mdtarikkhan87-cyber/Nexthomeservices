"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { IconCheck } from "@/components/ui/icons";
import { consumeAuthReturnTo } from "@/components/shared/AuthGate";
import { useAuth } from "@/lib/auth-context";
import { RoleName } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLES: { value: RoleName; label: string; blurb: string }[] = [
  { value: "tenant-buyer", label: "Tenant / Buyer", blurb: "Search, save, and message landlords — free." },
  { value: "landlord", label: "Landlord", blurb: "List a property for rent or sale." },
  { value: "service-provider", label: "Service Provider", blurb: "Offer a trade service — free to join." },
  { value: "advertiser", label: "Advertiser", blurb: "Promote a business, property, or service." },
];

const NEEDS_TRUST_LAYER: RoleName[] = ["landlord", "service-provider"];

type Step = "role" | "basic-info" | "trust-layer" | "pending";

// Step progress shown in the left panel — a display-only reading of the
// same `Step` state the flow already uses, not a second source of truth.
const STEP_ORDER: { key: Step; label: string }[] = [
  { key: "role", label: "Choose your role" },
  { key: "basic-info", label: "Confirm phone & email" },
  { key: "trust-layer", label: "Identity verification" },
  { key: "pending", label: "Under review" },
];

function RegisterFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addRole } = useAuth();
  const suggested = (searchParams.get("role") as RoleName) || null;

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<RoleName | null>(suggested);
  const [otpSent, setOtpSent] = useState(false);
  // Captured once, at mount, from the gated action that sent the user here
  // (AuthGate.tsx) — preserves context across the registration flow per
  // PRODUCT_DECISIONS.md §9/§10 rather than always landing on /dashboard.
  const [returnContext] = useState(() => consumeAuthReturnTo());

  const goToBasicInfo = () => role && setStep("basic-info");

  const completeBasicInfo = () => {
    if (!role) return;
    if (NEEDS_TRUST_LAYER.includes(role)) {
      setStep("trust-layer");
    } else {
      // PRODUCT_DECISIONS.md §5: Tenant/Buyer and Advertiser reach
      // "role verified" immediately — account-level email+phone is enough,
      // so this is the one case where we CAN return to the exact original
      // page (the action itself still needs a fresh click to re-run, since
      // the composer/save state wasn't persisted — but the destination is correct).
      addRole(role);
      router.push(returnContext?.returnTo || "/dashboard");
    }
  };

  const completeTrustLayer = () => {
    if (!role) return;
    addRole(role); // enters pending-admin-document-review state — action stays blocked
    setStep("pending");
  };

  const visibleSteps =
    role && !NEEDS_TRUST_LAYER.includes(role) ? STEP_ORDER.slice(0, 2) : STEP_ORDER;
  const currentStepIndex = visibleSteps.findIndex((s) => s.key === step);

  return (
    <div className="grid grid-cols-1 lg:min-h-[640px] lg:grid-cols-[380px_1fr]">
      <div className="hidden bg-[var(--color-surface-inverted)] px-10 py-14 lg:block">
        <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-light-blue)]">Create your account</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Join a trustworthy way to find your next home.</h2>
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
                <p className={cn("pt-0.5 text-sm font-bold", active || done ? "text-white" : "text-white/50")}>{s.label}</p>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 lg:px-12">
      {step === "role" && (
        <>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Create your account</h1>
          {returnContext ? (
            <p className="mt-1 text-sm font-bold text-[var(--color-brand-primary)]">{returnContext.actionLabel}</p>
          ) : (
            <p className="mt-1 text-[var(--color-text-secondary)]">What brings you to NextHome?</p>
          )}
          <div className="mt-6 flex flex-col gap-3">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`rounded-[var(--radius-card)] border p-4 text-left transition-[border-color,box-shadow,background-color] duration-[var(--motion-duration-short)] ${
                  role === r.value
                    ? "border-[var(--color-brand-primary)] bg-[color-mix(in_srgb,var(--color-brand-primary)_8%,transparent)] shadow-[var(--elevation-xs)]"
                    : "border-[var(--color-border-hairline)] hover:border-[var(--color-brand-accent)] hover:shadow-[var(--elevation-xs)]"
                }`}
              >
                <p className="font-bold text-[var(--color-text-primary)]">{r.label}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{r.blurb}</p>
              </button>
            ))}
          </div>
          <Button className="mt-6" disabled={!role} onClick={goToBasicInfo}>
            Continue
          </Button>
        </>
      )}

      {step === "basic-info" && role && (
        <>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Confirm your phone &amp; email</h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">
            This information is shared across every role on your account — you&apos;ll never re-enter it if you
            add another role later.
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

      {step === "trust-layer" && role && (
        <>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">A bit more verification</h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">
            Because {role === "landlord" ? "landlords" : "service providers"} list things others pay for and
            contact, we ask for one more identity check before you can publish. This is reviewed by our team,
            not automatic.
          </p>
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
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Almost there</h1>
          <div className="mt-6">
            <StatusBanner
              kind="pending"
              title="Your documents are under review"
              description="This usually takes our team a short while. You can browse and manage any other roles on your account in the meantime — nothing else is restricted while this is pending."
            />
          </div>
          <Button className="mt-6" onClick={() => router.push(returnContext?.returnTo || "/dashboard")}>
            {returnContext ? "Continue where I left off" : "Go to my dashboard"}
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
