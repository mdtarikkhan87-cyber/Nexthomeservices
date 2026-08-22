"use client";

import Link from "next/link";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Button } from "@/components/ui/Button";
import { mockListings } from "@/lib/mock-data";
import { useListings } from "@/lib/listings-context";

export default function MyListingsPage() {
  // Listings submitted in this session sit alongside the seeded catalog, so
  // completing the wizard has a visible result instead of ending in a
  // confirmation screen that leads nowhere.
  const { submitted } = useListings();

  // Status-first ordering: pending/rejected surfaced before live (DESIGN_SYSTEM.md §12)
  const sorted = [...submitted, ...mockListings].sort((a, b) => {
    const order = { rejected: 0, "pending-review": 1, live: 2 } as const;
    return order[a.status] - order[b.status];
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">My Listings</h1>
        <Link href="/dashboard/listings/new">
          <Button size="dense">List Your Property</Button>
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {sorted.map((l) => (
          <PropertyCard key={l.id} listing={l} variant="dashboard" />
        ))}
      </div>
    </div>
  );
}
