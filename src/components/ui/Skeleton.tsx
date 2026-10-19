import { cn } from "@/lib/utils";

// Grey placeholder shapes shown while content loads, shaped like what will
// replace them so the page doesn't jump when it arrives. The pulse is the only
// motion and stops for visitors who ask for reduced motion.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-[var(--radius-control)] bg-[color-mix(in_srgb,var(--color-deep-blue)_10%,transparent)] motion-reduce:animate-none", className)}
    />
  );
}

/** One property card: photo, title, location, price, facts. */
export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--color-surface-raised)] shadow-[var(--elevation-card)]">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-6 w-2/5" />
        <div className="flex gap-5 border-t border-[var(--color-border-hairline)] pt-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

/** A grid of property cards. */
export function ListingGridSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** The homepage ad slot: one wide card. */
export function AdSlotSkeleton() {
  return <Skeleton className="h-[360px] w-full rounded-[var(--radius-card)]" />;
}

/** A stack of dashboard list rows (listings, ads, conversations). */
export function RowListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] px-4 py-3.5"
        >
          <Skeleton className="h-6 w-16 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3.5 w-1/3" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      ))}
    </div>
  );
}

/** A row of stat tiles. */
export function StatRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-12" />
        </div>
      ))}
    </div>
  );
}
