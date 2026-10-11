"use client";

import { useEffect, useRef } from "react";
import { useSocket } from "./socket-context";

// Live updates over the app's single Socket.IO connection (socket-context.tsx).
// The server pushes a small event to the affected user's private room after a
// change has been committed (nexthome-api/src/lib/realtime.js); these types
// mirror those payloads. Nothing here polls.

/** Who caused the change. A notification is raised only for "admin" changes —
    the user's own action in another tab shouldn't be echoed back as news. */
export type LiveActor = "admin" | "self";

export interface RoleUpdatedEvent {
  role: string; // backend name, e.g. "tenant_buyer"
  state: "role_added" | "pending_admin_document_review" | "role_verified";
  subscriptionState: "inactive" | "pending_confirmation" | "active" | null;
  hasDocument: boolean;
  actor: LiveActor;
}

export interface AccountUpdatedEvent {
  name?: string;
  phone?: string | null;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  actor: LiveActor;
}

export interface ListingUpdatedEvent {
  id: string;
  title: string;
  type: "rent" | "sale";
  status: "pending_review" | "live" | "rejected";
  availability: "available" | "rented" | "sold";
  isPublished: boolean;
  verified: boolean;
  actor: LiveActor;
}

export interface ListingRemovedEvent {
  id: string;
  actor: LiveActor;
}

export interface SavedListingUpdatedEvent {
  id: string;
  actor: LiveActor;
}

export interface ServiceUpdatedEvent {
  id: string;
  category?: string;
  status?: "pending_review" | "live" | "rejected";
  verified?: boolean;
  removed?: boolean;
  actor: LiveActor;
}

export interface AdUpdatedEvent {
  id: string;
  headline?: string;
  status?: "pending_review" | "live" | "rejected";
  placement?: string | null;
  removed?: boolean;
  actor: LiveActor;
}

export type AdminQueueKind = "user-role" | "listing" | "complaint";
export interface AdminQueueChangedEvent {
  kind: AdminQueueKind;
}

/**
 * Runs `handler` whenever the server pushes `event` to this user. Subscribes
 * once per socket (the latest handler is always the one called, so callers can
 * pass an inline function without resubscribing on every render) and cleans up
 * on unmount. Does nothing while signed out / not yet connected.
 */
export function useLiveEvent<T>(event: string, handler: (payload: T) => void) {
  const socket = useSocket();
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });

  useEffect(() => {
    if (!socket) return;
    const listener = (payload: T) => latest.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}

/**
 * Runs `handler` each time the socket (re)connects, including the first
 * connection. Events pushed while the connection was down — or between a page's
 * first fetch and its socket connecting — are never replayed, so this is the
 * moment to resync from the server.
 */
export function useOnSocketConnect(handler: () => void) {
  const socket = useSocket();
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });

  useEffect(() => {
    if (!socket) return;
    const run = () => latest.current();
    socket.on("connect", run);
    // The socket may already be connected by the time this subscribes.
    if (socket.connected) run();
    return () => {
      socket.off("connect", run);
    };
  }, [socket]);
}
