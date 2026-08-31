"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/shared/AuthGate";
import { RoleScoped } from "@/components/shared/RoleScoped";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { requiredRoleForPath } from "@/lib/roles";

// COMPONENT_ARCHITECTURE.md §4: Dashboard Shell — one shared frame across
// all four roles; content and sub-nav are role-specific, structure is not.
//
// GUEST-ACCESS PASS: this route was already blocked to guests, but via its
// own hand-rolled EmptyState + "/login" link — a dead end that dropped the
// destination and never offered registration. It now uses the shared
// AuthRequired guard, so it prompts with the same UI as every other gated
// surface and logs the user in without leaving the page. Guarding the
// layout covers every /dashboard/* child route in one place.
//
// ROLE-SELECTION REVISION (31 Aug 2026): the same "one place" argument now
// carries the ROLE check too. Two guards, in order, and the order matters:
//
//   AuthRequired — is there an account at all?
//   RoleScoped   — does that account HOLD the role this path requires?
//
// Which paths require which role is a table in lib/roles.ts, not a condition
// written here, so the answer is the same whether it is asked by this layout,
// by the nav, or by anything added later. Paths absent from that table
// (/dashboard, /dashboard/messages, /dashboard/notifications) are shared: any
// signed-in user, in any role.
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { activeRole } = useAuth();
  const pathname = usePathname();
  const requiredRole = requiredRoleForPath(pathname);

  return (
    <AuthRequired
      title="Log in to open your dashboard"
      description="Your dashboard shows your listings, messages, and account status. Log in or create an account to continue — you'll land right here."
    >
      {activeRole && (
        <div className="mx-auto flex max-w-6xl flex-col lg:flex-row">
          <DashboardNav role={activeRole} />
          <div className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:py-10">
            {requiredRole ? <RoleScoped requiredRole={requiredRole}>{children}</RoleScoped> : children}
          </div>
        </div>
      )}
    </AuthRequired>
  );
}
