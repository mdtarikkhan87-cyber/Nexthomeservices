"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { PropertyListing } from "./types";
import {
  apiFetchMyListings,
  apiCreateListing,
  apiFetchSavedListings,
  apiSaveListing,
  apiUnsaveListing,
  CreateListingInput,
} from "./listings-client";
import { useAuth } from "./auth-context";

// ===========================================================================
// REAL BACKEND INTEGRATION (6 Sept 2026)
// ===========================================================================
// This file previously held an in-memory, per-session store — its own
// comments already documented the exact swap being made here: "When a
// backend arrives, addListing becomes POST /listings ... no consumer
// changes." That plan is followed as closely as the interface allows.
//
// What changed concretely:
//   - `submitted` (session-only array) is replaced by `myListings`, fetched
//     from GET /listings/mine — the landlord's REAL listings.
//   - `addListing(listing)` (took a fully client-constructed fake listing,
//     including a fake id) is replaced by `createListing(input)`, which
//     POSTs to the real backend and returns the server-assigned listing.
//     This had to change shape: a real id cannot be invented client-side.
//   - `resolveRooms` / `setRoomOccupied` / `setRoomAvailable` are REMOVED
//     from this context. They existed only to merge a local override map
//     on top of a static, never-refetched mock catalog — a real backend
//     doesn't have that staleness problem, so each consumer now reads
//     `listing.shared.rooms` directly off whatever real listing it already
//     fetched, and calls the new PATCH /listings/:id/rooms/:roomId endpoint
//     (via apiSetRoomStatus in listings-client.ts) directly when a landlord
//     changes a room's status. See dashboard/listings/[id]/page.tsx and
//     components/property/ListingFullDetail.tsx.
// ===========================================================================

interface ListingsContextValue {
  /** The signed-in landlord's own listings (any status), fetched from the
      real backend. Empty for a non-landlord or signed-out visitor. */
  myListings: PropertyListing[];
  isLoadingMyListings: boolean;
  refetchMyListings: () => Promise<void>;
  /** Creates a real listing via the backend, adds it to myListings, and
      returns the server-assigned listing (with its real id and status). */
  createListing: (input: CreateListingInput) => Promise<PropertyListing>;

  /** Any signed-in user's saved listings — not role-restricted, unlike
      myListings, since saving is a card-level toggle meaningful to anyone
      browsing regardless of their active role that day. */
  savedListings: PropertyListing[];
  savedListingIds: Set<string>;
  isLoadingSavedListings: boolean;
  refetchSavedListings: () => Promise<void>;
  saveListing: (id: string) => Promise<void>;
  unsaveListing: (id: string) => Promise<void>;
}

const ListingsContext = createContext<ListingsContextValue | null>(null);

export function ListingsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, roles } = useAuth();
  const isLandlord = roles.some((r) => r.role === "landlord");

  const [myListings, setMyListings] = useState<PropertyListing[]>([]);
  const [isLoadingMyListings, setIsLoadingMyListings] = useState(false);

  const refetchMyListings = useCallback(async () => {
    if (!isAuthenticated || !isLandlord) {
      setMyListings([]);
      return;
    }
    setIsLoadingMyListings(true);
    try {
      const listings = await apiFetchMyListings();
      setMyListings(listings);
    } catch {
      // Left as an empty/stale list rather than thrown — a failed fetch of
      // "my listings" shouldn't crash the page that renders alongside it.
    } finally {
      setIsLoadingMyListings(false);
    }
  }, [isAuthenticated, isLandlord]);

  // Written as a promise callback (not synchronous code in the effect body)
  // specifically to satisfy React's "no setState directly in an effect"
  // guidance: https://react.dev/learn/you-might-not-need-an-effect. Every
  // setState call here — including the "not a landlord" reset — happens
  // inside a .then()/.finally() callback, with the same `cancelled` guard
  // auth-context.tsx uses for its own mount-time fetch.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(async () => {
        if (!isAuthenticated || !isLandlord) {
          if (!cancelled) setMyListings([]);
          return;
        }
        if (!cancelled) setIsLoadingMyListings(true);
        try {
          const listings = await apiFetchMyListings();
          if (!cancelled) setMyListings(listings);
        } catch {
          // Left as an empty/stale list — see refetchMyListings above.
        } finally {
          if (!cancelled) setIsLoadingMyListings(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLandlord]);

  const createListing = useCallback(
    async (input: CreateListingInput) => {
      const created = await apiCreateListing(input);
      setMyListings((prev) => [created, ...prev]);
      return created;
    },
    [],
  );

  // Saved listings — same fetch-on-auth-change shape as myListings above,
  // but gated on isAuthenticated alone, not a role (see saved.routes.js).
  const [savedListings, setSavedListings] = useState<PropertyListing[]>([]);
  const [isLoadingSavedListings, setIsLoadingSavedListings] = useState(false);

  const refetchSavedListings = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedListings([]);
      return;
    }
    setIsLoadingSavedListings(true);
    try {
      setSavedListings(await apiFetchSavedListings());
    } catch {
      // Left stale/empty rather than thrown — matches myListings' own
      // reasoning: a failed fetch of saved listings shouldn't crash the
      // page that renders alongside it.
    } finally {
      setIsLoadingSavedListings(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (!isAuthenticated) {
        if (!cancelled) setSavedListings([]);
        return;
      }
      if (!cancelled) setIsLoadingSavedListings(true);
      try {
        const listings = await apiFetchSavedListings();
        if (!cancelled) setSavedListings(listings);
      } catch {
        // See refetchSavedListings above.
      } finally {
        if (!cancelled) setIsLoadingSavedListings(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const savedListingIds = useMemo(() => new Set(savedListings.map((l) => l.id)), [savedListings]);

  // Optimistic: the toggle button needs to flip instantly, not after a
  // round trip — reverted if the request actually fails. The listing
  // object itself isn't known here for a fresh save (only its id is), so a
  // save adds a minimal placeholder; refetchSavedListings (called by
  // dashboard/saved on mount) is what gives the dashboard page the real,
  // full record. Fine for the toggle's own purpose, which only ever checks
  // membership via savedListingIds.
  const saveListing = useCallback(async (id: string) => {
    setSavedListings((prev) => (prev.some((l) => l.id === id) ? prev : [{ id } as PropertyListing, ...prev]));
    try {
      await apiSaveListing(id);
    } catch (err) {
      setSavedListings((prev) => prev.filter((l) => l.id !== id));
      throw err;
    }
  }, []);

  const unsaveListing = useCallback(async (id: string) => {
    const previous = savedListings;
    setSavedListings((prev) => prev.filter((l) => l.id !== id));
    try {
      await apiUnsaveListing(id);
    } catch (err) {
      setSavedListings(previous);
      throw err;
    }
  }, [savedListings]);

  const value = useMemo(
    () => ({
      myListings,
      isLoadingMyListings,
      refetchMyListings,
      createListing,
      savedListings,
      savedListingIds,
      isLoadingSavedListings,
      refetchSavedListings,
      saveListing,
      unsaveListing,
    }),
    [
      myListings,
      isLoadingMyListings,
      refetchMyListings,
      createListing,
      savedListings,
      savedListingIds,
      isLoadingSavedListings,
      refetchSavedListings,
      saveListing,
      unsaveListing,
    ],
  );

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
}

export function useListings() {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error("useListings must be used within ListingsProvider");
  return ctx;
}