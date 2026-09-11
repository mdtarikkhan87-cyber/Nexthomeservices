"use client";

import { useState } from "react";
import { AdminListingKindToggle, ListingKind } from "@/components/admin/AdminListingKindToggle";
import { AdminListFilters, AdminStatusFilter, filterAdminRows } from "@/components/admin/AdminListFilters";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AdminListingRow, useAdminListings } from "@/lib/admin-mock-data";

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
  const [status, setStatus] = useState<AdminStatusFilter>("all");

  const byKind = listings.filter((row) => row.kind === kind);
  const visible = filterAdminRows(byKind, search, status);
  const isFiltered = search.trim().length > 0 || status !== "all";

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Listings</h1>
      <p className="mt-1.5 text-[var(--color-text-secondary)]">
        Every property and service listing — pending, live, or rejected.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <AdminListingKindToggle kind={kind} onChange={setKind} />
        <AdminListFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search listings by title"
          status={status}
          onStatusChange={setStatus}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          className="mt-6"
          title={
            isFiltered
              ? "No matching listings"
              : kind === "property"
                ? "No property listings"
                : "No service listings"
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
