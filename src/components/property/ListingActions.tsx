"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { IconStar } from "@/components/ui/icons";
import { useAuthGate } from "@/components/shared/AuthGate";
import { useAuth } from "@/lib/auth-context";

// PRD §6.4 / DESIGN_INTENT.md §5: Message Landlord is the dominant CTA on
// this screen. Unauthenticated users hit the gated-action flow
// (PRODUCT_DECISIONS.md §9); authenticated users get the composer directly.
//
// TRACKED ITEM #4 (IMPLEMENTATION_NOTES.md): messaging is gated on
// authentication only here, NOT on role-verified state. Whether a
// Landlord/Service Provider role in "pending admin document review" should
// be able to message/be messaged is unresolved — do not add a stricter
// gate here without resolving that question first.
export function ListingActions({ listingTitle }: { listingTitle: string }) {
  const { requireAuth } = useAuthGate();
  const { isAuthenticated } = useAuth();
  const [composerOpen, setComposerOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [saved, setSaved] = useState(false);

  const openComposer = () =>
    requireAuth({
      actionLabel: `Log in to message the landlord about "${listingTitle}"`,
      onResume: () => setComposerOpen(true),
    });

  const toggleSave = () =>
    requireAuth({
      actionLabel: `Log in to save "${listingTitle}"`,
      suggestedRole: "tenant-buyer",
      onResume: () => setSaved((v) => !v),
    });

  if (sent) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-status-verified)] bg-[color-mix(in_srgb,var(--color-status-verified)_8%,transparent)] p-4">
        <p className="font-bold text-[var(--color-status-verified)]">Message sent</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          The landlord will see your message in their dashboard and can reply from there.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!composerOpen ? (
        <Button onClick={openComposer} size="default">
          Message Landlord
        </Button>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-default)] p-4">
          <p className="mb-2 text-xs text-[var(--color-text-secondary)]">
            For your safety, keep communication in the app — this is the only way we can help resolve a
            dispute if something goes wrong (PRD §6.4).
          </p>
          <Textarea placeholder="Hi, I'm interested in this property. Is it still available?" rows={3} />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" size="dense" onClick={() => setComposerOpen(false)}>
              Cancel
            </Button>
            <Button size="dense" onClick={() => setSent(true)}>
              Send
            </Button>
          </div>
        </div>
      )}
      <button
        onClick={toggleSave}
        className="-mx-2.5 -my-1 inline-flex min-h-11 items-center gap-1.5 self-start rounded-[var(--radius-control)] px-2.5 py-1 text-sm font-bold text-[var(--color-brand-primary)] hover:underline"
        aria-pressed={saved}
      >
        <IconStar filled={saved} className="h-4 w-4" />
        {saved ? "Saved to your Saved Homes" : "Save this home"}
      </button>
      {!isAuthenticated && (
        <p className="text-xs text-[var(--color-text-secondary)]">You&apos;ll be asked to log in or register to continue.</p>
      )}
    </div>
  );
}
