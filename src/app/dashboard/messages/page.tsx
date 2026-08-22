"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";

const THREADS = [
  { id: "t1", withName: "Adaeze Okafor", listingTitle: "2-Bedroom Flat, Lekki Phase 1", unread: true },
  { id: "t2", withName: "Tunde Balogun", listingTitle: "Studio Apartment, Yaba", unread: false },
];

// COMPONENT_ARCHITECTURE.md §2: one shared Message Thread List/Composer
// pattern, reused identically across Landlord/Tenant/Service Provider
// (only the bound data differs).
export default function MessagesPage() {
  const [activeId, setActiveId] = useState<string | null>(THREADS[0]?.id ?? null);
  const active = THREADS.find((t) => t.id === activeId);

  if (THREADS.length === 0) {
    return <EmptyState title="No messages yet" description="Conversations tied to your listings will show up here." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      <div className="flex flex-col divide-y divide-[var(--color-border-hairline)] rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] shadow-[var(--elevation-xs)]">
        {THREADS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`flex items-center gap-3 p-3.5 text-left transition-colors duration-[var(--motion-duration-short)] ${activeId === t.id ? "bg-[var(--color-surface-dense)]" : "hover:bg-[var(--color-surface-dense)]/50"}`}
          >
            <Avatar name={t.withName} size={36} />
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm ${t.unread ? "font-bold" : ""} text-[var(--color-text-primary)]`}>{t.withName}</p>
              <p className="truncate text-xs text-[var(--color-text-secondary)]">{t.listingTitle}</p>
            </div>
            {t.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand-primary)]" aria-hidden />}
          </button>
        ))}
      </div>

      {active && (
        <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)]">
          <p className="font-bold text-[var(--color-text-primary)]">{active.withName}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Re: {active.listingTitle}</p>
          <div className="my-4 flex-1 rounded-[var(--radius-control)] bg-[var(--color-surface-dense)] p-3.5 text-sm text-[var(--color-text-secondary)]">
            Hi! Is this still available? — {active.withName}
          </div>
          <p className="mb-1.5 text-xs text-[var(--color-text-secondary)]">
            Keep communication in the app — it&apos;s the only way we can help with disputes.
          </p>
          <Textarea placeholder="Write a reply…" rows={2} />
          <Button size="dense" className="mt-2 self-end">
            Send
          </Button>
        </div>
      )}
    </div>
  );
}
