"use client";

import Link from "next/link";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { useAuth } from "@/lib/auth-context";

const PLANS = [
  { name: "Monthly", price: "₦5,000/mo", note: "Cancel anytime" },
  { name: "Annual", price: "₦50,000/yr", note: "2 months free vs monthly" },
];

// DESIGN_SYSTEM.md §9: cost stated plainly, before any payment field —
// Direction A's transparency overrides brevity here.
//
// There is no online payment yet (no card, Paystack or bank-transfer
// integration exists), so this page never offers a "Subscribe" action: a
// button that appeared to succeed would tell a landlord they can publish when
// the server still says "inactive". The only thing that makes a subscription
// active is an admin activating it (admin.routes.js), which arrives here as
// the landlord role's real `subscriptionState`.
export default function SubscriptionPage() {
  const { roles } = useAuth();
  const landlordRole = roles.find((r) => r.role === "landlord");

  if (landlordRole?.subscriptionState === "active") {
    return (
      <div className="max-w-xl">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-status-verified)] bg-[color-mix(in_srgb,var(--color-status-verified)_8%,transparent)] p-5 shadow-[var(--elevation-xs)]">
          <p className="font-bold text-[var(--color-status-verified)]">Subscription active</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">You can now publish listings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Subscription</h1>
      <p className="mt-1.5 text-[var(--color-text-secondary)]">
        There is no free listing tier. A subscription is required before your first listing can go live.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className="rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)]"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{p.name}</p>
            <p className="mt-1.5 text-xl font-bold tracking-tight text-[var(--color-brand-primary)]">{p.price}</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{p.note}</p>
          </div>
        ))}
      </div>

      <StatusBanner
        className="mt-6"
        kind="pending"
        title="Online payment isn't available yet"
        description="Landlord subscriptions are currently activated by our team. Send us a message and we'll set up your subscription. You'll get a notification here when it's active."
      />
      <Link
        href="/feedback"
        className="mt-4 inline-flex items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand-primary)] px-5 py-2.5 text-base font-bold text-white shadow-[var(--elevation-xs)] transition-[background-color,box-shadow] duration-[var(--motion-duration-short)] hover:bg-[var(--color-brand-primary-hover)] hover:shadow-[var(--elevation-sm)]"
      >
        Contact us to activate your subscription
      </Link>
    </div>
  );
}
