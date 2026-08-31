"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Overlay } from "@/components/ui/Overlay";
import { IconArrowRight, IconHome, IconMegaphone, IconMessageCircle, IconShield } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth-context";
import { ROLE_BLURBS, ROLE_DESTINATION_LABEL, roleDisplay, roleLandingHref } from "@/lib/roles";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { RoleName } from "@/lib/types";

// ---------------------------------------------------------------------------
// "How do you want to act today?" — the conditional role prompt.
//
// IT APPEARS ONLY WHEN THERE IS A GENUINE CHOICE TO MAKE. That is the whole
// rule, and every part of it is decided in lib/auth-context.tsx
// (`needsRoleChoice`), never here — this component renders a decision, it does
// not make one. That separation is what guarantees the prompt cannot creep
// back into page loads: there is no per-render condition in this file that
// could reintroduce nagging.
//
// What "a genuine choice" excludes:
//   • a single-role account — auto-selected, silently, always
//   • a multi-role account with a saved, still-valid preference in
//     localStorage["activeRole:" + user.id] — restored, silently
//
// CHOOSING NAVIGATES, unconditionally. The earlier version only redirected
// from a small allow-list of entry points, to avoid sweeping someone off a
// deep-linked listing. That guard is no longer needed and was actively wrong:
// the prompt now only appears when there is no saved preference — i.e. at the
// start of a genuinely fresh session — and a choice that leaves you exactly
// where you were is indistinguishable from no choice at all. Deep links into
// role-scoped routes are handled by RoleScoped instead, which switches the
// role in place and never shows this prompt.
// ---------------------------------------------------------------------------

const ROLE_ICONS: Record<RoleName, typeof IconHome> = {
  "tenant-buyer": IconHome,
  landlord: IconShield,
  "service-provider": IconMessageCircle,
  advertiser: IconMegaphone,
};

export function RoleSessionPrompt() {
  const { needsRoleChoice, user, roles, activeRole, chooseSessionRole } = useAuth();
  const router = useRouter();

  // Belt and braces: auth-context never sets the flag for a single-role user,
  // and a prompt offering one option would be a dialog with no decision in it.
  // The check reads user.roles — the permanent list — for the same reason the
  // switcher does.
  const show = needsRoleChoice && !!user && user.roles.length > 1;

  useBodyScrollLock(show);

  const choose = (role: RoleName) => {
    chooseSessionRole(role);
    router.push(roleLandingHref(role));
  };

  return (
    <AnimatePresence>
      {show && (
        // Dismissing (Escape / backdrop) keeps whichever role auth-context
        // pre-selected and settles the choice, so the prompt never reappears
        // mid-visit. It deliberately does NOT navigate — a dismissal is not a
        // selection, and someone who pressed Escape has not asked to be moved.
        // The choice stays fully available afterwards through the persistent
        // header switcher, which is the point of that switcher.
        <Overlay
          onDismiss={() => activeRole && chooseSessionRole(activeRole)}
          labelledBy="role-session-title"
        >
          <p className="u-label text-[var(--color-brand-primary-text)]">Welcome back</p>
          <h2 id="role-session-title" className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
            How do you want to act today?
          </h2>
          <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
            Your account holds more than one role. Pick the one you want to start in — we&apos;ll remember
            it, and you can switch any time from the header, without logging out.
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            {roles.map((held, i) => {
              const Icon = ROLE_ICONS[held.role];
              return (
                <motion.button
                  key={held.role}
                  type="button"
                  onClick={() => choose(held.role)}
                  // Options arrive in sequence rather than all at once, so the
                  // eye is led down the list instead of being handed a block
                  // to re-scan. Short and small — this is a decision the user
                  // wants to make quickly, not a reveal.
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + i * 0.05, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex min-h-11 w-full items-center gap-3.5 rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] p-3.5 text-left transition-[border-color,background-color,box-shadow] duration-[var(--motion-duration-short)] hover:border-[var(--color-brand-primary)] hover:bg-[color-mix(in_srgb,var(--color-brand-primary)_6%,transparent)] hover:shadow-[var(--elevation-xs)]"
                >
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-dense)] text-[var(--color-brand-primary-text)]"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-[var(--color-text-primary)]">
                      {roleDisplay(held.role, held.context)}
                    </span>
                    <span className="u-ui block truncate text-[13px] text-[var(--color-text-secondary)]">
                      {ROLE_BLURBS[held.role]}
                    </span>
                    <span className="u-label mt-1.5 block text-[var(--color-text-secondary)]">
                      {ROLE_DESTINATION_LABEL[held.role]}
                    </span>
                  </span>
                  <IconArrowRight
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition-transform duration-[var(--motion-duration-short)] group-hover:translate-x-0.5 group-hover:text-[var(--color-brand-primary-text)]"
                  />
                </motion.button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-[var(--color-text-secondary)]">
            This only picks where you start. Listings, messages and your account stay open to you in
            every role.
          </p>
        </Overlay>
      )}
    </AnimatePresence>
  );
}
