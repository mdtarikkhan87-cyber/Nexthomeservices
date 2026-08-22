"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuthGate } from "@/components/shared/AuthGate";

// SCREEN_BLUEPRINTS.md — Advertise With Us: public info, submission is gated.
export default function AdvertisePage() {
  const { requireAuth } = useAuthGate();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6 sm:py-20">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">Advertise on NextHome</h1>
      <p className="mt-3 text-[var(--color-text-secondary)]">
        Put your business, property, or service in front of visitors browsing NextHome. Submit your ad for
        review — our team sets placement, duration, and pricing, then you confirm before it goes live.
      </p>
      <Button
        className="mt-6"
        onClick={() =>
          requireAuth({
            actionLabel: "Log in or register to submit an advertisement",
            suggestedRole: "advertiser",
            onResume: () => router.push("/dashboard/ads/new"),
          })
        }
      >
        Start Your Ad
      </Button>
    </div>
  );
}
