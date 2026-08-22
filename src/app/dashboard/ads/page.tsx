import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContentItemState } from "@/lib/types";

const ADS: { id: string; title: string; status: ContentItemState }[] = [
  { id: "a1", title: "Bright Spark Electrical — homepage banner", status: "pending-review" },
];

export default function MyAdvertisementsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">My Advertisements</h1>
        <Link href="/dashboard/ads/new">
          <Button size="dense">Submit Advertisement</Button>
        </Link>
      </div>

      {ADS.length === 0 ? (
        <EmptyState title="No advertisements yet" description="Submit your first ad to start reaching NextHome visitors." />
      ) : (
        <div className="flex flex-col gap-3">
          {ADS.map((ad) => (
            <div
              key={ad.id}
              className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--elevation-xs)]"
            >
              <StatusBadge kind={ad.status === "live" ? "live" : ad.status === "rejected" ? "rejected" : "pending"} dense />
              <p className="font-bold text-[var(--color-text-primary)]">{ad.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
