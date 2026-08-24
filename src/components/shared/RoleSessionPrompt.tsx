"use client";

import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Overlay } from "@/components/ui/Overlay";
import { IconArrowRight, IconHome, IconMegaphone, IconMessageCircle, IconShield } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth-context";
import { ROLE_BLURBS, roleDisplay, roleLandingHref } from "@/lib/roles";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { RoleName } from "@/lib/types";

// ---------------------------------------------------------------------------
// "How do you want to act today?" — the once-per-session role prompt.
//
// Website Revision Spec §3B, verbatim: "A user holding multiple roles is
// prompted to choose an active role only once, at the start of a fresh session
// (e.g. after logging in following a logout or expired session) — never on
// every page load."
//
// Everything about *when* this appears is decided in lib/auth-context.tsx
// (`needsSessionRoleChoice`), not here — this component renders the decision,
// it does not make it. That separation is what guarantees "never on every page
// load": there is no per-render condition in this file that could reintroduce
// nagging.
//
// NOTE — this is a NEW mechanism, not previously in PRODUCT_DECISIONS.md §8,
// where role switching was manual and user-initiated only. It needs its own
// decision entry; see REVISION_LOG.md.
// ---------------------------------------------------------------------------

const ROLE_ICONS: Record<RoleName, typeof IconHome> = {
  "tenant-buyer": IconHome,
  landlord: IconShield,
  "service-provider": IconMessageCircle,
  advertiser: IconMegaphone,
};

/** Where each role lands, said plainly. A prompt that asks you to choose
    without saying what either choice does is a quiz, not a control. */
const ROLE_DESTINATION: Record<RoleName, string> = {
  "tenant-buyer": "Takes you to Listings",
  landlord: "Takes you to your Landlord dashboard",
  "service-provider": "Takes you to your Service dashboard",
  advertiser: "Takes you to your Advertiser dashboard",
};

/**
 * Pages where answering the prompt should also move the user to that role's
 * landing view. Spec §3B: "Active role determines the default landing view."
 *
 * It deliberately does NOT redirect from anywhere else. If someone opened a
 * shared listing link and signed in there, sweeping them off to a dashboard
 * because of a role choice would destroy the context the whole product works
 * to preserve (PRODUCT_DECISIONS.md §10). So the landing rule applies where
 * "landing" is actually what is happening — the entry points — and elsewhere
 * the choice quietly takes effect around the user, where they already are.
 */
const LANDING_ENTRY_POINTS = ["/", "/login"];

export function RoleSessionPrompt() {
  const { needsSessionRoleChoice, roles, activeRole, chooseSessionRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Belt and braces: auth-context never sets the flag for a single-role user,
  // and a prompt offering one option would be a dialog with no decision in it.
  const show = needsSessionRoleChoice && roles.length > 1;

  useBodyScrollLock(show);

  const choose = (role: RoleName) => {
    chooseSessionRole(role);
    if (LANDING_ENTRY_POINTS.includes(pathname)) {
      router.push(roleLandingHref(role));
    }
  };

  return (
    <AnimatePresence>
      {show && (
        // Dismissing (Escape / backdrop) keeps whichever role auth-context
        // pre-selected and settles the session, so the prompt never reappears
        // mid-visit. The choice stays fully available afterwards through the
        // persistent header switcher, which is the point of that switcher.
        <Overlay
          onDismiss={() => activeRole && chooseSessionRole(activeRole)}
          labelledBy="role-session-title"
        >
          <p className="u-label text-[var(--color-brand-primary-text)]">Welcome back</p>
          <h2 id="role-session-title" className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
            How do you want to act today?
          </h2>
          <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
            Your account holds more than one role. Pick the one you want to start in — you can switch
            any time from the header, without logging out.
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
                      {ROLE_DESTINATION[held.role]}
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
            Acting as a Landlord never hides Listings — you can browse homes in any role.
          </p>
        </Overlay>
      )}
    </AnimatePresence>
  );
}
