"use client";

import { useState } from "react";
import { AdminListFilters, AdminStatusFilter, filterAdminRows } from "@/components/admin/AdminListFilters";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminAds } from "@/lib/admin-mock-data";
import { Ad } from "@/lib/ads-context";

export default function AdminAdsPage() {
  const { ads, approveAd, rejectAd } = useAdminAds();
  const [rejecting, setRejecting] = useState<Ad | null>(null);
  const [approving, setApproving] = useState<Ad | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AdminStatusFilter>("all");

  const visible = filterAdminRows(ads, search, status);
  const isFiltered = search.trim().length > 0 || status !== "all";

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Ads</h1>
      <p className="mt-1.5 text-[var(--color-text-secondary)]">
        Every submitted advertisement — pending, live, or rejected.
      </p>

      <div className="mt-4">
        <AdminListFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search ads by title"
          status={status}
          onStatusChange={setStatus}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          className="mt-6"
          title={isFiltered ? "No matching advertisements" : "No advertisements"}
          description={isFiltered ? "Try a different search or status filter." : undefined}
        />
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {visible.map((ad) => (
            <li
              key={ad.id}
              className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-hairline)] px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusBadge
                  kind={ad.status === "live" ? "live" : ad.status === "rejected" ? "rejected" : "pending"}
                  dense
                />
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--color-text-primary)]">
                  {ad.title}
                </p>
                {ad.status !== "live" && (
                  <Button variant="secondary" size="dense" onClick={() => setApproving(ad)}>
                    Approve
                  </Button>
                )}
                {ad.status !== "rejected" && (
                  <Button variant="destructive" size="dense" onClick={() => setRejecting(ad)}>
                    Reject
                  </Button>
                )}
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
            </li>
          ))}
        </ul>
      )}

      <ConfirmationDialog
        open={approving !== null}
        title={approving ? `Approve "${approving.title}"?` : ""}
        description="It becomes visible to the public immediately."
        confirmLabel="Approve"
        destructive={false}
        onCancel={() => setApproving(null)}
        onConfirm={() => {
          if (approving) approveAd(approving.id);
          setApproving(null);
        }}
      />

      <ConfirmationDialog
        open={rejecting !== null}
        title={rejecting ? `Reject "${rejecting.title}"?` : ""}
        description="It will no longer be visible to the public."
        confirmLabel="Reject"
        onCancel={() => setRejecting(null)}
        onConfirm={() => {
          if (rejecting) rejectAd(rejecting.id);
          setRejecting(null);
        }}
      />
    </div>
  );
}
