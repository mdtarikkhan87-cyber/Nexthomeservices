"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { IconArrowRight, IconCheck } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth-context";
import { DEMO_ACCOUNTS, DEMO_LANDLORD_RENTER, DemoAccount } from "@/lib/demo-accounts";
import { ROLE_LABELS, roleLandingHref } from "@/lib/roles";

// WIREFRAME_PLAN.md — Login: minimal, focused flow. Credential mechanism
// (password vs OTP) is unspecified in source docs (flagged in the Final
// Implementation Readiness Check) — email + password is used here as a
// reasonable, common default, not a silent product decision.
//
// REDESIGN PASS: split-panel shell (brand imagery + trust points on the
// left at desktop, the actual form on the right) instead of a small
// centered card — the flow, fields, and submit behavior are unchanged.
// The image panel collapses away below `lg` so the mobile flow stays fast
// and single-column, per RESPONSIVE_STRATEGY.md.
//
// ROLE-SELECTION REVISION (31 Aug 2026): this page gained the demo account
// picker. Three accounts, three different SHAPES — because the single thing
// this revision changes cannot be seen from one hard-coded demo user. A
// reviewer needs to watch a one-role account go straight in with no prompt
// and no switcher, and a two-role account be asked once and remember the
// answer. See lib/demo-accounts.ts.
const REASSURANCE_POINTS = ["Verified listings only", "In-app messaging, on record", "No spam, ever"];

function LoginForm() {
  const { login, isAuthenticated, activeRole, needsRoleChoice, clearRolePreference } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  // GUEST-ACCESS PASS: this route used to always land on /dashboard,
  // discarding wherever the user came from. It honors a `?next=` path so the
  // standalone login route preserves context the same way the in-place
  // AuthGate prompt does. Only same-origin relative paths are accepted, so
  // `next` can't be used as an open redirect.
  const next = searchParams.get("next");
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : null;

  // POST-LOGIN LANDING, rule 3. Deliberately an effect on the resolved auth
  // state rather than a push() next to the login() call: which role a sign-in
  // resolves to is decided in one place (auth-context), and only that decision
  // knows whether a saved preference was restored or a choice is still owed.
  //
  //   choice owed  → do nothing. The "Act as" prompt is showing, and IT
  //                  navigates once the user picks. Pushing here would race it.
  //   resolved     → go to ?next= if we were sent here from somewhere, else to
  //                  that role's landing page.
  useEffect(() => {
    if (!isAuthenticated || needsRoleChoice || !activeRole) return;
    router.replace(destination ?? roleLandingHref(activeRole));
  }, [isAuthenticated, needsRoleChoice, activeRole, destination, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // No credential validation exists (IMPLEMENTATION_NOTES.md #9). The form
    // signs in as the two-role account so the flow a reviewer reaches by
    // typing anything into the fields is the interesting one; the picker below
    // is how the single-role shapes are reached.
    setTimeout(() => login(DEMO_LANDLORD_RENTER), 400);
  };

  return (
    <div className="grid grid-cols-1 lg:min-h-[640px] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=70"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, color-mix(in srgb, var(--color-dark-blue) 95%, transparent) 0%, color-mix(in srgb, var(--color-dark-blue) 55%, transparent) 60%, color-mix(in srgb, var(--color-dark-blue) 30%, transparent) 100%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-end p-12">
          <h2 className="max-w-sm text-3xl font-bold tracking-tight text-white">
            Welcome back to a trustworthy way to find your next home.
          </h2>
          <ul className="mt-6 flex flex-col gap-2.5">
            {REASSURANCE_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-sm font-bold text-white/85">
                <IconCheck className="h-4 w-4 shrink-0 text-[var(--color-light-blue)]" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col justify-center px-4 py-16 sm:px-6 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Log in</h1>
          <p className="mt-1.5 text-[var(--color-text-secondary)]">Welcome back to NextHome.</p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <div>
              <Label htmlFor="email">Email or phone</Label>
              <Input id="email" type="text" required placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required placeholder="••••••••" />
            </div>
            <Button type="submit" loading={submitting} className="mt-2">
              Log in
            </Button>
          </form>

          <DemoAccountPicker
            onPick={login}
            onForget={(account) => clearRolePreference(account.id)}
          />

          <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
            New to NextHome?{" "}
            <Link href="/register" className="font-bold text-[var(--color-brand-primary)] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * The demo account picker.
 *
 * Each row names the roles the account holds and what that shape does — a
 * reviewer should be able to predict the behaviour before clicking, then watch
 * it happen. Kept visually secondary to the real form: it is scaffolding for
 * review, not a product feature, and it goes when a backend arrives.
 */
function DemoAccountPicker({
  onPick,
  onForget,
}: {
  onPick: (account: DemoAccount) => void;
  onForget: (account: DemoAccount) => void;
}) {
  return (
    <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-dense)]/60 p-4">
      <p className="u-label text-[var(--color-text-secondary)]">Demo accounts</p>
      <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">
        No real sign-in exists yet. Pick a shape of account to see how role selection behaves for it.
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {DEMO_ACCOUNTS.map((account) => (
          <div key={account.id}>
            <button
              type="button"
              onClick={() => onPick(account)}
              className="group flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-3 text-left transition-[border-color,box-shadow] duration-[var(--motion-duration-short)] hover:border-[var(--color-brand-primary)] hover:shadow-[var(--elevation-xs)]"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[var(--color-text-primary)]">
                  {account.name}
                </span>
                <span className="u-ui block text-xs text-[var(--color-text-secondary)]">
                  {account.summary}
                </span>
                <span className="u-label mt-1.5 block text-[var(--color-text-secondary)]">
                  {account.roles.map((r) => ROLE_LABELS[r]).join(" · ")}
                </span>
              </span>
              <IconArrowRight
                aria-hidden
                className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition-transform duration-[var(--motion-duration-short)] group-hover:translate-x-0.5 group-hover:text-[var(--color-brand-primary-text)]"
              />
            </button>
            {/* Only the multi-role account can owe a prompt, so only it has
                anything to forget. Without this the "Act as" screen is a
                once-ever event per browser, which makes the behaviour this
                revision is about impossible to re-demonstrate. */}
            {account.roles.length > 1 && (
              <button
                type="button"
                onClick={() => onForget(account)}
                className="mt-1 px-1 text-xs font-bold text-[var(--color-brand-primary-text)] hover:underline"
              >
                Forget this account&apos;s saved role choice
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// useSearchParams requires a Suspense boundary in the App Router.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
