"use client";

import { RoleOverview } from "@/components/dashboard/RoleOverview";

/**
 * The Landlord landing page — where a Landlord is sent after signing in,
 * after answering the "Act as" prompt, and after switching into the role.
 *
 * A LANDING PAGE, NOT AN ACCESS BOUNDARY. Being sent here says nothing about
 * what else this account may open; the landlord keeps full access to public
 * browsing and to every shared route. What guards this route is RoleScoped in
 * the dashboard layout, which checks `user.roles.includes("landlord")` — the
 * permanent list, not whichever role happens to be active.
 */
export default function LandlordDashboardPage() {
  return <RoleOverview role="landlord" />;
}
