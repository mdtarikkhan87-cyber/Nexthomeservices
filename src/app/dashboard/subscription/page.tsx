"use client";

import { useState } from "react";
import { useNotifications } from "@/lib/notification-context";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { useAuth } from "@/lib/auth-context";

const PLANS = [
  { name: "Monthly", price: "₦5,000/mo", note: "Cancel anytime" },
  { name: "Annual", price: "₦50,000/yr", note: "2 months free vs monthly" },
];

// DESIGN_SYSTEM.md §9: cost stated plainly, before any payment field —
// Direction A's transparency overrides brevity here.
export default function SubscriptionPage() {
  const { roles } = useAuth();
  const landlordRole = roles.find((r) => r.role === "landlord");
  const [method, setMethod] = useState<"card" | "paystack" | "bank">("card");
  const [paid, setPaid] = useState(false);
  const { notify } = useNotifications();

  // Card/Paystack activate immediately; a bank transfer has to be matched
  // manually, so the two paths genuinely resolve to different states
  // (SubscriptionState: active vs pending-confirmation) and must not report
  // the same outcome.
  const confirmPayment = (viaBankTransfer: boolean) => {
    setPaid(true);
    notify({
      role: "landlord",
      kind: "subscription",
      title: viaBankTransfer ? "Subscription awaiting confirmation" : "Subscription active",
      body: viaBankTransfer
        ? "We'll activate your subscription once the transfer is matched to your account."
        : "Your subscription is active — you can publish listings now.",
      href: "/dashboard/subscription",
      status: viaBankTransfer ? "pending" : "verified",
    });
  };

  if (paid || landlordRole?.subscriptionState === "active") {
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
        There&apos;s no free listing tier — a subscription is required before your first listing can go live.
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

      <div className="mt-7">
        <p className="mb-2.5 text-sm font-bold text-[var(--color-text-primary)]">Payment method</p>
        <div className="flex gap-2">
          {(["card", "paystack", "bank"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`rounded-[var(--radius-control)] border px-4 py-2.5 text-sm font-bold capitalize transition-colors duration-[var(--motion-duration-short)] ${
                method === m
                  ? "border-[var(--color-brand-primary)] bg-[color-mix(in_srgb,var(--color-brand-primary)_8%,transparent)] text-[var(--color-brand-primary)]"
                  : "border-[var(--color-border-hairline)] text-[var(--color-text-secondary)] hover:border-[var(--color-deep-blue)]/40"
              }`}
            >
              {m === "bank" ? "Bank Transfer" : m === "paystack" ? "Paystack" : "Card (Stripe)"}
            </button>
          ))}
        </div>
      </div>

      {method === "bank" ? (
        <StatusBanner
          className="mt-5"
          kind="pending"
          title="Bank transfer takes a little longer"
          description="Your subscription activates once payment is matched to your account — instant for card and Paystack, but bank transfer needs manual confirmation."
        />
      ) : (
        <Button className="mt-5" onClick={() => confirmPayment(false)}>
          Subscribe — {PLANS[0].price}
        </Button>
      )}
      {method === "bank" && (
        <Button className="mt-4" onClick={() => confirmPayment(true)}>
          I&apos;ve sent the transfer
        </Button>
      )}
    </div>
  );
}
