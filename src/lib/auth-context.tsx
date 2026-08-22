"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { RoleName, TenantBuyerContext } from "./types";

// Demo-only, in-memory auth state — there is no backend yet (see final
// implementation report). This models just enough of the account/role
// state layers from PRODUCT_DECISIONS.md §6 to drive the gated-action flow
// and role-aware UI structurally, without inventing real authentication.

export interface HeldRole {
  role: RoleName;
  state: "role-added" | "pending-admin-document-review" | "role-verified";
  subscriptionState?: "inactive" | "pending-confirmation" | "active"; // Landlord only
  /** Tenant/Buyer only — ROLE_EXPERIENCE_AUDIT.md §4 Option C: a switchable
      context (not a separate role), defaults to "rent". */
  context?: TenantBuyerContext;
}

interface AuthState {
  isAuthenticated: boolean;
  roles: HeldRole[];
  activeRole: RoleName | null;
}

interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => void;
  setActiveRole: (role: RoleName) => void;
  addRole: (role: RoleName) => void;
  /** Switches the Tenant/Buyer role's context (Renting vs. Buying) — same
      mechanism/spirit as role switching, but does not touch `activeRole`
      or trigger any verification flow (context is not a role). */
  setTenantBuyerContext: (context: TenantBuyerContext) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    roles: [],
    activeRole: null,
  });

  const login = useCallback(() => {
    // Demo: logging in grants a verified Tenant/Buyer role, per
    // PRODUCT_DECISIONS.md §5's lightweight flow, so the authenticated
    // shell has something real to show immediately.
    setState({
      isAuthenticated: true,
      roles: [{ role: "tenant-buyer", state: "role-verified", context: "rent" }],
      activeRole: "tenant-buyer",
    });
  }, []);

  const logout = useCallback(() => {
    setState({ isAuthenticated: false, roles: [], activeRole: null });
  }, []);

  const setActiveRole = useCallback((role: RoleName) => {
    setState((prev) => ({ ...prev, activeRole: role }));
  }, []);

  const addRole = useCallback((role: RoleName) => {
    setState((prev) => {
      if (prev.roles.some((r) => r.role === role)) return prev;
      const needsTrustLayer = role === "landlord" || role === "service-provider";
      const newRole: HeldRole = {
        role,
        state: needsTrustLayer ? "pending-admin-document-review" : "role-verified",
        subscriptionState: role === "landlord" ? "inactive" : undefined,
        context: role === "tenant-buyer" ? "rent" : undefined,
      };
      // PRODUCT_DECISIONS.md §8.1: adding a role never restricts existing
      // roles — they remain untouched in `prev.roles`.
      return { ...prev, roles: [...prev.roles, newRole], activeRole: role };
    });
  }, []);

  const setTenantBuyerContext = useCallback((context: TenantBuyerContext) => {
    setState((prev) => ({
      ...prev,
      roles: prev.roles.map((r) => (r.role === "tenant-buyer" ? { ...r, context } : r)),
    }));
  }, []);

  const value = useMemo(
    () => ({ ...state, login, logout, setActiveRole, addRole, setTenantBuyerContext }),
    [state, login, logout, setActiveRole, addRole, setTenantBuyerContext]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
