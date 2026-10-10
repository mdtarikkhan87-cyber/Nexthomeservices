"use client";

import { useEffect, useState } from "react";

export type AdminReviewState<T> =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; data: T };

// Shared fetch/load-state plumbing for every admin review dialog
// (DocumentReviewDialog, AdReviewDialog, ListingReviewDialog, …) — each one
// is always mounted fresh per open by its caller (`{reviewing && <Dialog
// .../>}`), never kept alive across a different id/role/kind, so this only
// ever needs to fetch once per mount and offer a manual reload.
export function useAdminReview<T>(fetchFn: () => Promise<T>) {
  const [state, setState] = useState<AdminReviewState<T>>({ status: "loading" });

  const reload = () => {
    setState({ status: "loading" });
    fetchFn()
      .then((data) => setState({ status: "loaded", data }))
      .catch(() => setState({ status: "error" }));
  };

  useEffect(() => {
    let cancelled = false;
    fetchFn()
      .then((data) => {
        if (!cancelled) setState({ status: "loaded", data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
    // Deliberately once per mount, not on every fetchFn identity change —
    // callers pass a fresh closure each render, and the "mounts fresh per
    // open" contract above means there is never a same-mount id change to
    // react to. Including fetchFn would just re-fetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, reload };
}
