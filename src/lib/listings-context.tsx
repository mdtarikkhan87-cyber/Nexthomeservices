"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { PropertyListing, RoomStatus, SharedRoom } from "./types";
import { roomsOf } from "./shared-property";

// ---------------------------------------------------------------------------
// In-memory store for listings created during this session.
//
// HONESTY NOTE — there is no backend in this project: no API routes, no
// server actions, no database, no blob storage. A submitted listing therefore
// cannot be persisted, and this file does not pretend otherwise. What it does
// give is a genuinely complete in-session flow: a listing submitted through
// the wizard really is constructed, really is validated, and really does
// appear in My Listings at "pending-review" — the same status a real backend
// would assign it, since admin review is actual product logic
// (PRODUCT_DECISIONS.md §6), not something invented here.
//
// It resets on reload, exactly like auth and notifications. When a backend
// arrives, `addListing` becomes POST /listings and `submitted` becomes the
// server's response — no consumer changes.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SHARED-PROPERTY ROOM AVAILABILITY (added 31 Aug 2026)
//
// Room status is LANDLORD-MANAGED. A renter's enquiry names a room; it does
// not claim one. Only the landlord marks a room occupied or available, from
// the listing management page that already handles listing status. No booking
// lifecycle was introduced — PRODUCT_DECISIONS.md §4.2 keeps the tenant
// interaction model on messaging, and PRD §14 defers booking entirely.
//
// Changes live here as an OVERRIDE MAP keyed by room id rather than by
// rewriting the catalog, because the catalog is a static import shared by the
// public browser, the detail page and the dashboard. One map, applied on read
// by resolveRooms(), keeps those surfaces from disagreeing about a room.
//
// Room ids embed their listing id (lib/shared-property.ts buildRooms), so
// keying on room id alone is unambiguous across the whole catalog.
// ---------------------------------------------------------------------------

interface ListingsContextValue {
  /** Listings created in this session, newest first. */
  submitted: PropertyListing[];
  addListing: (listing: PropertyListing) => void;
  /** The listing's rooms with this session's landlord changes applied. */
  resolveRooms: (listing: PropertyListing) => SharedRoom[];
  /** Conditional: marks a room occupied only if it is still available.
      Returns false if it had already been taken. */
  setRoomOccupied: (room: SharedRoom) => boolean;
  /** Puts a room back into the pool. */
  setRoomAvailable: (room: SharedRoom) => void;
}

const ListingsContext = createContext<ListingsContextValue | null>(null);

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [submitted, setSubmitted] = useState<PropertyListing[]>([]);
  const [roomStatus, setRoomStatus] = useState<Record<string, RoomStatus>>({});

  const addListing = useCallback((listing: PropertyListing) => {
    setSubmitted((prev) => [listing, ...prev]);
  }, []);

  const resolveRooms = useCallback(
    (listing: PropertyListing): SharedRoom[] =>
      roomsOf(listing).map((r) => ({ ...r, status: roomStatus[r.id] ?? r.status })),
    [roomStatus]
  );

  const setRoomOccupied = useCallback((room: SharedRoom): boolean => {
    let applied = false;

    setRoomStatus((prev) => {
      // ⇩ THE SWAP POINT. This one comparison-and-write is the whole
      // conditional update, and it is what becomes
      //     UPDATE rooms SET status='occupied'
      //      WHERE id=$1 AND status='available'
      // when there is a database — a single statement whose own WHERE clause
      // decides the winner, not a read followed by a write.
      //
      // Scope, stated plainly: `prev` is this tab's React state, so this is
      // correct within one tab and nothing more. Two browsers, or two devices,
      // cannot see each other's state at all — there is no server here. This
      // does not make concurrent writers safe; it puts the check in the one
      // place that becomes safe once a server exists.
      const current = prev[room.id] ?? room.status;
      if (current !== "available") {
        applied = false;
        return prev;
      }
      applied = true;
      return { ...prev, [room.id]: "occupied" };
    });

    return applied;
  }, []);

  const setRoomAvailable = useCallback((room: SharedRoom) => {
    setRoomStatus((prev) => ({ ...prev, [room.id]: "available" }));
  }, []);

  const value = useMemo(
    () => ({ submitted, addListing, resolveRooms, setRoomOccupied, setRoomAvailable }),
    [submitted, addListing, resolveRooms, setRoomOccupied, setRoomAvailable]
  );

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
}

export function useListings() {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error("useListings must be used within ListingsProvider");
  return ctx;
}
