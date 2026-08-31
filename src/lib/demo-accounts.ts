import { RoleName } from "./types";

// ---------------------------------------------------------------------------
// Demo sign-in identities.
//
// There is no backend and no credential validation (IMPLEMENTATION_NOTES.md
// #9). What these give the review is the one thing a single hard-coded demo
// user could not: three genuinely different SHAPES of account, so the
// conditional role prompt can actually be seen doing its job.
//
//   Renter only      → one role  → no prompt, no switcher, lands on /listings
//   Landlord only    → one role  → no prompt, no switcher, lands on the
//                                  landlord dashboard — and can still open
//                                  Listings, which is the point of the
//                                  shared/role-scoped split
//   Landlord + Renter → two roles → the "Act as" screen, then the switcher
//
// Each carries a STABLE `id`, because the saved active-role preference is
// keyed by it (`activeRole:<id>` in localStorage). Two demo accounts must not
// be able to overwrite each other's choice.
//
// VOCABULARY: the spec calls these "Tenant only / Landlord only / Landlord +
// Tenant". The role id is `tenant-buyer` and the label the product shows is
// "Renter" (lib/roles.ts) — the same role under the name the client uses.
// ---------------------------------------------------------------------------

export interface DemoAccount {
  id: string;
  name: string;
  /** PERMANENT role list — what this account registered for. */
  roles: RoleName[];
  /** What choosing this account demonstrates, said plainly in the picker. */
  summary: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "demo-renter",
    name: "Renter only",
    roles: ["tenant-buyer"],
    summary: "One role. No role prompt, no switcher — lands straight on Listings.",
  },
  {
    id: "demo-landlord",
    name: "Landlord only",
    roles: ["landlord"],
    summary: "One role. Lands on the Landlord dashboard, and can still browse Listings.",
  },
  {
    id: "demo-landlord-renter",
    name: "Landlord + Renter",
    roles: ["landlord", "tenant-buyer"],
    summary: "Two roles. Asked which to act as, then can switch from the header.",
  },
];

/** The two-role account, named — the header's one-click demo shortcut and the
    picker's third row must be the SAME identity, or they would keep two
    separate saved role preferences. */
export const DEMO_LANDLORD_RENTER = DEMO_ACCOUNTS[2];

/** Stable key for a set of roles, order-independent. */
function rolesKey(roles: RoleName[]): string {
  return [...roles].sort().join("+");
}

/**
 * The account identity for a given role set. Returns the matching preset when
 * there is one, so the demo picker and an inline gated-action login that
 * happen to produce the same roles are the SAME account — and therefore share
 * one saved role preference instead of quietly forking into two.
 */
export function demoAccountForRoles(roles: RoleName[]): DemoAccount {
  const key = rolesKey(roles);
  const preset = DEMO_ACCOUNTS.find((a) => rolesKey(a.roles) === key);
  if (preset) return preset;
  return { id: `demo:${key}`, name: "Demo account", roles, summary: "" };
}
