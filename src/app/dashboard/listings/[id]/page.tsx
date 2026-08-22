"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { mockListings } from "@/lib/mock-data";

export default function ListingManagementDetail({ params }: PageProps<"/dashboard/listings/[id]">) {
  const { id } = use(params);
  const listing = mockListings.find((l) => l.id === id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unpublished, setUnpublished] = useState(false);

  if (!listing) notFound();

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3">
        <StatusBadge kind={unpublished ? "pending" : listing.status === "live" ? "live" : listing.status === "rejected" ? "rejected" : "pending"} />
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">{listing.title}</h1>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)] sm:grid-cols-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Price</p>
          <p className="mt-1 font-bold text-[var(--color-text-primary)]">
            {listing.currency === "NGN" ? "₦" : "$"}
            {new Intl.NumberFormat("en-NG").format(listing.price)}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Bedrooms</p>
          <p className="mt-1 font-bold text-[var(--color-text-primary)]">{listing.bedrooms}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">Views</p>
          <p className="mt-1 font-bold text-[var(--color-text-primary)]">{listing.status === "live" ? listing.viewCount : "—"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">State</p>
          <p className="mt-1 font-bold text-[var(--color-text-primary)]">{listing.state}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-[var(--color-text-secondary)]">{listing.description}</p>

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" size="dense">
          Edit Listing
        </Button>
        {!unpublished && (
          <Button variant="destructive" size="dense" onClick={() => setConfirmOpen(true)}>
            Unpublish
          </Button>
        )}
      </div>

      <ConfirmationDialog
        open={confirmOpen}
        title="Unpublish this listing?"
        description="It will no longer be visible to tenants or buyers. You can resubmit it later."
        confirmLabel="Unpublish"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setUnpublished(true);
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}
