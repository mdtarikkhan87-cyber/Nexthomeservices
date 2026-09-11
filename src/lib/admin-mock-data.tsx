"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { useAds } from "./ads-context";
import { DEMO_ACCOUNTS } from "./demo-accounts";
import { useListings } from "./listings-context";
import { mockListings, mockServices } from "./mock-data";
import { ROLE_LABELS } from "./roles";
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

// ---- Audit log --------------------------------------------------------------

export interface AdminAuditLogEntry {
  id: string;
  action: string;
  itemTitle: string;
  timestamp: Date;
}

// HONEST SCOPE: this records WHAT happened and WHEN, not WHO — admin.ts
// (ADMIN_EMAILS/isAdminEmail) checks one shared identity, not an individual
// signed-in admin account, so there is no real "actor" to attribute an entry
// to yet. Accurate once real backend auth exists with individual admin
// accounts (IMPLEMENTATION_NOTES.md #2, #9).
interface AdminAuditLogContextValue {
  entries: AdminAuditLogEntry[];
  logAction: (action: string, itemTitle: string) => void;
}

const AdminAuditLogContext = createContext<AdminAuditLogContextValue | null>(null);

// A CONTEXT, same reasoning as AdminComplaintsProvider below: the Activity
// tab is a separate route from the pages that produce entries (Users,
// Listings, Ads, Complaints), so this has to survive navigation between
// sibling /admin/* routes, not just live for one page's mount. Lives in
// admin/layout.tsx, above AdminComplaintsProvider, so resolveComplaint can
// log through it too.
export function AdminAuditLogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<AdminAuditLogEntry[]>([]);

  const logAction = useCallback((action: string, itemTitle: string) => {
    setEntries((prev) => [{ id: `log-${Date.now()}-${prev.length}`, action, itemTitle, timestamp: new Date() }, ...prev]);
  }, []);

  const value = useMemo(() => ({ entries, logAction }), [entries, logAction]);

  return <AdminAuditLogContext.Provider value={value}>{children}</AdminAuditLogContext.Provider>;
}

// Newest first by construction (logAction prepends) — no separate sort.
export function useAdminAuditLog() {
  const ctx = useContext(AdminAuditLogContext);
  if (!ctx) throw new Error("useAdminAuditLog must be used within AdminAuditLogProvider");
  return ctx;
}

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
  const { logAction } = useAdminAuditLog();

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

  const logRole = (userId: string, role: RoleName, action: string) => {
    const user = users.find((u) => u.id === userId);
    logAction(action, user ? `${user.name} — ${ROLE_LABELS[role]}` : ROLE_LABELS[role]);
  };

  return {
    users,
    verifyUserRole: (userId: string, role: RoleName) => {
      logRole(userId, role, "Verified user role");
      setRole(userId, role, "role-verified");
    },
    rejectUserRole: (userId: string, role: RoleName) => {
      logRole(userId, role, "Rejected user role");
      setRole(userId, role, "role-added");
    },
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
  const { logAction } = useAdminAuditLog();

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

  const logStatus = (id: string, action: string) => {
    logAction(action, listings.find((row) => row.id === id)?.title ?? id);
  };

  return {
    listings,
    pending: listings.filter((row) => row.status === "pending-review"),
    approveListing: (id: string) => {
      logStatus(id, "Approved listing");
      setStatus(id, "live");
    },
    rejectListing: (id: string) => {
      logStatus(id, "Rejected listing");
      setStatus(id, "rejected");
    },
  };
}

// ---- Ads --------------------------------------------------------------------

// Unlike useAdminListings(), Ads have a real shared Context (lib/ads-context.tsx)
// as their one source of truth — no static catalog to merge and no override
// map needed, so this is a thin pass-through rather than a second data layer.
export function useAdminAds() {
  const { ads, approveAd, rejectAd } = useAds();
  const { logAction } = useAdminAuditLog();

  const logStatus = (id: string, action: string) => {
    logAction(action, ads.find((ad) => ad.id === id)?.title ?? id);
  };

  return {
    ads,
    pending: ads.filter((ad) => ad.status === "pending-review"),
    approveAd: (id: string) => {
      logStatus(id, "Approved ad");
      approveAd(id);
    },
    rejectAd: (id: string) => {
      logStatus(id, "Rejected ad");
      rejectAd(id);
    },
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
  const { logAction } = useAdminAuditLog();

  const resolveComplaint = useCallback(
    (id: string) => {
      const complaint = complaints.find((c) => c.id === id);
      if (complaint) logAction("Resolved complaint", complaint.subject);
      setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status: "resolved" } : c)));
    },
    [complaints, logAction]
  );

  const value = useMemo(() => ({ complaints, resolveComplaint }), [complaints, resolveComplaint]);

  return <AdminComplaintsContext.Provider value={value}>{children}</AdminComplaintsContext.Provider>;
}

export function useAdminComplaints() {
  const ctx = useContext(AdminComplaintsContext);
  if (!ctx) throw new Error("useAdminComplaints must be used within AdminComplaintsProvider");
  return ctx;
}
