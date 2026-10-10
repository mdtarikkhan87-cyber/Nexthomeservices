"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/auth-context";
import { useSocket } from "@/lib/socket-context";
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

// Shared by both REST snapshots of a conversation's history (the initial
// fetch, and the join-ack catch-up fetch below): merges a fresh snapshot
// with whatever's already in state for this same conversation, instead of
// blindly overwriting. `prev` can hold messages the snapshot doesn't know
// about yet — appended live via the socket after the snapshot was taken —
// so anything in `prev` belonging to this conversation and missing from
// `thread` is newer than the snapshot and gets kept, appended after it
// (the snapshot is already createdAt-ascending).
function mergeThreadSnapshot(prev: Message[], thread: Message[], conversationId: string): Message[] {
  const liveOnly = prev.filter(
    (m) => m.conversationId === conversationId && !thread.some((t) => t.id === m.id),
  );
  return liveOnly.length ? [...thread, ...liveOnly] : thread;
}

// COMPONENT_ARCHITECTURE.md §2: one shared Message Thread List/Composer
// pattern, reused identically across Landlord/Tenant/Service Provider
// (only the bound data differs).
function MessagesPageInner() {
  const { user } = useAuth();
  const socket = useSocket();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(searchParams.get("conversation"));

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Guards against out-of-order responses: `conversation-updated` socket
  // events (see below) can now fire this in rapid, externally-triggered
  // bursts, and ordinary network jitter means an earlier-issued request
  // can resolve AFTER a later one. Without this, that stale response's
  // setConversations would silently overwrite fresher state — a
  // conversation could flash back to "unread"/stale-preview right after a
  // newer refetch had already fixed it.
  const conversationsRequestSeq = useRef(0);
  // Coalesces overlapping calls into the one already in flight, instead of
  // firing a new request each time. Needed because two callers routinely
  // land within milliseconds of each other: send() explicitly refetches
  // after posting a message, and the server's own 'conversation-updated'
  // emit (sent to the sender's own room too, see conversations.routes.js)
  // triggers the socket-driven refetch below for that same send — without
  // this, every message sent would cost two GET /conversations calls. A
  // burst of several incoming messages collapses the same way.
  const inFlightConversationsFetch = useRef<Promise<ConversationSummary[]> | null>(null);
  const refetchConversations = useCallback(async () => {
    if (inFlightConversationsFetch.current) return inFlightConversationsFetch.current;
    const seq = ++conversationsRequestSeq.current;
    const promise = apiFetchConversations()
      .then((result) => {
        if (seq === conversationsRequestSeq.current) {
          setConversations(result);
        }
        return result;
      })
      .finally(() => {
        inFlightConversationsFetch.current = null;
      });
    inFlightConversationsFetch.current = promise;
    return promise;
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
        // See mergeThreadSnapshot: an unconditional setMessages(thread)
        // here would silently drop a message the live-socket effect below
        // already appended for this same activeId while this fetch was
        // still in flight (both start around the same time on a
        // conversation switch).
        setMessages((prev) => mergeThreadSnapshot(prev, thread, activeId));
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

  // Inbox-level live updates — a new message anywhere (not just the open
  // thread) bumps that conversation to the top with a fresh preview/unread
  // dot. The event only carries a conversationId (see conversations.
  // routes.js's emit) by design: rebuilding a full ConversationSummary
  // over the socket would duplicate toConversationSummary()'s shape-
  // building logic a second time, for no real benefit over just refetching.
  useEffect(() => {
    if (!socket) return;
    const onConversationUpdated = () => {
      // Every other call site of refetchConversations already sits inside
      // a try/catch (initial load, after sending, after marking read) —
      // this socket-triggered one is the exception, and it's reachable at
      // exactly the moment a network blip is most likely: a
      // 'conversation-updated' event can arrive the instant a dropped
      // connection re-establishes, before the REST API is reachable again,
      // producing an unhandled promise rejection with no user-visible
      // effect otherwise (a missed live refresh here is harmless — the
      // next real change retries it).
      refetchConversations().catch(() => {});
    };
    socket.on("conversation-updated", onConversationUpdated);
    return () => {
      socket.off("conversation-updated", onConversationUpdated);
    };
  }, [socket, refetchConversations]);

  // Live messages for whichever thread is actually open. Joining is
  // authorization-checked server-side (lib/socket.js), not just a client-
  // side room name — a socket can't listen in on a conversation it isn't
  // part of merely by knowing its id. Dedupes by message id rather than
  // skipping "messages I sent myself": the sender's own socket is in this
  // room too and receives the same broadcast back, which would otherwise
  // double up with the optimistic append already done in send() below.
  useEffect(() => {
    if (!socket || !activeId) return;
    let cancelled = false;

    // Re-joins on every (re)connection, not just once when this effect
    // first runs — socket.io-client auto-reconnects the same Socket object
    // after a transient drop (a brief network blip, the API redeploying),
    // but the server-side conversation:<id> room membership was tied to
    // the old, now-dead connection. Without this, live delivery for the
    // still-open thread would silently stop after any reconnect until the
    // user happened to switch away and back. Re-joining an already-joined
    // room is a harmless no-op server-side, so this can safely also fire
    // once for the very first connection alongside the immediate call
    // below, rather than needing to know which case it is.
    const join = () =>
      socket.emit("join-conversation", activeId, (ack?: { ok: boolean; error?: string }) => {
        if (cancelled) return;
        // lib/socket.js authorization-checks every join server-side; a
        // rejection (or a dropped ack) previously failed completely
        // silently — the thread just never received live messages, with
        // no error and no retry. Surfaced here rather than left silent, at
        // minimum for debugging, since this path is rare enough (a stale
        // activeId, or a transient DB error in the server's own check)
        // that a full retry/backoff UI would be over-building for it.
        if (!ack || !ack.ok) {
          console.error("Failed to join conversation room:", ack?.error);
          return;
        }
        // Catch-up fetch: connecting the socket and confirming the room
        // join both take a real round trip, during which the REST fetch
        // above may already have completed. A message the other
        // participant sends in that exact gap would be missed by BOTH
        // paths — too early for the REST snapshot, and the socket wasn't
        // in the room yet to receive its broadcast — and would otherwise
        // never appear until the thread was closed and reopened. Fires on
        // every (re)join, so it also catches anything missed during a
        // disconnect, not just on first load.
        apiFetchMessages(activeId)
          .then((thread) => {
            if (cancelled) return;
            setMessages((prev) => mergeThreadSnapshot(prev, thread, activeId));
          })
          .catch(() => {});
      });
    join();
    socket.on("connect", join);

    const onNewMessage = (message: Message) => {
      if (message.conversationId !== activeId) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    };
    socket.on("new-message", onNewMessage);
    return () => {
      cancelled = true;
      socket.emit("leave-conversation", activeId);
      socket.off("connect", join);
      socket.off("new-message", onNewMessage);
    };
  }, [socket, activeId]);

  const active = conversations.find((c) => c.id === activeId);

  const send = async () => {
    if (!activeId || !draft.trim()) return;
    setIsSending(true);
    try {
      const message = await apiSendMessage(activeId, draft.trim());
      // Dedup guard, same as the socket handler above: the server emits
      // `new-message` before it sends this REST response, so our own
      // socket (also joined to this conversation's room) can deliver this
      // exact message back to us before this await resolves. Without the
      // guard, both paths append it and React ends up with two elements
      // sharing one key.
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
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
