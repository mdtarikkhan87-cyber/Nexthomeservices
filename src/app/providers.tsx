"use client";

import { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationProvider } from "@/lib/notification-context";
import { ListingsProvider } from "@/lib/listings-context";
import { AuthGateProvider } from "@/components/shared/AuthGate";
import { Header } from "@/components/shared/Header";
import { RoleSessionPrompt } from "@/components/shared/RoleSessionPrompt";

// AUDIT FIX (Phase 4/5): the reduced-motion rule in globals.css only
// zeroes out CSS transition/animation durations — it has no effect on
// Motion's JS-driven transform/opacity animations (AuthGate,
// ConfirmationDialog), which use the `transition` prop, not CSS. Without
// this, a user with `prefers-reduced-motion: reduce` would still see full
// scale/slide motion on every modal — a real accessibility gap, now fixed
// at the root so every Motion component in the tree respects it automatically.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        {/* Inside AuthProvider — the notification feed is scoped to the
            active role, so it needs auth state to exist above it. */}
        <NotificationProvider>
          <ListingsProvider>
            <AuthGateProvider>
              <Header />
              {children}
              {/* The once-per-session "how do you want to act today?" prompt
                  (Website Revision Spec §3B). Mounted at the root, not per
                  page, because a session starts wherever the user happens to
                  be — and because mounting it once is what makes "only once
                  per session" structurally true rather than a thing every
                  page has to remember not to re-trigger. */}
              <RoleSessionPrompt />
            </AuthGateProvider>
          </ListingsProvider>
        </NotificationProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
