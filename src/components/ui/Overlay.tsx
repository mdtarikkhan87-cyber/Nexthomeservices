"use client";

import { ReactNode } from "react";
import { motion } from "motion/react";

// Shared overlay chrome for AuthGate and ConfirmationDialog — extracted
// during the audit pass (Phase 6) to remove the duplicated backdrop/panel
// markup that existed in both components. Reduced-motion behavior is
// handled globally via <MotionConfig reducedMotion="user"> in providers.tsx,
// not per-instance here (DESIGN_SYSTEM.md §16 / Phase 4 audit finding).
export function Overlay({
  onDismiss,
  children,
  align = "center",
  labelledBy,
  role = "dialog",
}: {
  onDismiss: () => void;
  children: ReactNode;
  align?: "center" | "bottom-on-mobile";
  labelledBy: string;
  role?: "dialog" | "alertdialog";
}) {
  return (
    <motion.div
      className={`fixed inset-0 z-50 flex justify-center bg-[var(--color-dark-blue)]/50 p-4 backdrop-blur-[2px] ${
        align === "bottom-on-mobile" ? "items-end sm:items-center" : "items-center"
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      role={role}
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={onDismiss}
    >
      <motion.div
        className={`w-full max-w-sm rounded-[var(--radius-modal)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--elevation-lg)] ${
          align === "bottom-on-mobile" ? "rounded-b-none sm:rounded-b-[var(--radius-modal)]" : ""
        }`}
        initial={{ opacity: 0, scale: 0.97, y: align === "bottom-on-mobile" ? 24 : 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: align === "bottom-on-mobile" ? 24 : 8 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
