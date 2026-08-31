"use client";

import { RoleOverview } from "@/components/dashboard/RoleOverview";

/**
 * The Service Provider landing page — see the note in
 * app/dashboard/landlord/page.tsx; same contract, other role.
 *
 * Named /dashboard/services because that is the destination the revision
 * names. The provider's actual listing management stays at
 * /dashboard/service-listing, which is a sibling, not a child — the exact-or-
 * child matching in lib/roles.ts keeps the two route prefixes from capturing
 * one another.
 */
export default function ServiceProviderDashboardPage() {
  return <RoleOverview role="service-provider" />;
}
