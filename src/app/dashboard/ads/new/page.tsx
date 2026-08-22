"use client";

import { useState } from "react";
import { useNotifications } from "@/lib/notification-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";

// IMPLEMENTATION NOTE: whether pricing is shown before or after admin sets
// custom terms is unresolved (SCREEN_BLUEPRINTS.md Readiness Check item 7).
// This screen shows a "pending terms" state after submission rather than
// assuming upfront self-serve pricing — a placeholder, not a decision.
export default function SubmitAdvertisementPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const { notify } = useNotifications();

  if (submitted) {
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Advertisement submitted</h1>
        <div className="mt-4">
          <StatusBanner
            kind="pending"
            title="Pending content review and terms"
            description="Our team will review your ad and set placement, duration, and cost. You'll confirm and pay once those terms are ready."
          />
        </div>
        <Button className="mt-5" onClick={() => router.push("/dashboard/ads")}>
          Back to My Advertisements
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Submit Advertisement</h1>
      <form
        className="mt-5 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          notify({
            role: "advertiser",
            kind: "content-status",
            title: "Advertisement submitted",
            body: "We're reviewing your submission and will confirm placement and terms.",
            href: "/dashboard/ads",
            status: "pending",
          });
        }}
      >
        <div>
          <Label htmlFor="ad-title">Ad title</Label>
          <Input id="ad-title" required placeholder="What is this ad promoting?" />
        </div>
        <div>
          <Label htmlFor="ad-copy">Ad text</Label>
          <Textarea id="ad-copy" required rows={3} />
        </div>
        <div>
          <Label htmlFor="ad-link">Link</Label>
          <Input id="ad-link" type="url" required placeholder="https://" />
        </div>
        <div>
          <Label htmlFor="ad-image">Image</Label>
          <input id="ad-image" type="file" accept="image/*" className="block w-full rounded-[var(--radius-control)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-3 text-sm" />
        </div>
        <Button type="submit" className="self-start">
          Submit for review
        </Button>
      </form>
    </div>
  );
}
