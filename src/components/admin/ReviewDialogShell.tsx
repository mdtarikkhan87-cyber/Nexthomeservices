"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Overlay } from "@/components/ui/Overlay";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { AdminReviewState } from "@/lib/use-admin-review";

// Shared chrome for every admin review dialog: the Overlay, heading,
// loading spinner, and error state (with Reload) are identical across
// DocumentReviewDialog/AdReviewDialog/ListingReviewDialog — only the loaded
// body and the footer's action buttons differ, which is all a caller
// supplies here.
export function ReviewDialogShell<T>({
  open,
  titleId,
  title,
  subtitle,
  state,
  errorTitle = "Couldn't load this",
  errorDescription = "Something went wrong asking for it.",
  onReload,
  onClose,
  renderBody,
  footer,
}: {
  open: boolean;
  titleId: string;
  title: ReactNode;
  subtitle?: ReactNode;
  state: AdminReviewState<T>;
  errorTitle?: string;
  errorDescription?: string;
  onReload: () => void;
  onClose: () => void;
  renderBody: (data: T) => ReactNode;
  footer: ReactNode;
}) {
  useBodyScrollLock(open);
  if (!open) return null;

  return (
    <Overlay onDismiss={onClose} labelledBy={titleId} maxWidth="max-w-xl">
      <h2 id={titleId} className="text-lg font-bold text-[var(--color-text-primary)]">
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>}

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
            title={errorTitle}
            description={errorDescription}
            action={
              <Button variant="secondary" size="dense" onClick={onReload}>
                Reload
              </Button>
            }
          />
        )}

        {state.status === "loaded" && renderBody(state.data)}
      </div>

      <div className="mt-6 flex justify-end gap-3">{footer}</div>
    </Overlay>
  );
}
