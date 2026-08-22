"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconArrowRight } from "@/components/ui/icons";
import { useNotifications } from "@/lib/notification-context";
import { KIND_LABELS } from "@/lib/notifications";

// Dedicated notifications screen.
//
// Lives under /dashboard so it inherits the existing AuthRequired guard in
// dashboard/layout.tsx — a notification feed is per-user data and must never
// be reachable by a guest. No separate auth check is added here; duplicating
// the guard is how the two copies eventually disagree.
//
// The feed arrives already scoped to the active role from the context, so
// this file contains no role logic of its own.
export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const visible = useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.read) : notifications),
    [notifications, filter]
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border-hairline)] pb-6">
        <div>
          <h1 className="u-heading text-2xl text-[var(--color-text-primary)] sm:text-3xl">Notifications</h1>
          <p className="u-ui mt-2 text-sm text-[var(--color-text-secondary)]">
            {unreadCount > 0
              ? `${unreadCount} unread update${unreadCount !== 1 ? "s" : ""} for this role.`
              : "You're all caught up."}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="secondary" size="dense" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* All / Unread — a real radiogroup, and the reason the page has a
          genuine empty state to reach even when the feed is populated. */}
      <div
        role="radiogroup"
        aria-label="Filter notifications"
        className="mt-6 inline-flex rounded-[var(--radius-control)] bg-[var(--color-surface-dense)] p-1"
      >
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            role="radio"
            aria-checked={filter === f}
            onClick={() => setFilter(f)}
            className={`u-ui rounded-[var(--radius-control)] px-4 py-2 text-[13px] font-semibold transition-colors duration-[var(--motion-duration-short)] ${
              filter === f
                ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-[var(--elevation-xs)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {f === "all" ? "All" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {visible.length === 0 ? (
          // Two genuinely different empty states — "nothing has ever happened"
          // and "nothing is outstanding" are different situations and a
          // single generic message would misreport one of them
          // (DESIGN_SYSTEM.md §14: always screen-specific copy).
          filter === "unread" ? (
            <EmptyState
              title="You're all caught up"
              description="Every notification for this role has been read. New updates will appear here."
              action={
                <Button variant="secondary" size="dense" onClick={() => setFilter("all")}>
                  View all notifications
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No notifications yet"
              description="Updates about your listings, enquiries and account will appear here as they happen."
            />
          )
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((n) => {
              const Row = (
                <>
                  {/* Unread marker. Never colour alone — the dot is paired
                      with a bolder title and a tinted surface, so the
                      distinction survives both greyscale and colour-blindness
                      (DESIGN_SYSTEM.md §7). */}
                  <span
                    aria-hidden
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.read ? "bg-transparent" : "bg-[var(--color-brand-primary)]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="u-label text-[var(--color-text-secondary)]">{KIND_LABELS[n.kind]}</span>
                      {n.status && <StatusBadge kind={n.status} dense />}
                      <span className="u-ui ml-auto shrink-0 text-[12px] text-[var(--color-text-secondary)]">
                        {n.ago}
                      </span>
                    </div>
                    <p
                      className={`mt-1.5 text-[var(--color-text-primary)] ${
                        n.read ? "font-medium" : "font-bold"
                      }`}
                    >
                      {n.title}
                      {!n.read && <span className="sr-only"> (unread)</span>}
                    </p>
                    <p className="u-ui mt-1 text-sm text-[var(--color-text-secondary)]">{n.body}</p>
                    {n.href && (
                      <span className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-[var(--color-brand-primary-text)]">
                        Open
                        <IconArrowRight className="h-3 w-3 transition-transform duration-[var(--motion-duration-short)] group-hover:translate-x-0.5" />
                      </span>
                    )}
                  </div>
                </>
              );

              const rowClass = `group flex w-full gap-3 rounded-[var(--radius-card)] border p-4 text-left transition-colors duration-[var(--motion-duration-short)] ${
                n.read
                  ? "border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)]"
                  : "border-[var(--color-brand-primary)]/25 bg-[var(--color-brand-primary)]/[0.04]"
              } hover:border-[var(--color-deep-blue)]`;

              return (
                <li key={n.id} className="relative">
                  {/* Opening a notification marks it read — the standard
                      contract, and it means the badge count can't drift from
                      what the user has actually seen. Rows without a
                      destination are still actionable as a plain button so
                      every notification can be dismissed from unread. */}
                  {n.href ? (
                    <Link href={n.href} onClick={() => markRead(n.id)} className={rowClass}>
                      {Row}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => markRead(n.id)} className={rowClass}>
                      {Row}
                    </button>
                  )}

                  {/* Explicit per-row control, so a notification can be
                      cleared without being forced to navigate away from the
                      list to do it. */}
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="u-ui absolute bottom-3 right-3 rounded-[var(--radius-control)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--color-text-secondary)] transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-surface-dense)] hover:text-[var(--color-text-primary)]"
                    >
                      Mark as read
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
