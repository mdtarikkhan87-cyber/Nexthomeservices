"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Overlay } from "@/components/ui/Overlay";
import { useAuth } from "@/lib/auth-context";
import { demoAccountForRoles } from "@/lib/demo-accounts";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { RoleName } from "@/lib/types";

// Implements PRODUCT_DECISIONS.md §9 / USER_JOURNEYS.md §3's canonical
// gated-action flow: capture the specific action + context, intercept
// in-place, name the action explicitly, then resume automatically where
// safe (§10 — non-financial actions auto-resume; this file only ever
// gates non-financial actions like Message/Save/Feedback, so auto-resume
// is always the correct behavior here).
//
// AUDIT FIX: the previous version dismissed the modal and navigated to
// /login or /register with no way back — "return to original context"
// was not actually implemented, only claimed. Login now happens inline
// (no navigation, so resume is immediate and exact). Register is a real
// multi-step flow that can't reasonably happen inline, so the return path
// is persisted and the user is sent back to this exact page afterward —
// see /register's use of `authReturnTo`. Re-opening the exact composer
// state after a full Register flow is not attempted here; that would need
// a real backend session and is out of scope for this frontend-only pass.
//
// GUEST-ACCESS PASS: browsing stays entirely public. What changed here is
// that this file now exposes ONE prompt in three shapes, so protected
// surfaces no longer each hand-roll their own check:
//
//   requireAuth()    — in-page actions (Save, Message, Submit). Modal.
//   <AuthRequired>   — whole protected routes/areas (dashboard, account).
//                      Same prompt, page-shaped instead of modal-shaped.
//   <ProtectedLink>  — links that *are* protected actions (Post Property),
//                      so the guest is prompted in place rather than
//                      navigated to a dead end and told "log in".
//
// All three share `AuthPrompt` below, so the copy, controls, inline-login
// behavior, and return-path handling can never drift apart.

interface PendingAction {
  actionLabel: string;
  suggestedRole?: RoleName;
  onResume: () => void;
}

interface AuthGateContextValue {
  requireAuth: (action: PendingAction) => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);
const RETURN_TO_KEY = "nexthome:auth-return-to";

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error("useAuthGate must be used within AuthGateProvider");
  return ctx;
}

/**
 * The single source of truth for what an auth prompt looks like and does.
 * Rendered inside an Overlay by the modal flow, and inline by AuthRequired.
 *
 * Login is deliberately INLINE (no navigation) so the user's context is
 * never lost: on a gated action the action resumes immediately, and on a
 * gated route the real page content simply appears in place.
 */
