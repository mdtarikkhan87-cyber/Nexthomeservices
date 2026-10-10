"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReviewDialogShell } from "./ReviewDialogShell";
import { useAdminReview } from "@/lib/use-admin-review";
import { AdminDocumentReview, fetchUserDocument } from "@/lib/admin-client";
import { RoleName } from "@/lib/types";

const REASON_COPY: Record<NonNullable<AdminDocumentReview["reason"]>, string> = {
  "no-document": "No document on file.",
  placeholder:
    "This was submitted before cloud storage was configured, so nothing was actually saved. Ask the user to resubmit.",
  "not-found": "File not found in storage; it may have been uploaded before storage was set up.",
};

// Three ways this dialog can be opened:
//  - "actionable" (role in pending-admin-document-review): Verify + Reject,
//    Verify disabled until the document is confirmed viewable.
//  - "previous" (role-added, but a document from a PRIOR, already-rejected
//    submission is still on file): view-only, deliberately relabeled so an
//    admin doesn't mistake a stale file for a new pending one.
//  - "verified" (role-verified): view-only — the backend's reject route has
//    no state restriction, so this is viewable only by this UI's own
//    choice not to expose Reject here, not a backend limitation.
export type DocumentReviewMode =
  | { kind: "actionable"; onVerify: () => void; onReject: () => void }
  | { kind: "view-only"; variant: "previous" | "verified" };

export function DocumentReviewDialog({
  open,
  userId,
  userName,
  role,
  roleLabel,
  mode,
  onClose,
}: {
  open: boolean;
  userId: string;
  userName: string;
  role: RoleName;
  roleLabel: string;
  mode: DocumentReviewMode;
  onClose: () => void;
}) {
  const { state, reload } = useAdminReview<AdminDocumentReview>(() => fetchUserDocument(userId, role));
  const [previewFailed, setPreviewFailed] = useState(false);

  const handleReload = () => {
    setPreviewFailed(false);
    reload();
  };

  const review = state.status === "loaded" ? state.data : null;
  const canVerify = review?.available === true && !previewFailed;
  const isPrevious = mode.kind === "view-only" && mode.variant === "previous";

  return (
    <ReviewDialogShell
      open={open}
      titleId="document-review-title"
      title={isPrevious ? "Previous document" : `${roleLabel} document — ${userName}`}
      subtitle={
        isPrevious
          ? `${roleLabel} — ${userName}`
          : review?.submittedAt
            ? `Submitted ${new Date(review.submittedAt).toLocaleString()}`
            : undefined
      }
      state={state}
      errorTitle="Couldn't load this document"
      onReload={handleReload}
      onClose={onClose}
      renderBody={(data) => (
        <div className="flex flex-col gap-3">
          {isPrevious && (
            <p className="text-sm font-bold text-[var(--color-text-secondary)]">
              Waiting for the user to submit a document.
            </p>
          )}
          {!data.available ? (
            <EmptyState
              title="Document unavailable"
              description={REASON_COPY[data.reason ?? "not-found"]}
              action={
                data.reason === "not-found" ? (
                  <Button variant="secondary" size="dense" onClick={handleReload}>
                    Reload
                  </Button>
                ) : undefined
              }
            />
          ) : previewFailed ? (
            <EmptyState
              title="Couldn't display this file"
              description="The link may have expired."
              action={
                <Button variant="secondary" size="dense" onClick={handleReload}>
                  Reload
                </Button>
              }
            />
          ) : data.kind === "image" ? (
            // A signed S3 URL, not a static asset next/image can optimize.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.url}
              alt={data.fileName ?? "Submitted document"}
              className="max-h-[480px] w-full rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] object-contain"
              onError={() => setPreviewFailed(true)}
            />
          ) : data.kind === "pdf" ? (
            <div className="flex flex-col gap-2">
              <iframe
                src={data.url}
                title={data.fileName ?? "Submitted document"}
                className="h-[480px] w-full rounded-[var(--radius-card)] border border-[var(--color-border-hairline)]"
                onError={() => setPreviewFailed(true)}
              />
              <a
                href={data.url}
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
              description={data.fileName ?? "This file can't be previewed here."}
              action={
                <a
                  href={data.url}
                  download={data.fileName}
                  className="text-sm font-bold text-[var(--color-brand-primary)] hover:underline"
                >
                  Download
                </a>
              }
            />
          )}
        </div>
      )}
      footer={
        mode.kind === "view-only" ? (
          <Button variant="secondary" size="dense" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="dense" onClick={onClose}>
              Close
            </Button>
            <Button variant="destructive" size="dense" onClick={mode.onReject}>
              Reject
            </Button>
            <Button
              variant="primary"
              size="dense"
              disabled={!canVerify}
              title={!canVerify ? "The document must be visible before you can verify it." : undefined}
              onClick={mode.onVerify}
            >
              Verify
            </Button>
          </>
        )
      }
    />
  );
}
