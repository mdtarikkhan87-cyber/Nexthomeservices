"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { DEMO_ACCOUNTS } from "./demo-accounts";
import { useListings } from "./listings-context";
import { mockListings, mockServices } from "./mock-data";
import { ContentItemState, PropertyListing, RoleName, RoleState, ServiceListing } from "./types";

// ---------------------------------------------------------------------------
// Admin mock data layer — placeholder pending the real backend.
//
// Shaped like a future API: useAdminUsers(), useAdminListings(),
// useAdminComplaints() are the calls admin pages make. Only their internals
// change once nexthome-api is real — no admin page should reach into
// mock-data.ts, demo-accounts.ts or listings-context.tsx directly.
//
// LISTING STATUS and USER ROLE STATE are both layered as OVERRIDE MAPS on top
// of the shared catalogs, the same technique listings-context.tsx already
// uses for shared-property room status — never rewriting mockListings /
// mockServices / DEMO_ACCOUNTS in place, because those are static imports read
// directly (not via React state) by several other pages, and a plain in-place
// mutation there would not cause any of them to re-render.
// ---------------------------------------------------------------------------

// ---- Users ----------------------------------------------------------------

export interface AdminUserRoleRow {
  role: RoleName;
  state: RoleState;
}

export interface AdminUser {
  id: string;
  name: string;
  roles: AdminUserRoleRow[];
}

// DEMO_ACCOUNTS only carries the PERMANENT role list — no per-role state, that
// only exists live, per signed-in session, in auth-context.tsx. This seeds a
// starting state per demo account so admin has real rows to act on, including
// one already "pending-admin-document-review" so the verify/reject action is
// demoable without first creating a role from scratch.
const INITIAL_ROLE_STATE: Record<string, AdminUserRoleRow[]> = {
  "demo-renter": [{ role: "tenant-buyer", state: "role-verified" }],
  "demo-landlord": [{ role: "landlord", state: "pending-admin-document-review" }],
  "demo-landlord-renter": [
    { role: "landlord", state: "role-verified" },
    { role: "tenant-buyer", state: "role-verified" },
  ],
};

export function useAdminUsers() {
  const [roleState, setRoleState] = useState(INITIAL_ROLE_STATE);

  const users: AdminUser[] = useMemo(
    () =>
      DEMO_ACCOUNTS.map((account) => ({
        id: account.id,
        name: account.name,
        roles: roleState[account.id] ?? account.roles.map((role) => ({ role, state: "role-verified" as RoleState })),
      })),
    [roleState]
  );

  const setRole = useCallback((userId: string, role: RoleName, state: RoleState) => {
    setRoleState((prev) => ({
      ...prev,
      [userId]: (prev[userId] ?? []).map((r) => (r.role === role ? { ...r, state } : r)),
    }));
  }, []);

  return {
    users,
    verifyUserRole: (userId: string, role: RoleName) => setRole(userId, role, "role-verified"),
    rejectUserRole: (userId: string, role: RoleName) => setRole(userId, role, "role-added"),
  };
}

// ---- Listings ---------------------------------------------------------------

export interface AdminListingRow {
  id: string;
  kind: "property" | "service";
  title: string;
  status: ContentItemState;
}

function toRow(listing: PropertyListing | ServiceListing): AdminListingRow {
  return "title" in listing
    ? { id: listing.id, kind: "property", title: listing.title, status: listing.status }
    : { id: listing.id, kind: "service", title: `${listing.category} — ${listing.providerName}`, status: listing.status };
}

export function useAdminListings() {
  // Session-submitted listings (lib/listings-context.tsx) are the actual
  // source of "pending-review" items today — the static mock-data.ts catalog
  // is seeded entirely "live". Both are read here so a listing a landlord
  // submits in this session is really approvable/rejectable by admin.
  const { submitted } = useListings();
  const [overrides, setOverrides] = useState<Record<string, ContentItemState>>({});

  const listings: AdminListingRow[] = useMemo(() => {
    const catalog: (PropertyListing | ServiceListing)[] = [...mockListings, ...submitted, ...mockServices];
    return catalog.map((item) => {
      const row = toRow(item);
      const override = overrides[row.id];
      return override ? { ...row, status: override } : row;
    });
  }, [submitted, overrides]);

  const setStatus = useCallback((id: string, status: ContentItemState) => {
    setOverrides((prev) => ({ ...prev, [id]: status }));
  }, []);

  return {
    listings,
    pending: listings.filter((row) => row.status === "pending-review"),
    approveListing: (id: string) => setStatus(id, "live"),
    rejectListing: (id: string) => setStatus(id, "rejected"),
  };
}

// ---- Complaints -------------------------------------------------------------

export type ComplaintStatus = "open" | "resolved";

export interface Complaint {
  id: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
}

// TEMPORARY, standalone seed — unlike listings/users, there is no existing
// complaints dataset anywhere to read from: the public /complaints form
// (app/(public)/complaints/page.tsx) doesn't persist what it collects yet
// (no backend), so nothing today produces a real complaint record.
const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: "c1",
    subject: "Suspicious listing — Studio Apartment, Yaba",
    description: "Reporter says the landlord asked for a deposit via bank transfer before any viewing.",
    status: "open",
  },
  {
    id: "c2",
    subject: "Unresponsive service provider",
    description: "TorqueWorks Auto Care did not show up for a scheduled callout.",
    status: "open",
  },
];

interface AdminComplaintsContextValue {
  complaints: Complaint[];
  resolveComplaint: (id: string) => void;
}

const AdminComplaintsContext = createContext<AdminComplaintsContextValue | null>(null);

// A CONTEXT, unlike useAdminUsers()/useAdminListings() above — those hold
// state per page-mount, which is fine as long as nothing needs it to survive
// a navigation. Resolving a complaint does: the Overview page's "Open
// complaints" tile has to reflect it after navigating away from /admin/
// complaints and back, and a fresh local useState per mount would silently
// lose that. The provider lives in admin/layout.tsx, which — unlike the
// page components — does NOT remount between sibling /admin/* routes, so
// this is the one piece of admin state that actually needs to be here.
export function AdminComplaintsProvider({ children }: { children: ReactNode }) {
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);

  const resolveComplaint = useCallback((id: string) => {
    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status: "resolved" } : c)));
  }, []);

  const value = useMemo(() => ({ complaints, resolveComplaint }), [complaints, resolveComplaint]);

  return <AdminComplaintsContext.Provider value={value}>{children}</AdminComplaintsContext.Provider>;
}

export function useAdminComplaints() {
  const ctx = useContext(AdminComplaintsContext);
  if (!ctx) throw new Error("useAdminComplaints must be used within AdminComplaintsProvider");
  return ctx;
}