function AuthPrompt({
  titleId,
  title,
  description,
  suggestedRole,
  returnTo,
  onAuthenticated,
  onDismiss,
}: {
  titleId: string;
  title: string;
  description: string;
  suggestedRole?: RoleName;
  /** Path to come back to after the (multi-step, non-inline) Register flow. */
  returnTo: string;
  onAuthenticated?: () => void;
  /** Omitted for route guards — there is nothing to dismiss back to. */
  onDismiss?: () => void;
}) {
  const { login } = useAuth();
  const router = useRouter();
  const [loggingIn, setLoggingIn] = useState(false);

  const handleInlineLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo sign-in grants ONE role: the one this gate implies, or Renter for
    // the gates that imply none (Message, Feedback, the dashboard itself).
    //
    // Single-role is the right default here specifically because of the role
    // rules: one role means no "Act as" prompt, which means the gated action
    // resumes instantly and exactly, as PRODUCT_DECISIONS.md §10 requires.
    // Granting a multi-role account at this moment would interrupt the very
    // action the user was in the middle of with a dialog about roles.
    // Multi-role accounts are reachable from the demo picker on /login, and
    // from Add a Role on /account. Real credentials remain out of scope
    // (IMPLEMENTATION_NOTES.md #9).
    login(demoAccountForRoles([suggestedRole ?? "tenant-buyer"]));
    onAuthenticated?.(); // exact, in-place resume — no navigation occurred
  };

  const handleRegisterInstead = () => {
    sessionStorage.setItem(RETURN_TO_KEY, JSON.stringify({ returnTo, actionLabel: title }));
    router.push(`/register${suggestedRole ? `?role=${suggestedRole}` : ""}`);
  };

  return (
    <>
      <h2 id={titleId} className="text-lg font-bold text-[var(--color-text-primary)]">
        {title}
      </h2>

      {!loggingIn ? (
        <>
          <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{description}</p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button className="w-full" onClick={() => setLoggingIn(true)}>
              Log in
            </Button>
            <Button variant="secondary" className="w-full" onClick={handleRegisterInstead}>
              Create an account
            </Button>
            {onDismiss && (
              <Button variant="text" size="dense" onClick={onDismiss}>
                Not now
              </Button>
            )}
          </div>
        </>
      ) : (
        <form onSubmit={handleInlineLogin} className="mt-4 flex flex-col gap-3">
          <Input type="text" required placeholder="Email or phone" aria-label="Email or phone" />
          <Input type="password" required placeholder="Password" aria-label="Password" />
          <Button type="submit" className="w-full">
            Log in and continue
          </Button>
          <Button type="button" variant="text" size="dense" onClick={() => setLoggingIn(false)}>
            Back
          </Button>
        </form>
      )}
    </>
  );
}

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [pending, setPending] = useState<PendingAction | null>(null);

  // Driven by the logical open state, not by the modal's mount lifetime.
  useBodyScrollLock(pending !== null);

  const requireAuth = useCallback(
    (action: PendingAction) => {
      if (isAuthenticated) {
        action.onResume();
        return;
      }
      setPending(action);
    },
    [isAuthenticated]
  );

  const dismiss = () => setPending(null);

  return (
    <AuthGateContext.Provider value={{ requireAuth }}>
      {children}
      <AnimatePresence>
        {pending && (
          <Overlay onDismiss={dismiss} align="bottom-on-mobile" labelledBy="auth-prompt-title">
            <AuthPrompt
              titleId="auth-prompt-title"
              title={pending.actionLabel}
              description="Log in or create an account — we'll bring you right back to this exact spot."
              suggestedRole={pending.suggestedRole}
              returnTo={pathname}
              onDismiss={dismiss}
              onAuthenticated={() => {
                const resume = pending.onResume;
                setPending(null);
                resume();
              }}
            />
          </Overlay>
        )}
      </AnimatePresence>
    </AuthGateContext.Provider>
  );
}

/**
 * Route/area guard for protected surfaces (dashboard, account). Renders
 * `children` when authenticated; otherwise the same prompt as the modal,
 * shaped as a page panel.
 *
 * Replaces the ad-hoc "EmptyState + Log in link" checks these routes used
 * to hand-roll, which navigated away to /login and lost the user's
 * destination entirely. Because login here is inline, a guest who lands on
 * a protected route logs in and simply *sees the page* — no bounce, no
 * second navigation, nothing to re-find.
 */
export function AuthRequired({
  title,
  description,
  suggestedRole,
  children,
}: {
  title: string;
  description: string;
  suggestedRole?: RoleName;
  children: ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--elevation-xs)]">
        <AuthPrompt
          titleId="auth-required-title"
          title={title}
          description={description}
          suggestedRole={suggestedRole}
          returnTo={pathname}
        />
      </div>
      <p className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">
        Just looking?{" "}
        <Link href="/listings" className="font-bold text-[var(--color-brand-primary-text)] hover:underline">
          Browse listings
        </Link>{" "}
        or{" "}
        <Link href="/services" className="font-bold text-[var(--color-brand-primary)] hover:underline">
          find a service provider
        </Link>{" "}
        — no account needed.
      </p>
    </div>
  );
}

/**
 * A link whose destination is itself a protected action (e.g. "Post
 * Property" → the new-listing form). Guests get the prompt in place and
 * land on the destination once authenticated, instead of navigating into a
 * gated route only to be told to log in.
 *
 * Keeps a real `href` so the control stays a genuine link — focusable,
 * middle-clickable, and readable by assistive tech — and only intercepts
 * the plain left-click.
 */
export function ProtectedLink({
  href,
  actionLabel,
  suggestedRole,
  className,
  onClick,
  children,
}: {
  href: string;
  actionLabel: string;
  suggestedRole?: RoleName;
  className?: string;
  /** Side effect to run on activation regardless of auth state — e.g.
      closing the mobile menu the link lives in. */
  onClick?: () => void;
  children: ReactNode;
}) {
  const { requireAuth } = useAuthGate();
  const router = useRouter();

  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        onClick?.();
        // Let modified clicks (new tab/window) behave natively — the
        // destination route is guarded by AuthRequired anyway.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        requireAuth({ actionLabel, suggestedRole, onResume: () => router.push(href) });
      }}
    >
      {children}
    </Link>
  );
}

export function consumeAuthReturnTo(): { returnTo: string; actionLabel: string } | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(RETURN_TO_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(RETURN_TO_KEY);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
