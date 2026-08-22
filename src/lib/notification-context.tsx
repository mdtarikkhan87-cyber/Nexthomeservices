"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { AppNotification, SEED_NOTIFICATIONS } from "./notifications";
import { useAuth } from "./auth-context";

// ---------------------------------------------------------------------------
// In-memory notification store, mirroring AuthProvider's shape on purpose.
//
// This is the ONLY file that would change when a real backend arrives: the
// `useState` seed becomes a fetch, `markRead` becomes a PATCH, and `notify`
// becomes a server event / socket push. Every consumer talks to this hook,
// never to the seed data directly.
//
// State is not persisted. That is deliberate rather than an omission — auth
// is itself in-memory (a reload logs you out), so persisted read-state would
// survive attached to a user who no longer exists in the session.
// ---------------------------------------------------------------------------

interface NotificationContextValue {
  /** Already scoped to the active role — consumers never filter themselves. */
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  /** Raise a notification for a real, in-session event. */
  notify: (n: Omit<AppNotification, "id" | "ago" | "read">) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, activeRole } = useAuth();
  const [all, setAll] = useState<AppNotification[]>(SEED_NOTIFICATIONS);

  // Role-aware by construction. A user holding several roles sees the feed of
  // whichever role is active — the same scoping the dashboard already applies
  // to nav, content and overview, so a landlord never sees advertiser events
  // and vice versa.
  const notifications = useMemo(() => {
    if (!isAuthenticated || !activeRole) return [];
    return all.filter((n) => n.role === activeRole);
  }, [all, isAuthenticated, activeRole]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markRead = useCallback((id: string) => {
    setAll((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  // Scoped to the active role's feed only — "mark all read" while viewing the
  // Landlord feed must not silently clear unread Advertiser events the user
  // hasn't seen.
  const markAllRead = useCallback(() => {
    setAll((prev) => prev.map((n) => (n.role === activeRole ? { ...n, read: true } : n)));
  }, [activeRole]);

  const notify = useCallback((n: Omit<AppNotification, "id" | "ago" | "read">) => {
    setAll((prev) => [
      { ...n, id: `n-live-${prev.length}-${n.kind}`, ago: "Just now", read: false },
      ...prev,
    ]);
  }, []);

  const value = useMemo(
    () => ({ notifications, unreadCount, markRead, markAllRead, notify }),
    [notifications, unreadCount, markRead, markAllRead, notify]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
