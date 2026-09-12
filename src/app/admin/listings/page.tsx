"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { AdminListingKindToggle, ListingKind } from "@/components/admin/AdminListingKindToggle";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AdminListingRow, useAdminListings } from "@/lib/admin-client";

const STATUS_FILTERS = ["all", "pending-review", "live", "rejected"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  "pending-review": "Pending",
  live: "Live",
  rejected: "Rejected",
};

// Pill visual style copied from AdminListingKindToggle.tsx above (same file
// reasoning: a scoped copy for this one axis rather than a shared
// abstraction with only one caller today).
function StatusFilterToggle({ status, onChange }: { status: StatusFilter; onChange: (status: StatusFilter) => void }) {
  return (
    <div
      role="group"
      aria-label="Filter by status"
      className="relative inline-flex shrink-0 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-dense)] p-1"
    >
      {STATUS_FILTERS.map((s) => {
        const selected = s === status;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(s)}
            className={`relative z-10 min-h-9 min-w-[88px] rounded-full px-4 text-center text-sm font-bold transition-colors duration-[var(--motion-duration-short)] ${
              selected ? "text-white" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {selected && (
              <motion.span
                aria-hidden
                layoutId="admin-listings-status-filter-indicator"
                transition={{ type: "spring", stiffness: 480, damping: 38, mass: 0.7 }}
                className="absolute inset-0 -z-10 rounded-full bg-[var(--color-brand-primary)] shadow-[var(--elevation-xs)]"
              />
            )}
            {STATUS_FILTER_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}

function ListingRows({
  rows,
  onApprove,
  onReject,
}: {
  rows: AdminListingRow[];
  onApprove: (row: AdminListingRow) => void;
  onReject: (row: AdminListingRow) => void;
}) {
  return (
    <ul className="mt-4 flex flex-col gap-1">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex flex-wrap items-center gap-2.5 rounded-[var(--radius-control)] border border-[var(--color-border-hairline)] px-3 py-1.5"
        >
          <StatusBadge
            kind={row.status === "live" ? "live" : row.status === "rejected" ? "rejected" : "pending"}
            dense
          />
          <p className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--color-text-primary)]">
            {row.title}
          </p>
          {row.status !== "live" && (
            <Button variant="secondary" size="dense" onClick={() => onApprove(row)}>
              Approve
            </Button>
          )}
          {row.status !== "rejected" && (
            <Button variant="destructive" size="dense" onClick={() => onReject(row)}>
              Reject
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function AdminListingsPage() {
  const { listings, approveListing, rejectListing } = useAdminListings();
  const [rejecting, setRejecting] = useState<AdminListingRow | null>(null);
  const [approving, setApproving] = useState<AdminListingRow | null>(null);
  const [kind, setKind] = useState<ListingKind>("property");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const query = search.trim().toLowerCase();
  const visible = listings.filter(
    (row) =>
      row.kind === kind &&
      (status === "all" || row.status === status) &&
      (!query || row.title.toLowerCase().includes(query))
  );
  const isFiltered = query.length > 0 || status !== "all";

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Listings</h1>
      <p className="mt-1.5 text-[var(--color-text-secondary)]">
        Every property listing, service listing, and advertisement — pending, live, or rejected.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <AdminListingKindToggle kind={kind} onChange={setKind} />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings by title"
          aria-label="Search listings by title"
          className="max-w-xs"
        />
        <StatusFilterToggle status={status} onChange={setStatus} />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          className="mt-6"
          title={
            isFiltered
              ? "No matching listings"
              : kind === "property"
                ? "No property listings"
                : kind === "service"
                  ? "No service listings"
                  : "No advertisements"
          }
          description={isFiltered ? "Try a different search or status filter." : undefined}
        />
      ) : (
        <ListingRows rows={visible} onApprove={setApproving} onReject={setRejecting} />
      )}

      <ConfirmationDialog
        open={approving !== null}
        title={approving ? `Approve "${approving.title}"?` : ""}
        description="It becomes visible to the public immediately."
        confirmLabel="Approve"
        destructive={false}
        onCancel={() => setApproving(null)}
        onConfirm={() => {
          if (approving) approveListing(approving.id);
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
          if (rejecting) rejectListing(rejecting.id);
          setRejecting(null);
        }}
      />
    </div>
  );
}
