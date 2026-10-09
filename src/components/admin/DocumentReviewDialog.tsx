"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Overlay } from "@/components/ui/Overlay";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { AdminDocumentReview, fetchUserDocument } from "@/lib/admin-client";
import { RoleName } from "@/lib/types";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; review: AdminDocumentReview };

const REASON_COPY: Record<NonNullable<AdminDocumentReview["reason"]>, string> = {
  "no-document": "No document on file.",
  placeholder:
    "This was submitted before cloud storage was configured, so nothing was actually saved. Ask the user to resubmit.",
  "not-found": "File not found in storage; it may have been uploaded before storage was set up.",
};

// Verifying without actually seeing the document defeats the point of this
// dialog, so Verify stays disabled until a document is confirmed viewable —
// Reject stays enabled either way (a missing/broken document is itself a
// legitimate reason to reject).
export function DocumentReviewDialog({
  open,
  userId,
  userName,
  role,
  roleLabel,
  onClose,
  onVerify,
  onReject,
}: {
  open: boolean;
  userId: string;
  userName: string;
  role: RoleName;
  roleLabel: string;
  onClose: () => void;
  onVerify: () => void;
  onReject: () => void;
}) {
  useBodyScrollLock(open);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [previewFailed, setPreviewFailed] = useState(false);

  const load = () => {
    setState({ status: "loading" });
    setPreviewFailed(false);
    fetchUserDocument(userId, role)
      .then((review) => setState({ status: "loaded", review }))
      .catch(() => setState({ status: "error" }));
  };

  // Re-fetch every time the dialog opens, never reused across opens — the
  // signed URL is only good for 5 minutes (see lib/s3.js), so a stale one
  // from a previous open could already be dead.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState({ status: "loading" });
    setPreviewFailed(false);
    fetchUserDocument(userId, role)
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
  }, [open, userId, role]);

  if (!open) return null;

  const review = state.status === "loaded" ? state.review : null;
  const canVerify = review?.available === true && !previewFailed;

  return (
    <Overlay onDismiss={onClose} labelledBy="document-review-title" maxWidth="max-w-xl">
      <h2 id="document-review-title" className="text-lg font-bold text-[var(--color-text-primary)]">
        {roleLabel} document — {userName}
      </h2>
      {review?.submittedAt && (
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Submitted {new Date(review.submittedAt).toLocaleString()}
        </p>
      )}

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
            title="Couldn't load this document"
            description="Something went wrong asking for it."
            action={
              <Button variant="secondary" size="dense" onClick={load}>
                Reload
              </Button>
            }
          />
        )}

        {state.status === "loaded" && !review!.available && (
          <EmptyState
            title="Document unavailable"
            description={REASON_COPY[review!.reason ?? "not-found"]}
            action={
              review!.reason === "not-found" ? (
                <Button variant="secondary" size="dense" onClick={load}>
                  Reload
                </Button>
              ) : undefined
            }
          />
        )}

        {state.status === "loaded" && review!.available && review!.url && (
          <div>
            {previewFailed ? (
              <EmptyState
                title="Couldn't display this file"
                description="The link may have expired."
                action={
                  <Button variant="secondary" size="dense" onClick={load}>
                    Reload
                  </Button>
                }
              />
            ) : review!.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- a
              // signed S3 URL, not a static asset next/image can optimize
              <img
                src={review!.url}
                alt={review!.fileName ?? "Submitted document"}
                className="max-h-[480px] w-full rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] object-contain"
                onError={() => setPreviewFailed(true)}
              />
            ) : review!.kind === "pdf" ? (
              <div className="flex flex-col gap-2">
                <iframe
                  src={review!.url}
                  title={review!.fileName ?? "Submitted document"}
                  className="h-[480px] w-full rounded-[var(--radius-card)] border border-[var(--color-border-hairline)]"
                  onError={() => setPreviewFailed(true)}
                />
                <a
                  href={review!.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start text-sm font-bold text-[var(--color-brand-primary)] hover:underline"
                >
                  Open in new tab
                </a>
              </div>
            ) : (
              <EmptyState
                title="Unsupported file type"
                description={review!.fileName ?? "This file can't be previewed here."}
                action={
                  <a
                    href={review!.url}
                    download={review!.fileName}
                    className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline"
                  >
                    Download
                  </a>
                }
              />
            )}
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
        <Button
          variant="primary"
          size="dense"
          disabled={!canVerify}
          title={!canVerify ? "The document must be visible before you can verify it." : undefined}
          onClick={onVerify}
        >
          Verify
        </Button>
      </div>
    </Overlay>
  );
}
