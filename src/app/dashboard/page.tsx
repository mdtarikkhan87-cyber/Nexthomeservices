"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoleOverview } from "@/components/dashboard/RoleOverview";
import { useAuth } from "@/lib/auth-context";
import { ROLE_DASHBOARD_HOME } from "@/lib/roles";

/**
 * The role-agnostic dashboard entry — "take me to my dashboard", whoever I am.
 *
 * Two of the four roles now have a NAMED home of their own
 * (/dashboard/landlord, /dashboard/services), so this hands over to those
 * rather than rendering the same overview at a second URL. The other two have
 * no named dashboard route — the client's landing list sends a Renter to
 * public /listings and an Advertiser to /dashboard/ads — so their overview is
 * rendered here, which is where their sidebar's "Overview" item points.
 * ROLE_DASHBOARD_HOME (lib/roles.ts) is the single table both this file and
 * DashboardNav read, so the redirect and the nav can never disagree.
 *
 * Access is NOT decided here. This route is shared — any signed-in user may
 * open it — and the role-scoped destinations enforce themselves through
 * RoleScoped in the dashboard layout.
 */
export default function DashboardHome() {
  const { activeRole } = useAuth();
  const router = useRouter();

  const home = activeRole ? ROLE_DASHBOARD_HOME[activeRole] : null;
  const redirectTo = home && home !== "/dashboard" ? home : null;

  useEffect(() => {
    // replace(), not push() — this entry point is a signpost, and leaving it
    // in history would make Back bounce the user straight forward again.
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (!activeRole || redirectTo) return null;

  return <RoleOverview role={activeRole} />;
}
