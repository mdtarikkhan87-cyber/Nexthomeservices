"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconCheck } from "@/components/ui/icons";
import { ROLE_LABELS_SHORT } from "@/lib/roles";
import { RoleName } from "@/lib/types";

// ---------------------------------------------------------------------------
// "Switched to Landlord" — the transient acknowledgement for an AUTOMATIC role
// switch.
//
// It exists for exactly one situation: a deep link into a role-scoped route
// while acting as a different role the user also holds. The rule is switch and
// continue, never block — but a switch the user did not ask for and is not
// told about is a product changing state behind their back, which is the
// opposite of the "always name the state" principle this system is built on
// (DESIGN_INTENT.md Principle 2).
//
// WHY A TRANSIENT NOTICE IS ALLOWED HERE, given DESIGN_SYSTEM.md's two
// anti-toast rules:
//   §13 bars a toast for CONFIRMING a destructive action — those must block.
//   §14 bars a toast for PENDING state — that is persistent, and must stay on
//       screen as a first-class status.
// This is neither. It reports a completed, reversible, non-destructive change
// of view context, and the state it announces remains permanently visible in
// the header switcher afterwards. Nothing is only-ever-said-here.
//
// It is a NEW pattern in this system — flagged in REVISION_LOG.md rather than
// slipped in. Deliberately kept to one purpose: this is a role-switch
// announcer, not a general toast service, so it cannot become the place
// statuses go to be missed.
//
// Accessibility: role="status" + aria-live="polite" announces the switch to a
// screen reader without stealing focus (the user is mid-navigation). Motion is
// handled globally by <MotionConfig reducedMotion="user"> in providers.tsx.
// ---------------------------------------------------------------------------

const DISMISS_AFTER_MS = 4000;

interface RoleSwitchNoticeValue {
  /** Announce that the active role was switched automatically. */
  announceRoleSwitch: (role: RoleName) => void;
}

const RoleSwitchNoticeContext = createContext<RoleSwitchNoticeValue | null>(null);

export function useRoleSwitchNotice() {
  const ctx = useContext(RoleSwitchNoticeContext);
  if (!ctx) throw new Error("useRoleSwitchNotice must be used within RoleSwitchNoticeProvider");
  return ctx;
}

export function RoleSwitchNoticeProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<RoleName | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announceRoleSwitch = useCallback((next: RoleName) => {
    setRole(next);
  }, []);

  useEffect(() => {
    if (!role) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setRole(null), DISMISS_AFTER_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [role]);

  return (
    <RoleSwitchNoticeContext.Provider value={{ announceRoleSwitch }}>
      {children}
      {/* Below the modal layer (z-50) and above the sticky header (z-40): a
          notice must never sit on top of a dialog that is blocking the page. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[45] flex justify-center px-4">
        <AnimatePresence>
          {role && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-[var(--color-border-inverted)] bg-[var(--color-surface-inverted)] py-2.5 pl-3 pr-4 shadow-[var(--elevation-lg)]"
            >
              <span
                aria-hidden
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]"
              >
                <IconCheck className="h-3 w-3 text-white" />
              </span>
              <p className="u-ui text-[13px] text-[var(--color-text-on-dark)]">
                Switched to{" "}
                <span className="font-bold">{ROLE_LABELS_SHORT[role]}</span> so you can open this page
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RoleSwitchNoticeContext.Provider>
  );
}
