"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuthGate } from "@/components/shared/AuthGate";
import { apiStartConversation } from "@/lib/messaging-client";

export function ServiceContactAction({
  serviceListingId,
  providerName,
}: {
  serviceListingId: string;
  providerName: string;
}) {
  const { requireAuth } = useAuthGate();
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No composer here — unlike ListingActions, this control has always been
  // a single button with no text field of its own. Starting a real
  // conversation needs real text somewhere, so this opens the conversation
  // and hands off to Messages to actually write it, rather than bolting a
  // second composer onto a component that was never shaped for one.
  const contact = () =>
    requireAuth({
      actionLabel: `Log in to message ${providerName}`,
      onResume: async () => {
        setError(null);
        setStarting(true);
        try {
          const conversation = await apiStartConversation({ serviceListingId });
          router.push(`/dashboard/messages?conversation=${conversation.id}`);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Couldn't start a conversation. Try again.");
          setStarting(false);
        }
      },
    });

  return (
    <div>
      {error && (
        <p className="mb-2 text-sm font-medium text-[var(--color-status-rejected)]" role="alert">
          {error}
        </p>
      )}
      <Button onClick={contact} disabled={starting}>
        {starting ? "Opening…" : `Message ${providerName}`}
      </Button>
    </div>
  );
}
