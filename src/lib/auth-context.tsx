"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { RoleName, TenantBuyerContext } from "./types";
import { apiRegister, apiLogin, apiLogout, apiFetchCurrentUser, apiAddRole, RegisterInput } from "./backend-client";

// ===========================================================================
// REAL BACKEND INTEGRATION (2 Sept 2026)
// ===========================================================================
// This file previously held demo-only, in-memory auth state with no backend.
// It's now wired to the real NextHome API (see backend-client.ts), while
// keeping the SAME public shape (isAuthenticated, roles, activeRole,
// needsRoleChoice, etc.) so AuthGate, RoleScoped, and every other consumer
// built against the old interface keeps working unchanged.
//
// What changed concretely:
//   - login() now takes (email, password), is async, and can throw.
//   - A new register() function replaces the old demo "pick an account" flow.
//   - Session now persists across page reloads: on mount, we check for a
//     stored token and re-hydrate the user from GET /auth/me if one exists.
//   - addRole/addRoles now call the real backend, then re-fetch the
//     authoritative user record rather than computing role state locally.
//
// What did NOT change: activeRole / needsRoleChoice / role-preference
// persistence is still a pure client-side view concept — the backend has no
// notion of "active role", by design (see roles.guard.js on the backend).
// ===========================================================================

