"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { IconCheck, IconChevronDown } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABELS_SHORT, roleDisplay, roleLandingHref } from "@/lib/roles";
import { RoleName } from "@/lib/types";

// ---------------------------------------------------------------------------
// The persistent role switcher — "Viewing as: {role}".
//
// ⚠️ THIS AMENDS AN APPROVED RULE, deliberately and in the open.
// INFORMATION_ARCHITECTURE.md's "Role Switching Access" says role switching is
// "Reachable only from the Account/Profile area ... never from the primary
// global nav." The revision asks for exactly the opposite. Implemented as
// specified, because a switcher buried in a dropdown is not persistent in any
// sense the client would recognise — but recorded as a formal amendment rather
// than a silent override. See REVISION_LOG.md.
//
// IT RENDERS NOTHING FOR A SINGLE-ROLE USER. That is rule 1 of the role model,
// enforced structurally: the check is on `user.roles` — the PERMANENT list —
// so a control that offers one option can never appear, in any view context.
// This is the same list the route guards read, which is what keeps "can I
// switch to it?" and "may I open it?" answering consistently.
//
// SWITCHING NAVIGATES. It does not merely re-render: on change the switcher
// sets the active role, the auth context persists it to
// localStorage["activeRole:" + user.id], and this component sends the user to
// that role's landing page (lib/roles.ts). A switch that quietly re-skinned
// whatever page you were already on was the source of the "did that do
// anything?" hesitation the client described — a landlord switching to Renter
// while sitting on the subscription page has asked to go somewhere, not to
// have the same page relabelled.
//
// Navigation lives HERE rather than in setActiveRole for a specific reason:
// RoleScoped also switches the active role, when a deep link lands on a
// role-scoped route. That switch must NOT navigate — the whole point is to let
// the user through to where they were already going.
//
// It is also the ONLY role switcher in the product. The account dropdown's old
// "Active role" list was removed when this was added — two controls driving
// one piece of state is how they end up disagreeing.
// ---------------------------------------------------------------------------

export function RoleSwitcher({ variant = "header" }: { variant?: "header" | "drawer" }) {
  const { user, roles, activeRole, setActiveRole } = useAuth();
  const router = useRouter();
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

  // Rule 0: admin is not part of the role system at all (lib/auth-context.tsx
  // AuthUser.isAdmin) — there is nothing to switch between, so the control
  // must never appear for an admin session. Checked explicitly rather than
  // left to Rule 1 below: an admin user's `roles` happens to be empty today,
  // which would already suppress this incidentally, but that stops being true
  // the moment `roles` is ever populated for any reason, and this control has
  // no business existing for admin regardless.
  if (!user || user.isAdmin) return null;

  // Rule 1: one role is not a choice, so there is no control.
  if (user.roles.length < 2 || !activeRole) return null;

  const activeHeld = roles.find((r) => r.role === activeRole);

  const switchTo = (role: RoleName) => {
    if (role === activeRole) {
      setOpen(false);
      return;
    }
    setActiveRole(role);
    setOpen(false);
    router.push(roleLandingHref(role));
  };

  // The drawer variant is a flat list, not a dropdown — a menu inside an
  // already-open menu is a needless second layer on a small screen.
  if (variant === "drawer") {
    return (
      <div>
        <p className="u-label px-2 pb-1 pt-3 text-[var(--color-text-secondary)]">Viewing as</p>
        {roles.map((r) => {
          const selected = r.role === activeRole;
          return (
            <button
              key={r.role}
              onClick={() => switchTo(r.role)}
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
            current state, which is the whole job of "Viewing as". */}
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand-primary)]" />
        <span className="u-ui hidden text-[var(--color-text-secondary)] lg:inline">Viewing as</span>
        {/* The role name is animated on change so a switch made from the
            dashboard, or from the drawer, is visibly acknowledged up here too
            — otherwise the only feedback for switching role is that a page
            somewhere else quietly changed.

            NO AnimatePresence, and no exit animation. This label is the single
            place the product states which role the user is currently viewing
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
          Currently viewing as {activeHeld ? roleDisplay(activeHeld.role, activeHeld.context) : ""}. Change role.
        </span>
      </button>

      {/* NO EXIT ANIMATION on the menu below — see Overlay.tsx, and the account
          menu in Header.tsx. Picking a role from here now navigates, and the
          route change interrupts the exit before it finishes, stranding the
          menu open over the destination. */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
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
                  onClick={() => switchTo(r.role)}
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
            {/* Switching role is not logging out, and it does not close
                anything off — saying both removes the exact hesitation the
                client described in review. */}
            <p className="border-t border-[var(--color-border-hairline)] px-2 pb-1 pt-2.5 text-xs text-[var(--color-text-secondary)]">
              Switching keeps you signed in and takes you to that role&apos;s home. Listings stay open in
              every role.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
