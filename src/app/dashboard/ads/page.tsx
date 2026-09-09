"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Advertisement } from "@/lib/types";
import { apiFetchMyAds } from "@/lib/ads-client";

export default function MyAdvertisementsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Written as a promise callback (not synchronous code in the effect body)
  // to satisfy React's "no setState directly in an effect" guidance — same
  // pattern as listings-context.tsx's refetchMyListings effect.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      try {
        const result = await apiFetchMyAds();
        if (!cancelled) setAds(result);
      } catch {
        if (!cancelled) setAds([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">My Advertisements</h1>
        <Link href="/dashboard/ads/new">
          <Button size="dense">Submit Advertisement</Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-secondary)]">Loading…</p>
      ) : ads.length === 0 ? (
        <EmptyState title="No advertisements yet" description="Submit your first ad to start reaching NextHome visitors." />
      ) : (
        <div className="flex flex-col gap-3">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--elevation-xs)]"
            >
              <StatusBadge kind={ad.status === "live" ? "live" : ad.status === "rejected" ? "rejected" : "pending"} dense />
              <p className="font-bold text-[var(--color-text-primary)]">{ad.headline}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
