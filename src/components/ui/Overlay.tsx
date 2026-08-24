"use client";

import { ReactNode, useEffect, useRef } from "react";
import { motion } from "motion/react";

// Shared overlay chrome for AuthGate, ConfirmationDialog and the session role
// prompt. Reduced-motion behavior is handled globally via
// <MotionConfig reducedMotion="user"> in providers.tsx, not per-instance here
// (DESIGN_SYSTEM.md §16).
//
// ACCESSIBILITY PASS: this component announced itself as `aria-modal="true"`
// but behaved like a div — no Escape key, no focus movement, no focus trap, no
// focus restore. That is a modal in appearance only: a keyboard user could tab
// straight out of it into the page it was supposedly blocking, and a screen
// reader user was told the rest of the page was inert when it was not.
// DESIGN_SYSTEM.md §13 already required "dismiss on outside click/escape,
// consistent focus/keyboard behavior" — that requirement is now actually met,
// once, here, for every dialog in the product.
//
// Body scroll locking deliberately does NOT live here — see
// lib/use-body-scroll-lock.ts for why (short version: this component outlives
// its own dismissal by the length of an exit animation, and the page's
// scrollability must not depend on that animation finishing).
//
// NO EXIT ANIMATION, on purpose. Enter is animated — that is where the
// meaning is, anchoring the panel to the action that opened it
// (DESIGN_INTENT.md §8). Exit is not, because an exit animation keeps a
// `fixed inset-0` element with `aria-modal="true"` mounted after dismissal:
// invisible at opacity 0, but still spanning the viewport and still swallowing
// pointer events, and still a modal as far as a screen reader is concerned.
// If those frames are ever delayed — a backgrounded tab, an interrupted
// transition — the user is left with a page that silently ignores every
// click. Observed in testing, not theorised. Without an `exit` prop
// AnimatePresence unmounts the child immediately, which is also how a
// dismissal should feel: instant.
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
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Remember where focus came from so it can be put back on close —
    // otherwise dismissing a dialog drops the keyboard user at the top of the
    // document, having lost the control they were operating.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => el.offsetParent !== null);

    // Move focus into the dialog. The panel itself is the fallback target so
    // focus still lands inside even for a dialog that is pure text.
    const first = focusables()[0];
    (first ?? panelRef.current)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onDismiss();
        return;
      }
      if (e.key !== "Tab") return;

      // Cycle focus within the dialog rather than letting Tab walk out into
      // the page behind it.
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const active = document.activeElement as HTMLElement | null;
      const index = active ? items.indexOf(active) : -1;

      if (e.shiftKey && (index <= 0)) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && (index === items.length - 1 || index === -1)) {
        e.preventDefault();
        items[0].focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      previouslyFocused?.focus?.();
    };
  }, [onDismiss]);

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex justify-center bg-[var(--color-dark-blue)]/50 p-4 backdrop-blur-[2px] ${
        align === "bottom-on-mobile" ? "items-end sm:items-center" : "items-center"
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      role={role}
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={onDismiss}
    >
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        className={`w-full max-w-sm rounded-[var(--radius-modal)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--elevation-lg)] outline-none ${
          align === "bottom-on-mobile" ? "rounded-b-none sm:rounded-b-[var(--radius-modal)]" : ""
        }`}
        initial={{ opacity: 0, scale: 0.97, y: align === "bottom-on-mobile" ? 24 : 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
