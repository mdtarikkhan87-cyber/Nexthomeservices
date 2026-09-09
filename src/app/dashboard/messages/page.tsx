"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/auth-context";
import {
  apiFetchConversations,
  apiFetchMessages,
  apiMarkConversationRead,
  apiSendMessage,
  ConversationSummary,
  Message,
} from "@/lib/messaging-client";

function otherParticipant(conv: ConversationSummary, myUserId: string) {
  return conv.participantAId === myUserId
    ? { id: conv.participantBId, name: conv.participantBName }
    : { id: conv.participantAId, name: conv.participantAName };
}

function isUnread(conv: ConversationSummary, myUserId: string) {
  return Boolean(conv.lastMessageSenderId && conv.lastMessageSenderId !== myUserId && !conv.lastMessageReadAt);
}

// COMPONENT_ARCHITECTURE.md §2: one shared Message Thread List/Composer
// pattern, reused identically across Landlord/Tenant/Service Provider
// (only the bound data differs).
function MessagesPageInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(searchParams.get("conversation"));

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const refetchConversations = useCallback(async () => {
    const result = await apiFetchConversations();
    setConversations(result);
    return result;
  }, []);

  // Written as a promise callback (not synchronous code in the effect body)
  // to satisfy React's "no setState directly in an effect" guidance — same
  // pattern as listings-context.tsx's refetchMyListings effect.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      try {
        const result = await refetchConversations();
        // No ?conversation= deep link and nothing selected yet — default to
        // the most recently active thread, same as the mock's THREADS[0].
        if (!cancelled) {
          setActiveId((prev) => prev ?? result[0]?.id ?? null);
        }
      } catch {
        if (!cancelled) setConversations([]);
      } finally {
        if (!cancelled) setIsLoadingList(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refetchConversations]);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (!cancelled) setIsLoadingThread(true);
      try {
        const thread = await apiFetchMessages(activeId);
        if (cancelled) return;
        setMessages(thread);
        // Opening a thread reads it — mirrors any real messaging product,
        // and is what clears the unread dot in the list on the left.
        await apiMarkConversationRead(activeId);
        if (!cancelled) await refetchConversations();
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setIsLoadingThread(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeId, refetchConversations]);

  const active = conversations.find((c) => c.id === activeId);

  const send = async () => {
    if (!activeId || !draft.trim()) return;
    setIsSending(true);
    try {
      const message = await apiSendMessage(activeId, draft.trim());
      setMessages((prev) => [...prev, message]);
      setDraft("");
      await refetchConversations();
    } catch {
      // Left as a no-op failure — the draft stays in the box so nothing
      // typed is lost, and the user can just try Send again.
    } finally {
      setIsSending(false);
    }
  };

  if (isLoadingList) {
    return <p className="text-sm text-[var(--color-text-secondary)]">Loading your messages…</p>;
  }

  if (conversations.length === 0) {
    return <EmptyState title="No messages yet" description="Conversations tied to your listings will show up here." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      <div className="flex flex-col divide-y divide-[var(--color-border-hairline)] rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] shadow-[var(--elevation-xs)]">
        {conversations.map((conv) => {
          const other = user ? otherParticipant(conv, user.id) : { id: "", name: "" };
          const unread = user ? isUnread(conv, user.id) : false;
          return (
            <button
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={`flex items-center gap-3 p-3.5 text-left transition-colors duration-[var(--motion-duration-short)] ${activeId === conv.id ? "bg-[var(--color-surface-dense)]" : "hover:bg-[var(--color-surface-dense)]/50"}`}
            >
              <Avatar name={other.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${unread ? "font-bold" : ""} text-[var(--color-text-primary)]`}>{other.name}</p>
                <p className="truncate text-xs text-[var(--color-text-secondary)]">{conv.contextTitle}</p>
              </div>
              {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand-primary)]" aria-hidden />}
            </button>
          );
        })}
      </div>

      {active && user && (
        <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)]">
          <p className="font-bold text-[var(--color-text-primary)]">{otherParticipant(active, user.id).name}</p>
          <Link href={active.contextHref} className="text-xs text-[var(--color-text-secondary)] hover:underline">
            Re: {active.contextTitle}
          </Link>

          <div className="my-4 flex-1 space-y-2 overflow-y-auto">
            {isLoadingThread ? (
              <p className="text-sm text-[var(--color-text-secondary)]">Loading conversation…</p>
            ) : (
              messages.map((m) => {
                const mine = m.senderId === user.id;
                return (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-[var(--radius-control)] p-3.5 text-sm ${
                      mine
                        ? "ml-auto bg-[var(--color-brand-primary)] text-white"
                        : "bg-[var(--color-surface-dense)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {m.body}
                  </div>
                );
              })
            )}
          </div>

          <p className="mb-1.5 text-xs text-[var(--color-text-secondary)]">
            Keep communication in the app — it&apos;s the only way we can help with disputes.
          </p>
          <Textarea
            placeholder="Write a reply…"
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button size="dense" className="mt-2 self-end" onClick={send} disabled={isSending || !draft.trim()}>
            {isSending ? "Sending…" : "Send"}
          </Button>
        </div>
      )}
    </div>
  );
}

// useSearchParams requires a Suspense boundary in the App Router.
export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--color-text-secondary)]">Loading your messages…</p>}>
      <MessagesPageInner />
    </Suspense>
  );
}
