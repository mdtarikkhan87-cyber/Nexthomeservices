"use client";

import { motion } from "motion/react";
import { MODE_COPY } from "@/lib/listings-mode";
import { ListingType } from "@/lib/types";

const MODES: ListingType[] = ["rent", "sale"];

/**
 * The Buy/Rent control for the merged /listings page.
 *
 * Website Revision Spec §3C asks for "a toggle control, not tabs and not
 * separate routes" — so this is deliberately NOT the tab pattern. Tabs imply
 * two panels of one page; this switches which dataset the single panel is
 * showing, which is what a segmented toggle means. It is also the same
 * pill-toggle interaction already approved and shipped for the Renter/Buyer
 * context switch in the account area (PRODUCT_DECISIONS.md, "Renter/Buyer
 * Context Model", 2026-08-21), so the public page reuses a proven pattern
 * rather than introducing a second switching idiom.
 *
 * Accessibility, deliberately:
 *  - real <button>s carrying `aria-pressed`, not clickable divs, so the
 *    selected state is exposed to assistive tech and not just painted;
 *  - a labelled `role="group"` so the pair announces as one control;
 *  - the visible focus ring from globals.css is untouched.
 *
 * Motion: the moving indicator is a single shared layout element (`layoutId`),
 * so the highlight *travels* between the two options instead of cross-fading
 * in place — the movement is what tells you the two options are one control,
 * which is the only reason motion is here at all. State is set synchronously
 * on click and never gated on an animation finishing, so hammering the toggle
 * can't desynchronise the results from the control. Reduced-motion is honoured
 * globally by <MotionConfig reducedMotion="user"> in providers.tsx.
 */
export function ListingModeToggle({
  mode,
  onChange,
  size = "default",
  idPrefix = "listing-mode",
}: {
  mode: ListingType;
  onChange: (mode: ListingType) => void;
  size?: "default" | "dense";
  idPrefix?: string;
}) {
  const dense = size === "dense";

  return (
    <div
      role="group"
      aria-label="Show homes to rent or to buy"
      className={`relative inline-flex shrink-0 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-dense)] ${
        dense ? "p-0.5" : "p-1"
      }`}
    >
      {MODES.map((m) => {
        const selected = m === mode;
        return (
          <button
            key={m}
            type="button"
            id={`${idPrefix}-${m}`}
            aria-pressed={selected}
            onClick={() => onChange(m)}
            className={`relative z-10 rounded-full text-center font-bold transition-colors duration-[var(--motion-duration-short)] ${
              dense ? "min-w-[68px] px-3.5 py-1.5 text-[13px]" : "min-h-11 min-w-[104px] px-6 text-sm"
            } ${
              selected
                ? "text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {/* The travelling indicator. Rendered inside the selected button
                so it is positionally exact at any size, and marked aria-hidden
                because `aria-pressed` above already carries the state. */}
            {selected && (
              <motion.span
                aria-hidden
                layoutId={`${idPrefix}-indicator`}
                transition={{ type: "spring", stiffness: 480, damping: 38, mass: 0.7 }}
                className="absolute inset-0 -z-10 rounded-full bg-[var(--color-brand-primary)] shadow-[var(--elevation-xs)]"
              />
            )}
            {MODE_COPY[m].label}
          </button>
        );
      })}
    </div>
  );
}
