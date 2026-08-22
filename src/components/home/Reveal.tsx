"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";

// Scroll reveal: a short fade with a small upward slide, fired once as the
// element enters view.
//
// DELIBERATELY RESTRAINED. The UX guidance is explicit that motion should
// cover one or two key elements per view, not everything that moves, so this
// wraps SECTION-LEVEL blocks only — never individual cards in a grid, which
// would produce a wave of movement on every scroll and make the page feel
// cheap rather than considered.
//
// Reduced motion is already handled globally by <MotionConfig
// reducedMotion="user"> in providers.tsx, which strips the transform while
// leaving the element rendered — so the final state is always readable and
// nothing depends on the animation having run. `once: true` means no
// re-animation on scroll-back, and there is no scroll-jacking or parallax.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Small stagger for a sibling that should follow, in seconds. */
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      // Hook for the <noscript> override in layout.tsx. Motion serialises
      // `initial` as an inline `opacity:0` during SSR, which means that
      // without JS these sections would be present in the DOM but invisible
      // on screen. The override restores them; JS users still get the reveal.
      data-reveal
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
