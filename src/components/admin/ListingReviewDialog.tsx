"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge, StatusKind } from "@/components/ui/StatusBadge";
import { ReviewDialogShell } from "./ReviewDialogShell";
import { useAdminReview } from "@/lib/use-admin-review";
import { AdminListingReview, AdminListingReviewPhoto, AdminUserRoleRow, fetchListingReview } from "@/lib/admin-client";
import { ContentItemState } from "@/lib/types";

const OWNER_STATE_BADGE: Record<AdminUserRoleRow["state"], { kind: StatusKind; label: string }> = {
  "role-verified": { kind: "verified", label: "Verified owner" },
  "pending-admin-document-review": { kind: "pending", label: "Owner pending review" },
  "role-added": { kind: "pending", label: "Owner not yet verified" },
};

// Placeholder photos (dev-mode URLs recorded before S3 was configured) are
// filtered out up front, same as a render failure — both mean "nothing to
// show for this one," not worth a separate per-photo message. A listing
// with zero displayable photos still shows a warning but never blocks
// Approve/Reject — the text details below are reviewable on their own.
function PhotoGallery({ photos }: { photos: AdminListingReviewPhoto[] }) {
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const displayable = photos.filter((p) => !p.isPlaceholder && !failedUrls.has(p.url));

  if (photos.length === 0) {
    return (
      <EmptyState
        title="No photos"
        description="This listing has no photos on file — the details below are still reviewable."
      />
    );
  }
  if (displayable.length === 0) {
    return (
      <EmptyState
        title="Photos unavailable"
        description="Every photo on file is a placeholder or failed to load — the details below are still reviewable."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {displayable.map((photo, i) => (
        // A public S3 URL, not a static asset next/image can optimize.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={photo.url}
          src={photo.url}
          alt={`Photo ${i + 1}`}
          className="max-h-[320px] w-full rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] object-contain"
          onError={() => setFailedUrls((prev) => new Set(prev).add(photo.url))}
        />
      ))}
    </div>
  );
}

export function ListingReviewDialog({
  open,
  kind,
  id,
  status,
  fallbackTitle,
  onClose,
  onApprove,
  onReject,
}: {
  open: boolean;
  kind: "property" | "service";
  id: string;
  /** The row's current status — drives which action(s) the footer offers:
      pending shows both, live shows Reject only, rejected shows Approve
      only. Taken from the row, not the fetched detail, so the footer
      doesn't have to wait on the fetch to decide what it can offer. */
  status: ContentItemState;
  /** The row's already-known title, shown immediately before the real
      detail finishes loading. */
  fallbackTitle: string;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { state, reload } = useAdminReview<AdminListingReview>(() => fetchListingReview(kind, id));
  const review = state.status === "loaded" ? state.data : null;

  return (
    <ReviewDialogShell
      open={open}
      titleId="listing-review-title"
      title={review?.title ?? fallbackTitle}
      subtitle={
        review ? `Submitted ${new Date(review.submittedAt).toLocaleString()} by ${review.ownerName}` : undefined
      }
      state={state}
      errorTitle={`Couldn't load this ${kind}`}
      onReload={reload}
      onClose={onClose}
      renderBody={(data) => (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              kind={data.verified ? "verified" : "pending"}
              label={data.verified ? "Previously approved" : "Never approved"}
              dense
            />
            {data.ownerVerificationState && (
              <StatusBadge
                kind={OWNER_STATE_BADGE[data.ownerVerificationState].kind}
                label={OWNER_STATE_BADGE[data.ownerVerificationState].label}
                dense
              />
            )}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">{data.description}</p>
          <PhotoGallery photos={data.photos} />
        </div>
      )}
      footer={
        <>
          <Button variant="secondary" size="dense" onClick={onClose}>
            Close
          </Button>
          {status !== "rejected" && (
            <Button variant="destructive" size="dense" onClick={onReject}>
              Reject
            </Button>
          )}
          {status !== "live" && (
            <Button variant="primary" size="dense" onClick={onApprove}>
              Approve
            </Button>
          )}
        </>
      }
    />
  );
}
