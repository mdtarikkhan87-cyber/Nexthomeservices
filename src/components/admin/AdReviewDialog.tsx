"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Overlay } from "@/components/ui/Overlay";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { AdminAdReview, fetchAdReview } from "@/lib/admin-client";

type LoadState = { status: "loading" } | { status: "error" } | { status: "loaded"; review: AdminAdReview };

// Unlike the document dialog, a broken/placeholder ad image does NOT block
// Approve/Reject — the headline and link are still fully reviewable text,
// and an ad that fails to render an image is itself useful signal for an
// admin to act on, not a reason to block them from acting at all.
export function AdReviewDialog({
  open,
  adId,
  fallbackTitle,
  onClose,
  onApprove,
  onReject,
}: {
  open: boolean;
  adId: string;
  /** The combined "{headline} — {advertiser}" title already known from the
      list row — shown immediately, before the real detail finishes loading. */
  fallbackTitle: string;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  useBodyScrollLock(open);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [imageFailed, setImageFailed] = useState(false);

  const load = () => {
    setState({ status: "loading" });
    setImageFailed(false);
    fetchAdReview(adId)
      .then((review) => setState({ status: "loaded", review }))
      .catch(() => setState({ status: "error" }));
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState({ status: "loading" });
    setImageFailed(false);
    fetchAdReview(adId)
      .then((review) => {
        if (!cancelled) setState({ status: "loaded", review });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, adId]);

  if (!open) return null;

  const review = state.status === "loaded" ? state.review : null;
  const imageUnavailable = !review || review.isPlaceholder || imageFailed;

  return (
    <Overlay onDismiss={onClose} labelledBy="ad-review-title" maxWidth="max-w-xl">
      <h2 id="ad-review-title" className="text-lg font-bold text-[var(--color-text-primary)]">
        {review?.headline ?? fallbackTitle}
      </h2>

      <div className="mt-4">
        {state.status === "loading" && (
          <div className="flex items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-dense)]/50 py-14">
            <span
              aria-hidden
              className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-brand-primary)] border-t-transparent"
            />
          </div>
        )}

        {state.status === "error" && (
          <EmptyState
            title="Couldn't load this ad"
            description="Something went wrong asking for it."
            action={
              <Button variant="secondary" size="dense" onClick={load}>
                Reload
              </Button>
            }
          />
        )}

        {state.status === "loaded" && (
          <div className="flex flex-col gap-3">
            {imageUnavailable ? (
              <EmptyState
                title="Image unavailable"
                description={
                  review!.isPlaceholder
                    ? "This was submitted before cloud storage was configured, so no real image was ever saved."
                    : "The image link is broken or the upload may not have finished — the text below is still accurate."
                }
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- a
              // public S3 URL, not a static asset next/image can optimize
              <img
                src={review!.imageUrl}
                alt={review!.headline}
                className="max-h-[360px] w-full rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] object-contain"
                onError={() => setImageFailed(true)}
              />
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                Link
              </p>
              <a
                href={review!.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm font-bold text-[var(--color-brand-primary)] hover:underline"
              >
                {review!.linkUrl}
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" size="dense" onClick={onClose}>
          Close
        </Button>
        <Button variant="destructive" size="dense" onClick={onReject}>
          Reject
        </Button>
        <Button variant="primary" size="dense" onClick={onApprove}>
          Approve
        </Button>
      </div>
    </Overlay>
  );
}
