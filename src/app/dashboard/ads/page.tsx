"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAds } from "@/lib/ads-context";

export default function MyAdvertisementsPage() {
  const { ads } = useAds();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">My Advertisements</h1>
        <Link href="/dashboard/ads/new">
          <Button size="dense">Submit Advertisement</Button>
        </Link>
      </div>

      {ads.length === 0 ? (
        <EmptyState title="No advertisements yet" description="Submit your first ad to start reaching NextHome visitors." />
      ) : (
        <div className="flex flex-col gap-3">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--elevation-xs)]"
            >
              <div className="flex items-center gap-3">
                <StatusBadge kind={ad.status === "live" ? "live" : ad.status === "rejected" ? "rejected" : "pending"} dense />
                <p className="font-bold text-[var(--color-text-primary)]">{ad.title}</p>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">{ad.copy}</p>
              <a
                href={ad.link}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sm font-bold text-[var(--color-brand-accent)] underline"
              >
                {ad.link}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
