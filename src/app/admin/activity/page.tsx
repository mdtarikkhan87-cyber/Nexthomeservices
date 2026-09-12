"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { Loader } from "@/components/ui/Loader";
import { useAdminActivity } from "@/lib/admin-client";
import { formatRelativeTime } from "@/lib/format-relative-time";

export default function AdminActivityPage() {
  const { entries, isLoading } = useAdminActivity();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Activity</h1>
      <p className="mt-1.5 text-[var(--color-text-secondary)]">
        A real, persisted record of moderation actions across every admin session, newest first.
      </p>

      {isLoading && entries.length === 0 ? (
        <Loader label="Loading activity…" className="mt-6" />
      ) : entries.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No activity yet"
          description="Actions taken across Users, Listings, and Complaints will show up here."
        />
      ) : (
        <ul className="mt-6 flex flex-col gap-1">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center gap-2.5 rounded-[var(--radius-control)] border border-[var(--color-border-hairline)] px-3 py-2.5"
            >
              <p className="font-bold text-[var(--color-text-primary)]">{entry.action}</p>
              <p className="min-w-0 flex-1 truncate text-[var(--color-text-secondary)]">{entry.itemTitle}</p>
              <p className="shrink-0 text-sm text-[var(--color-text-secondary)]">{entry.actorName}</p>
              <p className="shrink-0 text-sm text-[var(--color-text-secondary)]">
                {formatRelativeTime(entry.timestamp)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
