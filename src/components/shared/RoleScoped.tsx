"use client";

import Link from "next/link";
import { useEffect, useRef, ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { IconLock } from "@/components/ui/icons";
import { useRoleSwitchNotice } from "@/components/shared/RoleSwitchNotice";
import { useAuth } from "@/lib/auth-context";
import { ROLE_BLURBS, ROLE_LABELS } from "@/lib/roles";
import { RoleName } from "@/lib/types";

// ---------------------------------------------------------------------------
// The role-scoped route guard. The third and last of this product's guards:
//
//   AuthGate.requireAuth   — an in-page action needs an account (modal)
//   AuthGate.AuthRequired  — a route needs an account       (page panel)
//   RoleScoped (here)      — a route needs a specific ROLE  (page panel)
//
// It asks exactly one question, and it is the permanent one:
//
//     user.roles.includes(requiredRole)
//
// NOT activeRole. That distinction is the whole point of this guard. Before
// it existed, nothing stopped any signed-in user from opening any dashboard
// route — the sidebar simply did not link there, so `activeRole` was doing
// permission work by omission (ROLE_EXPERIENCE_AUDIT.md §6, gap 7). Omission
// is not a guard: the URL was always typeable.
//
// TWO OUTCOMES, and they are deliberately very different:
//
//   Holds the role, acting as another one → SWITCH AND CONTINUE. Never block.
//     A landlord who follows a link to their own listings while acting as a
//     Renter wanted the listings, not a lecture. activeRole is a view context,
//     and a view context should follow the user, not fight them. The switch is
//     announced (RoleSwitchNotice) because silent state changes are worse than
//     the interruption they avoid.
//
//   Does not hold the role → BLOCK, and name the missing role specifically
//     (DESIGN_SYSTEM.md §14 "Blocked": never a generic "you can't do that"),
//     with the real way forward — adding the role — one click away, because
//     that is an approved, implemented flow (PRODUCT_DECISIONS.md §8.1).
// ---------------------------------------------------------------------------

export function RoleScoped({ requiredRole, children }: { requiredRole: RoleName; children: ReactNode }) {
  const { user, activeRole, setActiveRole } = useAuth();
  const { announceRoleSwitch } = useRoleSwitchNotice();

  const holdsRole = !!user?.roles.includes(requiredRole);

  // ALIGN ONCE PER ARRIVAL, then stop. This is not an optimisation — a guard
  // that keeps re-asserting fights the user.
  //
  // Caught in testing: on /dashboard/landlord, switching to Renter from the
  // header set activeRole, and this effect — still mounted while the router
  // transitioned away — immediately set it straight back to Landlord. The
  // switch appeared to work (the page did change to /listings) but the header
  // still read Landlord and the saved preference had been rewritten. The user
  // pressed a control and the product undid it a frame later.
  //
  // So the correction runs when the guard first sees a given required role and
  // never again for it. Arriving somewhere new re-arms it (the prop changes,
  // or the component remounts coming from a shared route); deliberately
  // switching away does not, because the switcher is already navigating out.
  const alignedFor = useRef<RoleName | null>(null);

  useEffect(() => {
    if (!holdsRole) return;
    if (alignedFor.current === requiredRole) return;
    alignedFor.current = requiredRole;
    if (activeRole === requiredRole) return;
    setActiveRole(requiredRole);
    announceRoleSwitch(requiredRole);
  }, [holdsRole, requiredRole, activeRole, setActiveRole, announceRoleSwitch]);

  if (!holdsRole) return <RoleRequired requiredRole={requiredRole} />;

  return <>{children}</>;
}

/**
 * The blocked state for a signed-in user who does not hold the required role.
 *
 * Shaped like AuthGate's AuthRequired panel on purpose — a user who has hit
 * one of this product's three gates should recognise the second and third
 * immediately, rather than meeting a new kind of wall each time.
 */
function RoleRequired({ requiredRole }: { requiredRole: RoleName }) {
  const label = ROLE_LABELS[requiredRole];

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--elevation-xs)]">
        <span
          aria-hidden
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-dense)] text-[var(--color-brand-primary-text)]"
        >
          <IconLock className="h-[18px] w-[18px]" />
        </span>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          This page is for the {label} role
        </h2>
        {/* The specific unmet condition, named: it is not that they are
            signed out, and not that something is pending — it is that this
            account does not hold this one role. */}
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
          You&apos;re signed in, but your account doesn&apos;t hold the {label} role yet.{" "}
          {ROLE_BLURBS[requiredRole]}
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link href="/account" className="flex">
            <Button className="w-full">Add the {label} role</Button>
          </Link>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Your phone and email are already verified and are reused — never re-collected.
          </p>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">
        Nothing else is restricted —{" "}
        <Link href="/listings" className="font-bold text-[var(--color-brand-primary-text)] hover:underline">
          browse listings
        </Link>{" "}
        or open your{" "}
        <Link href="/dashboard" className="font-bold text-[var(--color-brand-primary-text)] hover:underline">
          dashboard
        </Link>
        .
      </p>
    </div>
  );
}
