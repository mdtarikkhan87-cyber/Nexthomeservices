"use client";

import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/shared/AuthGate";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

// COMPONENT_ARCHITECTURE.md §4: Dashboard Shell — one shared frame across
// all four roles; content and sub-nav are role-specific, structure is not.
//
// GUEST-ACCESS PASS: this route was already blocked to guests, but via its
// own hand-rolled EmptyState + "/login" link — a dead end that dropped the
// destination and never offered registration. It now uses the shared
// AuthRequired guard, so it prompts with the same UI as every other gated
// surface and logs the user in without leaving the page. Guarding the
// layout covers every /dashboard/* child route in one place.
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { activeRole } = useAuth();

  return (
    <AuthRequired
      title="Log in to open your dashboard"
      description="Your dashboard shows your listings, messages, and account status. Log in or create an account to continue — you'll land right here."
    >
      {activeRole && (
        <div className="mx-auto flex max-w-6xl flex-col lg:flex-row">
          <DashboardNav role={activeRole} />
          <div className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:py-10">{children}</div>
        </div>
      )}
    </AuthRequired>
  );
}
