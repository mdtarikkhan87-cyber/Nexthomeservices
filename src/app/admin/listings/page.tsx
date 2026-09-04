"use client";

import { useState } from "react";
import { AdminListingKindToggle, ListingKind } from "@/components/admin/AdminListingKindToggle";
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
  onApprove: (id: string) => void;
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
            <Button variant="secondary" size="dense" onClick={() => onApprove(row.id)}>
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
  const [kind, setKind] = useState<ListingKind>("property");

  const visible = listings.filter((row) => row.kind === kind);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Listings</h1>
      <p className="mt-1.5 text-[var(--color-text-secondary)]">
        Every property and service listing — pending, live, or rejected.
      </p>

      <div className="mt-4">
        <AdminListingKindToggle kind={kind} onChange={setKind} />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          className="mt-6"
          title={kind === "property" ? "No property listings" : "No service listings"}
        />
      ) : (
        <ListingRows rows={visible} onApprove={approveListing} onReject={setRejecting} />
      )}

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
