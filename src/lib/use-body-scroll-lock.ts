"use client";

import { useEffect } from "react";

// ---------------------------------------------------------------------------
// Body scroll lock for modal surfaces.
//
// WHY THIS IS NOT INSIDE <Overlay>, WHICH IS WHERE IT OBVIOUSLY BELONGS:
//
// Overlay is rendered inside an <AnimatePresence>, so it stays mounted for the
// duration of its exit animation. A lock acquired on Overlay's mount is
// therefore only released when that exit animation finishes — which makes
// "can the user scroll the page again?" depend on an animation completing.
// If those frames never arrive (a backgrounded tab at the moment of dismissal,
// a stalled rAF loop, an interrupted transition), the page stays permanently
// unscrollable with no dialog on screen to explain why. That is a severe
// failure mode for a purely decorative dependency, and it was observed in
// testing, not theorised.
//
// So the lock is driven by the OWNER's logical open state instead. The owner
// flips a boolean; the lock follows that boolean immediately, whatever the
// animation is doing. Same rule as everywhere else in this pass: animation may
// never gate correctness.
//
// The counter exists because two locking surfaces can legitimately overlap
// (a confirmation dialog opened from inside the auth prompt). Restoring on the
// first release would unlock the page while a modal was still up.
// ---------------------------------------------------------------------------

let lockCount = 0;
let restoreValue = "";

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    if (lockCount === 0) {
      restoreValue = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) document.body.style.overflow = restoreValue;
    };
  }, [active]);
}
