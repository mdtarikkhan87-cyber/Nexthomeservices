"use client";

import { useEffect } from "react";
import { Loader } from "@/components/ui/Loader";
import { PropertyCard } from "@/components/property/PropertyCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { useListings } from "@/lib/listings-context";

const contextCopy = { rent: "renting", sale: "buying" } as const;

export default function SavedHomesPage() {
  const { roles, setTenantBuyerContext } = useAuth();
  const { savedListings, isLoadingSavedListings, refetchSavedListings } = useListings();
  const current = roles.find((r) => r.role === "tenant-buyer");
  const context = current?.context ?? "rent";

  // The listings-context toggle on a card (see PropertyCard.tsx) only knows
  // the id it just saved, not the full record — refetch here for the real,
  // full listings this page actually needs to render.
  useEffect(() => {
    refetchSavedListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered by the active Renting/Buying context so the switch
  // (ROLE_EXPERIENCE_AUDIT.md §4 Option C) is functionally meaningful here,
  // not just cosmetic.
  const saved = savedListings.filter((l) => l.type === context);

  if (isLoadingSavedListings && savedListings.length === 0) {
    return <Loader label="Loading your saved homes…" />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Saved Homes</h1>
        <div className="inline-flex rounded-[var(--radius-control)] bg-[var(--color-surface-dense)] p-1">
          {(["rent", "sale"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setTenantBuyerContext(c)}
              aria-pressed={context === c}
              className={`rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-bold capitalize transition-colors ${
                context === c ? "bg-[var(--color-brand-primary)] text-white" : "text-[var(--color-text-secondary)]"
              }`}
            >
              {c === "rent" ? "Renting" : "Buying"}
            </button>
          ))}
        </div>
      </div>

      {saved.length === 0 ? (
        <EmptyState
          className="mt-5"
          title={`No saved homes for ${contextCopy[context]} yet`}
          description="Browse listings to save your favorites and compare them later."
        />
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {saved.map((l) => (
            <PropertyCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
