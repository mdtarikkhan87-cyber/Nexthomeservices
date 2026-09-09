"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authedRequest as apiAuthedRequest } from "./backend-client";
import { ContentItemState, RoleName } from "./types";

// ---------------------------------------------------------------------------
// Admin data layer — real backend now (see nexthome-api/src/routes/admin.routes.js).
//
// Shaped exactly like the mock layer it replaces: useAdminUsers(),
// useAdminListings(), useAdminComplaints() are the same calls the admin
// pages already make — only what's inside them changed. No admin page
// reaches into a data source directly.
// ---------------------------------------------------------------------------

// Same translation reasoning as every other -client.ts file: Prisma enums
// can't use hyphens, so several fields are underscored server-side.
type BackendRoleName = "landlord" | "tenant_buyer" | "service_provider" | "advertiser";
type BackendRoleState = "role_added" | "pending_admin_document_review" | "role_verified";
type BackendContentItemState = "pending_review" | "live" | "rejected";

const ROLE_TO_FRONTEND: Record<BackendRoleName, RoleName> = {
  landlord: "landlord",
  tenant_buyer: "tenant-buyer",
  service_provider: "service-provider",
  advertiser: "advertiser",
};
const ROLE_TO_BACKEND: Record<RoleName, BackendRoleName> = {
  landlord: "landlord",
  "tenant-buyer": "tenant_buyer",
  "service-provider": "service_provider",
  advertiser: "advertiser",
};
const ROLE_STATE_TO_FRONTEND: Record<BackendRoleState, AdminUserRoleRow["state"]> = {
  role_added: "role-added",
  pending_admin_document_review: "pending-admin-document-review",
  role_verified: "role-verified",
};
const STATUS_TO_FRONTEND: Record<BackendContentItemState, ContentItemState> = {
  pending_review: "pending-review",
  live: "live",
  rejected: "rejected",
};

// ---- Users ----------------------------------------------------------------

export interface AdminUserRoleRow {
  role: RoleName;
  state: "role-added" | "pending-admin-document-review" | "role-verified";
}

export interface AdminUser {
  id: string;
  name: string;
  roles: AdminUserRoleRow[];
}

interface BackendAdminUser {
  id: string;
  name: string;
  roles: { role: BackendRoleName; state: BackendRoleState }[];
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);

  const refetch = useCallback(async () => {
    const result = await apiAuthedRequest<BackendAdminUser[]>("/admin/users");
    setUsers(
      result.map((u) => ({
        id: u.id,
        name: u.name,
        roles: u.roles.map((r) => ({ role: ROLE_TO_FRONTEND[r.role], state: ROLE_STATE_TO_FRONTEND[r.state] })),
      })),
    );
  }, []);

  // Written as a promise callback (not synchronous code in the effect body)
  // to satisfy React's "no setState directly in an effect" guidance — same
  // pattern as listings-context.tsx's refetchMyListings effect.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      try {
        if (!cancelled) await refetch();
      } catch {
        // leave empty — matches the mock layer's own fail-quiet shape
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refetch]);

  const setRole = useCallback(
    async (userId: string, role: RoleName, action: "verify" | "reject") => {
      await apiAuthedRequest(`/admin/users/${userId}/roles/${ROLE_TO_BACKEND[role]}/${action}`, {
        method: "PATCH",
      });
      await refetch();
    },
    [refetch],
  );

  return {
    users,
    verifyUserRole: (userId: string, role: RoleName) => setRole(userId, role, "verify"),
    rejectUserRole: (userId: string, role: RoleName) => setRole(userId, role, "reject"),
  };
}

// ---- Listings ---------------------------------------------------------------

export interface AdminListingRow {
  id: string;
  kind: "property" | "service";
  title: string;
  status: ContentItemState;
}

interface BackendAdminListingRow {
  id: string;
  kind: "property" | "service";
  title: string;
  status: BackendContentItemState;
}

export function useAdminListings() {
  const [listings, setListings] = useState<AdminListingRow[]>([]);

  const refetch = useCallback(async () => {
    const result = await apiAuthedRequest<BackendAdminListingRow[]>("/admin/listings");
    setListings(result.map((row) => ({ ...row, status: STATUS_TO_FRONTEND[row.status] })));
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      try {
        if (!cancelled) await refetch();
      } catch {
        // leave empty — matches the mock layer's own fail-quiet shape
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refetch]);

  // approveListing/rejectListing take only an id (matching the mock
  // layer's exact signature) — kind is looked up from the currently loaded
  // rows rather than asked for again, since the backend needs to know
  // which table (Listing vs ServiceListing) to update.
  const setStatus = useCallback(
    async (id: string, action: "approve" | "reject") => {
      const row = listings.find((r) => r.id === id);
      if (!row) return;
      await apiAuthedRequest(`/admin/listings/${row.kind}/${id}/${action}`, { method: "PATCH" });
      await refetch();
    },
    [listings, refetch],
  );

  return {
    listings,
    pending: listings.filter((row) => row.status === "pending-review"),
    approveListing: (id: string) => setStatus(id, "approve"),
    rejectListing: (id: string) => setStatus(id, "reject"),
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

interface BackendComplaint {
  id: string;
  subject: string;
  body: string;
  status: "open" | "in_review" | "resolved";
}

// Collapses the backend's 3-state status into this UI's existing 2-state
// model (open vs resolved) — in_review has no separate treatment anywhere
// in the admin UI, so it folds into "open" rather than inventing a third
// badge state this pass never asked for.
function toFrontendComplaint(b: BackendComplaint): Complaint {
  return {
    id: b.id,
    subject: b.subject,
    description: b.body,
    status: b.status === "resolved" ? "resolved" : "open",
  };
}

interface AdminComplaintsContextValue {
  complaints: Complaint[];
  resolveComplaint: (id: string) => void;
}

const AdminComplaintsContext = createContext<AdminComplaintsContextValue | null>(null);

// A CONTEXT, same as the mock layer it replaces — admin/layout.tsx (not the
// page components underneath it, which remount on every route change) is
// what persists across navigation between sibling /admin/* routes, so this
// is the one piece of admin state that actually needs to live there.
export function AdminComplaintsProvider({ children }: { children: ReactNode }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      try {
        const result = await apiAuthedRequest<BackendComplaint[]>("/admin/complaints");
        if (!cancelled) setComplaints(result.map(toFrontendComplaint));
      } catch {
        // leave empty — matches the mock layer's own fail-quiet shape
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolveComplaint = useCallback((id: string) => {
    apiAuthedRequest(`/admin/complaints/${id}/resolve`, { method: "PATCH" })
      .then(() => setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status: "resolved" as const } : c))))
      .catch(() => {
        // leave stale on failure — same fail-quiet behavior as elsewhere
      });
  }, []);

  const value = useMemo(() => ({ complaints, resolveComplaint }), [complaints, resolveComplaint]);

  return <AdminComplaintsContext.Provider value={value}>{children}</AdminComplaintsContext.Provider>;
}

export function useAdminComplaints() {
  const ctx = useContext(AdminComplaintsContext);
  if (!ctx) throw new Error("useAdminComplaints must be used within AdminComplaintsProvider");
  return ctx;
}
