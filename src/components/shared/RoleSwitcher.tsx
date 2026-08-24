"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconCheck, IconChevronDown } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABELS_SHORT, roleDisplay } from "@/lib/roles";

// ---------------------------------------------------------------------------
// The persistent role switcher.
//
// Website Revision Spec §3B: "A persistent role switcher (e.g. 'Acting as:
// Renter — tap to switch' in the header/account menu) lets the user change
// their active role at any point mid-session, without logging out."
//
// ⚠️ THIS AMENDS AN APPROVED RULE, deliberately and in the open.
// INFORMATION_ARCHITECTURE.md's "Role Switching Access" says role switching is
// "Reachable only from the Account/Profile area ... never from the primary
// global nav." The spec asks for exactly the opposite. Implemented as the spec
// requires, because a switcher buried in a dropdown is not "persistent" in any
// sense the client would recognise — but recorded as a formal amendment rather
// than a silent override. See REVISION_LOG.md.
//
// It renders NOTHING for a single-role user: a control that offers one option
// is noise, and the spec's own model says a single-role user is placed into
// their role automatically and never asked about it.
//
// It is also the ONLY role switcher in the product now. The account dropdown's
// old "Active role" list was removed when this was added — two controls
// driving one piece of state is how they end up disagreeing.
// ---------------------------------------------------------------------------

export function RoleSwitcher({ variant = "header" }: { variant?: "header" | "drawer" }) {
  const { roles, activeRole, setActiveRole } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  if (roles.length < 2 || !activeRole) return null;

  const activeHeld = roles.find((r) => r.role === activeRole);

  // The drawer variant is a flat list, not a dropdown — a menu inside an
  // already-open menu is a needless second layer on a small screen.
  if (variant === "drawer") {
    return (
      <div>
        <p className="u-label px-2 pb-1 pt-3 text-[var(--color-text-secondary)]">Acting as</p>
        {roles.map((r) => {
          const selected = r.role === activeRole;
          return (
            <button
              key={r.role}
              onClick={() => setActiveRole(r.role)}
              aria-pressed={selected}
              className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-control)] px-2 text-left text-sm ${
                selected
                  ? "bg-[var(--color-surface-dense)] font-bold text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dense)]"
              }`}
            >
              {roleDisplay(r.role, r.context)}
              {selected && <IconCheck aria-hidden className="h-4 w-4 text-[var(--color-brand-primary-text)]" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] pl-2.5 pr-2 text-[13px] transition-colors duration-[var(--motion-duration-short)] hover:border-[var(--color-deep-blue)] sm:pl-3"
      >
        {/* A live dot, not a decorative one: it says this control reflects
            current state, which is the whole job of "Acting as". */}
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand-primary)]" />
        <span className="u-ui hidden text-[var(--color-text-secondary)] lg:inline">Acting as</span>
        {/* The role name is animated on change so a switch made from the
            dashboard, or from the drawer, is visibly acknowledged up here too
            — otherwise the only feedback for switching role is that a page
            somewhere else quietly changed.

            NO AnimatePresence, and no exit animation. This label is the single
            place the product states which role the user is currently acting
            as, and an exit-then-enter sequence means the NEW name does not
            appear until the OLD one has finished animating away. Testing
            caught exactly that: after switching to Landlord the control still
            read "Renter" while its own screen-reader text already said
            Landlord. A keyed element is swapped by React synchronously, so the
            name is correct immediately and Motion only animates its arrival. */}
        <motion.span
          key={activeRole}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="font-bold text-[var(--color-text-primary)]"
        >
          {ROLE_LABELS_SHORT[activeRole]}
        </motion.span>
        <IconChevronDown
          aria-hidden
          className={`h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)] transition-transform duration-[var(--motion-duration-short)] ${
            open ? "rotate-180" : ""
          }`}
        />
        <span className="sr-only">
          Currently acting as {activeHeld ? roleDisplay(activeHeld.role, activeHeld.context) : ""}. Change role.
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-60 origin-top-right rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-2 shadow-[var(--elevation-lg)]"
          >
            <p className="u-label px-2 pb-1.5 pt-1 text-[var(--color-text-secondary)]">Act as</p>
            {roles.map((r) => {
              const selected = r.role === activeRole;
              return (
                <button
                  key={r.role}
                  role="menuitem"
                  onClick={() => {
                    setActiveRole(r.role);
                    setOpen(false);
                  }}
                  className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-left text-sm ${
                    selected
                      ? "bg-[var(--color-surface-dense)] font-bold text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dense)]"
                  }`}
                >
                  {roleDisplay(r.role, r.context)}
                  {selected && (
                    <IconCheck aria-hidden className="h-4 w-4 shrink-0 text-[var(--color-brand-primary-text)]" />
                  )}
                </button>
              );
            })}
            {/* Switching role is not logging out, and saying so removes the
                exact hesitation the client described in review. */}
            <p className="border-t border-[var(--color-border-hairline)] px-2 pb-1 pt-2.5 text-xs text-[var(--color-text-secondary)]">
              Switching keeps you signed in. Listings stay available in every role.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
