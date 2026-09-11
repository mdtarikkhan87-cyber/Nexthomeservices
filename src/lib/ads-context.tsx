"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { ContentItemState } from "./types";

// ---------------------------------------------------------------------------
// Ads — a real shared Context, not a static array, because dashboard/ads is a
// genuine non-admin consumer of this data: an admin approving/rejecting an ad
// must be visible from the advertiser's own "My Advertisements" page too.
// Mirrors listings-context.tsx's shape. Ads moderation was explicitly
// deferred in the original admin pass (IMPLEMENTATION_NOTES.md #2) — this is
// that follow-up.
//
// Unlike listings, there is no separate static catalog to merge with session
// submissions — this seed array is the whole source of truth, so status
// updates apply directly to it rather than through an override map.
// ---------------------------------------------------------------------------

export interface Ad {
  id: string;
  title: string;
  /** The ad's body text, as the advertiser wrote it. */
  copy: string;
  /** Destination URL the ad promotes. */
  link: string;
  /**
   * String, not a File — the submission form's file input is a labeled
   * placeholder (no FileReader/upload wiring), so this is always "" today.
   * The shape is real now so admin has something to review beyond a title.
   */
  imageUrl: string;
  status: ContentItemState;
}

const INITIAL_ADS: Ad[] = [
  {
    id: "a1",
    title: "Bright Spark Electrical — homepage banner",
    copy: "Licensed electricians, same-day callouts across Lagos. Free quotes.",
    link: "https://brightsparkelectrical.example.com",
    imageUrl: "",
    status: "pending-review",
  },
  {
    id: "a2",
    title: "Lagos Movers Co. — listings sidebar",
    copy: "Moving house? We handle packing, transport, and setup in one booking.",
    link: "https://lagosmovers.example.com",
    imageUrl: "",
    status: "live",
  },
  {
    id: "a3",
    title: "Yaba Furniture Mart — search results banner",
    copy: "Affordable furniture for new tenants — beds, sofas, and dining sets in stock.",
    link: "https://yabafurnituremart.example.com",
    imageUrl: "",
    status: "pending-review",
  },
  {
    id: "a4",
    title: "SwiftFix Plumbing — homepage banner",
    copy: "24/7 emergency plumbing. Landlord and tenant call-outs welcome.",
    link: "https://swiftfixplumbing.example.com",
    imageUrl: "",
    status: "live",
  },
  {
    id: "a5",
    title: "QuickCarry Logistics — homepage banner",
    copy: "Same-day courier and small-load delivery across Lagos and Ogun state.",
    link: "https://quickcarrylogistics.example.com",
    imageUrl: "",
    status: "rejected",
  },
  {
    id: "a6",
    title: "GreenLeaf Cleaning Services — search results banner",
    copy: "Move-in and move-out deep cleaning, booked in under a minute.",
    link: "https://greenleafcleaning.example.com",
    imageUrl: "",
    status: "pending-review",
  },
];

export interface SubmitAdInput {
  title: string;
  copy: string;
  link: string;
  imageUrl: string;
}

interface AdsContextValue {
  ads: Ad[];
  submitAd: (data: SubmitAdInput) => void;
  approveAd: (id: string) => void;
  rejectAd: (id: string) => void;
}

const AdsContext = createContext<AdsContextValue | null>(null);

export function AdsProvider({ children }: { children: ReactNode }) {
  const [ads, setAds] = useState<Ad[]>(INITIAL_ADS);

  const submitAd = useCallback((data: SubmitAdInput) => {
    setAds((prev) => [...prev, { id: `ad-${Date.now()}`, ...data, status: "pending-review" }]);
  }, []);

  const setStatus = useCallback((id: string, status: ContentItemState) => {
    setAds((prev) => prev.map((ad) => (ad.id === id ? { ...ad, status } : ad)));
  }, []);

  const approveAd = useCallback((id: string) => setStatus(id, "live"), [setStatus]);
  const rejectAd = useCallback((id: string) => setStatus(id, "rejected"), [setStatus]);

  const value = useMemo(
    () => ({ ads, submitAd, approveAd, rejectAd }),
    [ads, submitAd, approveAd, rejectAd]
  );

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds() {
  const ctx = useContext(AdsContext);
  if (!ctx) throw new Error("useAds must be used within AdsProvider");
  return ctx;
}
