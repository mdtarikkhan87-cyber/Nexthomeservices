"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { AuthRequired } from "@/components/shared/AuthGate";
import { useNotifications } from "@/lib/notification-context";
import { ROLE_LABELS as roleLabels, roleLandingHref } from "@/lib/roles";
import { RoleName } from "@/lib/types";

// The private copy of this label map that used to live here is gone — it is
// how two surfaces drift into calling the same role two different things
// (ROLE_EXPERIENCE_AUDIT.md §6, gap 8). lib/roles.ts owns the vocabulary.
const ADDABLE: RoleName[] = ["landlord", "tenant-buyer", "service-provider", "advertiser"];

// COMPONENT_ARCHITECTURE.md §4: Account/Verification Status Panel — must
// visually separate account-level (shared) vs. role-level state
// (PRODUCT_DECISIONS.md §6), never collapse into one generic list.
export default function AccountPage() {
  return (
    <AuthRequired
      title="Log in to open your account"
      description="Your account page shows your verification status and the roles you hold. Log in or create an account to continue — you'll land right here."
    >
      <AccountContent />
    </AuthRequired>
  );
}

// GUEST-ACCESS PASS: this route previously rendered a bare EmptyState with
// no action at all for guests — a true dead end. It now uses the same
// shared AuthRequired guard as the dashboard. The authenticated content is
// split into its own component so its hooks only run once past the guard.
function AccountContent() {
  const { roles, activeRole, setActiveRole, addRole, setTenantBuyerContext } = useAuth();
  const { notify } = useNotifications();
  const router = useRouter();

  // Landlord and Service Provider enter document review; Tenant/Buyer and
  // Advertiser reach role-verified immediately (PRODUCT_DECISIONS.md §5), so
  // the two paths report genuinely different outcomes rather than one
  // generic "role added" message.
  //
  // ROLE-SELECTION REVISION — role added later (1 → 2 roles): the new role
  // becomes active immediately (auth-context addRoles) and the user LANDS on
  // its dashboard. Adding a role is an act of intent; leaving someone on the
  // account page afterwards makes them go and find the thing they just asked
  // for. A pending document review does not change this — the dashboard is
  // reachable in every role state, and it is where the pending banner is.
  const handleAddRole = (r: RoleName) => {
    addRole(r);
    const needsReview = r === "landlord" || r === "service-provider";
    notify({
      role: r,
      kind: "account",
      title: needsReview ? "Documents under review" : `${roleLabels[r]} role added`,
      body: needsReview
        ? `Our team is checking your ${roleLabels[r]} documents. We'll let you know either way.`
        : `Your ${roleLabels[r]} role is verified and ready to use.`,
      href: "/account",
      status: needsReview ? "pending" : "verified",
    });
    router.push(roleLandingHref(r));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">Account &amp; Roles</h1>

      <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)]">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Account-level</p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-[var(--color-text-primary)]">
          <StatusBadge kind="verified" dense label="Phone verified" />
          <StatusBadge kind="verified" dense label="Email verified" />
        </p>
        <p className="mt-2.5 text-xs text-[var(--color-text-secondary)]">
          Reused automatically for every role you add — never re-collected (PRODUCT_DECISIONS.md §8.1).
        </p>
      </div>

      <div className="mt-7">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Your roles</p>
        <div className="flex flex-col gap-3">
          {roles.map((r) => (
            <div
              key={r.role}
              className={`flex items-center justify-between rounded-[var(--radius-card)] border bg-[var(--color-surface-raised)] p-4 shadow-[var(--elevation-xs)] ${
                activeRole === r.role ? "border-[var(--color-brand-primary)]" : "border-[var(--color-border-hairline)]"
              }`}
            >
              <div>
                <p className="font-bold text-[var(--color-text-primary)]">{roleLabels[r.role]}</p>
                <div className="mt-1 flex gap-2">
                  <StatusBadge
                    kind={r.state === "role-verified" ? "verified" : "pending"}
                    dense
                    label={r.state === "pending-admin-document-review" ? "Documents under review" : r.state === "role-added" ? "Setup incomplete" : "Verified"}
                  />
                  {r.role === "landlord" && (
                    <StatusBadge
                      kind={r.subscriptionState === "active" ? "verified" : "pending"}
                      dense
                      label={r.subscriptionState === "active" ? "Subscription active" : "Subscription inactive"}
                    />
                  )}
                </div>

                {/* Renting/Buying context — a switchable context within
                    this one role, not a separate role
                    (ROLE_EXPERIENCE_AUDIT.md §4 Option C). */}
                {r.role === "tenant-buyer" && (
                  <div className="mt-3 inline-flex rounded-[var(--radius-control)] bg-[var(--color-surface-dense)] p-1">
                    {(["rent", "sale"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setTenantBuyerContext(c)}
                        aria-pressed={r.context === c}
                        className={`rounded-[var(--radius-control)] px-3 py-1.5 text-xs font-bold transition-colors ${
                          r.context === c
                            ? "bg-[var(--color-brand-primary)] text-white"
                            : "text-[var(--color-text-secondary)]"
                        }`}
                      >
                        {c === "rent" ? "Renting" : "Buying"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Switching from here lands on the role's home too, exactly as
                  the header switcher does — one rule for switching, wherever
                  it is triggered from. */}
              {activeRole !== r.role && (
                <Button
                  variant="secondary"
                  size="dense"
                  onClick={() => {
                    setActiveRole(r.role);
                    router.push(roleLandingHref(r.role));
                  }}
                >
                  Switch to
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Add a role</p>
        <div className="flex flex-wrap gap-2">
          {ADDABLE.filter((r) => !roles.some((held) => held.role === r)).map((r) => (
            <Button key={r} variant="secondary" size="dense" onClick={() => handleAddRole(r)}>
              + {roleLabels[r]}
            </Button>
          ))}
          {ADDABLE.every((r) => roles.some((held) => held.role === r)) && (
            <p className="text-sm text-[var(--color-text-secondary)]">You hold every available role.</p>
          )}
        </div>
      </div>
    </div>
  );
}
