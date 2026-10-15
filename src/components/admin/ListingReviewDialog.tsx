"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PhotoCarousel } from "@/components/ui/PhotoCarousel";
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

// One photo at a time (PhotoCarousel). A placeholder or broken photo shows an
// "Image unavailable" tile for that slide only, and a listing with no photos
// at all still shows a warning — neither ever blocks Approve/Reject, since the
// text details below are reviewable on their own.
function PhotoGallery({ photos, title }: { photos: AdminListingReviewPhoto[]; title: string }) {
  if (photos.length === 0) {
    return (
      <EmptyState
        title="No photos"
        description="This listing has no photos on file — the details below are still reviewable."
      />
    );
  }

  return <PhotoCarousel photos={photos} alt={title} fit="contain" />;
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
          <PhotoGallery photos={data.photos} title={data.title} />
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
