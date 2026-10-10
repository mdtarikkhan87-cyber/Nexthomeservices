"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReviewDialogShell } from "./ReviewDialogShell";
import { useAdminReview } from "@/lib/use-admin-review";
import { AdminAdReview, fetchAdReview } from "@/lib/admin-client";

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
  const { state, reload } = useAdminReview<AdminAdReview>(() => fetchAdReview(adId));
  const [imageFailed, setImageFailed] = useState(false);

  const handleReload = () => {
    setImageFailed(false);
    reload();
  };

  const review = state.status === "loaded" ? state.data : null;

  return (
    <ReviewDialogShell
      open={open}
      titleId="ad-review-title"
      title={review?.headline ?? fallbackTitle}
      state={state}
      errorTitle="Couldn't load this ad"
      onReload={handleReload}
      onClose={onClose}
      renderBody={(data) => {
        const imageUnavailable = data.isPlaceholder || imageFailed;
        return (
          <div className="flex flex-col gap-3">
            {imageUnavailable ? (
              <EmptyState
                title="Image unavailable"
                description={
                  data.isPlaceholder
                    ? "This was submitted before cloud storage was configured, so no real image was ever saved."
                    : "The image link is broken or the upload may not have finished — the text below is still accurate."
                }
              />
            ) : (
              // A public S3 URL, not a static asset next/image can optimize.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.imageUrl}
                alt={data.headline}
                className="max-h-[360px] w-full rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] object-contain"
                onError={() => setImageFailed(true)}
              />
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                Link
              </p>
              <a
                href={data.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm font-bold text-[var(--color-brand-primary)] hover:underline"
              >
                {data.linkUrl}
              </a>
            </div>
          </div>
        );
      }}
      footer={
        <>
          <Button variant="secondary" size="dense" onClick={onClose}>
            Close
          </Button>
          <Button variant="destructive" size="dense" onClick={onReject}>
            Reject
          </Button>
          <Button variant="primary" size="dense" onClick={onApprove}>
            Approve
          </Button>
        </>
      }
    />
  );
}
