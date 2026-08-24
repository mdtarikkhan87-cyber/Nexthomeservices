"use client";

import { AnimatePresence } from "motion/react";
import { Button } from "./Button";
import { Overlay } from "./Overlay";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";

// DESIGN_SYSTEM.md §13: always modal/blocking, never a dismissible toast;
// always names the specific consequence.
export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Keyed on `open`, not on the Overlay's mount lifetime — see
  // lib/use-body-scroll-lock.ts.
  useBodyScrollLock(open);

  return (
    <AnimatePresence>
      {open && (
        <Overlay onDismiss={onCancel} labelledBy="confirm-dialog-title" role="alertdialog">
          <h2 id="confirm-dialog-title" className="text-lg font-bold text-[var(--color-text-primary)]">
            {title}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{description}</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" size="dense" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant={destructive ? "destructive" : "primary"} size="dense" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </Overlay>
      )}
    </AnimatePresence>
  );
}