export interface HeldRole {
  role: RoleName;
  state: "role-added" | "pending-admin-document-review" | "role-verified";
  subscriptionState?: "inactive" | "pending-confirmation" | "active"; // Landlord only
  /** Tenant/Buyer only — a switchable context (not a separate role), defaults to "rent". */
  context?: TenantBuyerContext;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: RoleName[];
  /** Orthogonal to `roles` — real, backend-verified now (User.isAdmin on
      the server), never combined with the tenant/landlord/etc. role
      system. Admin routes (AdminGate) gate on this flag directly. */
  isAdmin?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  /** True only until the initial mount-time session check (GET /auth/me via
      a stored token) has finished. Lets consumers avoid a flash of
      logged-out UI while that check is in flight, if they choose to. */
  isHydrating: boolean;
  user: AuthUser | null;
  roles: HeldRole[];
  activeRole: RoleName | null;
  needsRoleChoice: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  setActiveRole: (role: RoleName) => void;
  addRole: (role: RoleName) => Promise<void>;
  addRoles: (roles: RoleName[]) => Promise<void>;
  chooseSessionRole: (role: RoleName) => void;
  clearRolePreference: (userId?: string) => void;
  setTenantBuyerContext: (context: TenantBuyerContext) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const activeRoleKey = (userId: string) => `activeRole:${userId}`;

const ROLE_PRIORITY: RoleName[] = ["tenant-buyer", "landlord", "service-provider", "advertiser"];

function primaryRole(roles: RoleName[]): RoleName | null {
  return ROLE_PRIORITY.find((r) => roles.includes(r)) ?? roles[0] ?? null;
}

function readStoredRole(userId: string): RoleName | null {
  if (typeof window === "undefined") return null;
  try {
    return (localStorage.getItem(activeRoleKey(userId)) as RoleName | null) ?? null;
  } catch {
    return null;
  }
}

function writeStoredRole(userId: string, role: RoleName | null) {
  if (typeof window === "undefined") return;
  try {
    if (role) localStorage.setItem(activeRoleKey(userId), role);
    else localStorage.removeItem(activeRoleKey(userId));
  } catch {
    /* non-fatal */
  }
}

function resolveRoleSelection(user: AuthUser): Pick<AuthState, "activeRole" | "needsRoleChoice"> {
  const { roles } = user;
  if (roles.length === 0) return { activeRole: null, needsRoleChoice: false };

  if (roles.length === 1) {
    writeStoredRole(user.id, roles[0]);
    return { activeRole: roles[0], needsRoleChoice: false };
  }

  const stored = readStoredRole(user.id);
  if (stored && roles.includes(stored)) return { activeRole: stored, needsRoleChoice: false };
  if (stored) writeStoredRole(user.id, null);

  return { activeRole: primaryRole(roles), needsRoleChoice: true };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isHydrating: true,
    user: null,
    roles: [],
    activeRole: null,
    needsRoleChoice: false,
  });

  // Runs once on mount, client-side only. If a token is already stored
  // (returning user, page refresh), this silently restores their session by
  // asking the backend who they are — this is the persistence that the old
  // demo-only version explicitly did not have.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await apiFetchCurrentUser();
      if (cancelled) return;
      if (result) {
        const user: AuthUser = { id: result.id, name: result.name, email: result.email, roles: result.roles, isAdmin: result.isAdmin };
        setState({
          isAuthenticated: true,
          isHydrating: false,
          user,
          roles: result.heldRoles,
          ...resolveRoleSelection(user),
        });
      } else {
        setState((prev) => ({ ...prev, isHydrating: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await apiLogin(email, password);
    const result = await apiFetchCurrentUser();
    if (!result) throw new Error("Login succeeded but fetching the profile failed.");
    const user: AuthUser = { id: result.id, name: result.name, email: result.email, roles: result.roles, isAdmin: result.isAdmin };
    setState({
      isAuthenticated: true,
      isHydrating: false,
      user,
      roles: result.heldRoles,
      ...resolveRoleSelection(user),
    });
  }, []);

   const register = useCallback(
    async (input: RegisterInput) => {
      await apiRegister(input);
      const result = await apiFetchCurrentUser();
      if (!result) throw new Error("Registration succeeded but fetching the profile failed.");
      const user: AuthUser = { id: result.id, name: result.name, email: result.email, roles: result.roles, isAdmin: result.isAdmin };
      setState({
        isAuthenticated: true,
        isHydrating: false,
        user,
        roles: result.heldRoles,
        ...resolveRoleSelection(user),
      });
    },
    [],
  );

  const logout = useCallback(() => {
    apiLogout();
    // The saved role preference deliberately survives logout — signing back
    // in restores it rather than re-asking.
    setState({ isAuthenticated: false, isHydrating: false, user: null, roles: [], activeRole: null, needsRoleChoice: false });
  }, []);

  const setActiveRole = useCallback((role: RoleName) => {
    setState((prev) => {
      if (prev.user && !prev.user.roles.includes(role)) return prev;
      if (prev.user) writeStoredRole(prev.user.id, role);
      return { ...prev, activeRole: role, needsRoleChoice: false };
    });
  }, []);

  const chooseSessionRole = useCallback((role: RoleName) => setActiveRole(role), [setActiveRole]);

  const clearRolePreference = useCallback((userId?: string) => {
    setState((prev) => {
      const id = userId ?? prev.user?.id;
      if (id) writeStoredRole(id, null);
      return prev;
    });
  }, []);

  const addRoles = useCallback(async (incoming: RoleName[]) => {
    // Ask the backend for each new role, then re-fetch the authoritative
    // record rather than computing role state locally in two places.
    for (const role of incoming) {
      await apiAddRole(role);
    }
    const result = await apiFetchCurrentUser();
    if (!result) throw new Error("Adding role(s) succeeded but re-fetching the profile failed.");

    const user: AuthUser = { id: result.id, name: result.name, email: result.email, roles: result.roles, isAdmin: result.isAdmin };
    const active = primaryRole(incoming) ?? readStoredRole(user.id) ?? primaryRole(user.roles);
    if (active) writeStoredRole(user.id, active);

    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      user,
      roles: result.heldRoles,
      activeRole: active,
      needsRoleChoice: false,
    }));
  }, []);

  const addRole = useCallback((role: RoleName) => addRoles([role]), [addRoles]);

  const setTenantBuyerContext = useCallback((context: TenantBuyerContext) => {
    // Client-side view state only for now — the backend does store a
    // per-role `context` field, but no endpoint updates it yet.
    setState((prev) => ({
      ...prev,
      roles: prev.roles.map((r) => (r.role === "tenant-buyer" ? { ...r, context } : r)),
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      setActiveRole,
      chooseSessionRole,
      clearRolePreference,
      addRole,
      addRoles,
      setTenantBuyerContext,
    }),
    [state, login, register, logout, setActiveRole, chooseSessionRole, clearRolePreference, addRole, addRoles, setTenantBuyerContext],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}