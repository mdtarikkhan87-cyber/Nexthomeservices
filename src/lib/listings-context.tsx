"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { PropertyListing } from "./types";

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

interface ListingsContextValue {
  /** Listings created in this session, newest first. */
  submitted: PropertyListing[];
  addListing: (listing: PropertyListing) => void;
}

const ListingsContext = createContext<ListingsContextValue | null>(null);

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [submitted, setSubmitted] = useState<PropertyListing[]>([]);

  const addListing = useCallback((listing: PropertyListing) => {
    setSubmitted((prev) => [listing, ...prev]);
  }, []);

  const value = useMemo(() => ({ submitted, addListing }), [submitted, addListing]);

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
}

export function useListings() {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error("useListings must be used within ListingsProvider");
  return ctx;
}
