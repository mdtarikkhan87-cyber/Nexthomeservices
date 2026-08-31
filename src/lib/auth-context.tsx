"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { DemoAccount, demoAccountForRoles } from "./demo-accounts";
import { RoleName, TenantBuyerContext } from "./types";

// Demo-only, in-memory auth state — there is no backend yet. This models just
// enough of the account/role state layers from PRODUCT_DECISIONS.md §6 to
// drive the gated-action flow and role-aware UI structurally, without
// inventing real authentication.
//
// ===========================================================================
// ROLE-SELECTION REVISION (31 Aug 2026) — user.roles vs. activeRole
// ===========================================================================
// The two are different things and were being conflated. They are now named,
// stored and used differently, and this file is the only place either is set:
//
//   user.roles   PERMANENT. What the account registered for. Route guards and
//                permissions check THIS and nothing else. Adding a role never
//                removes one (PRODUCT_DECISIONS.md §8.1).
//
//   activeRole   SESSION-LEVEL view context. What the user is currently acting
//                as. It controls the dashboard they see and which role-specific
//                ACTIONS are offered — never whether a route may be opened.
//
// The three selection rules, in one place so no call site can implement a
// fourth interpretation (see resolveRoleSelection below):
//
//   1. Exactly one role  → auto-select it. Never prompt. The switcher does not
//                          render at all (RoleSwitcher.tsx returns null).
//   2. More than one     → read localStorage["activeRole:" + user.id]. If it
//                          is still a role the user holds, restore it and skip
//                          the prompt. Otherwise show the "Act as" screen.
//   3. On selection      → persist, then the CALLER navigates to that role's
//                          landing page (lib/roles.ts ROLE_LANDING_HREF).
//
// WHY localStorage, AND WHY logout() DOES NOT CLEAR IT
// The previous version stored this in sessionStorage and wiped it on logout,
// so a returning multi-role user was re-asked every single time. Rule 2 asks
// for the opposite: a remembered preference is what makes the prompt appear
// only when there is a genuine choice to make. It is keyed by user id so two
// accounts on one browser cannot overwrite each other. clearRolePreference()
// exists for the demo picker, and for a user who wants to be asked again.
//
// This supersedes the once-per-session model recorded in REVISION_LOG.md §4 —
// see PRODUCT_DECISIONS.md "Role Selection & Active-Role Model".
// ===========================================================================

export interface HeldRole {
  role: RoleName;
  state: "role-added" | "pending-admin-document-review" | "role-verified";
  subscriptionState?: "inactive" | "pending-confirmation" | "active"; // Landlord only
  /** Tenant/Buyer only — ROLE_EXPERIENCE_AUDIT.md §4 Option C: a switchable
      context (not a separate role), defaults to "rent". */
  context?: TenantBuyerContext;
}

/**
 * The account itself.
 *
 * `roles` here is the PERMANENT list — the one every permission check reads.
 * The `HeldRole[]` on the state below carries the per-role verification and
 * subscription layers PRODUCT_DECISIONS.md §6 requires; the two are kept in
 * step by this file and nowhere else. Ask "may they?" with `user.roles`; ask
 * "what state is that role in?" with `roles`.
 */
export interface AuthUser {
  id: string;
  name: string;
  roles: RoleName[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  roles: HeldRole[];
  activeRole: RoleName | null;
  /** True only while a multi-role user has yet to pick an active role and has
      no saved preference to restore. Never set for a single-role user. */
  needsRoleChoice: boolean;
}

interface AuthContextValue extends AuthState {
  /** Demo sign-in as a specific account (lib/demo-accounts.ts). */
  login: (account: DemoAccount) => void;
  logout: () => void;
  /** Changes the view context. Persists. Does NOT navigate — the caller
      decides that, so a deep-link auto-switch can stay where it is while the
      header switcher sends the user to the role's landing page. */
  setActiveRole: (role: RoleName) => void;
  addRole: (role: RoleName) => void;
  /** Registration path — the spec requires roles to be selectable as a
      multi-select at registration, so they are granted as one atomic set
      rather than by looping addRole() and firing four state updates. */
  addRoles: (roles: RoleName[]) => void;
  /** Resolves the "Act as" prompt. Separate from setActiveRole so the
      prompt's own dismissal semantics stay explicit at the call site. */
  chooseSessionRole: (role: RoleName) => void;
  /** Forgets the saved active-role preference so the "Act as" prompt is owed
      again on the next sign-in. Demo affordance, and a real escape hatch. */
  clearRolePreference: (userId?: string) => void;
  /** Switches the Tenant/Buyer role's context (Renting vs. Buying) — same
      mechanism/spirit as role switching, but does not touch `activeRole`
      or trigger any verification flow (context is not a role). */
  setTenantBuyerContext: (context: TenantBuyerContext) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Spec, verbatim: localStorage["activeRole:" + user.id]. */
const activeRoleKey = (userId: string) => `activeRole:${userId}`;

/** Canonical order used whenever a role has to be picked without asking —
    Renter first, because browsing is the neutral default landing state. */
const ROLE_PRIORITY: RoleName[] = ["tenant-buyer", "landlord", "service-provider", "advertiser"];

function primaryRole(roles: RoleName[]): RoleName | null {
  return ROLE_PRIORITY.find((r) => roles.includes(r)) ?? roles[0] ?? null;
}

function readStoredRole(userId: string): RoleName | null {
  if (typeof window === "undefined") return null;
  try {
    return (localStorage.getItem(activeRoleKey(userId)) as RoleName | null) ?? null;
  } catch {
    // Private-mode / storage-disabled browsers must still be able to sign in;
    // they simply get asked once per sign-in instead of remembering.
    return null;
  }
}

function writeStoredRole(userId: string, role: RoleName | null) {
  if (typeof window === "undefined") return;
  try {
    if (role) localStorage.setItem(activeRoleKey(userId), role);
    else localStorage.removeItem(activeRoleKey(userId));
  } catch {
    /* non-fatal — see readStoredRole */
  }
}

/**
 * Rules 1 and 2, encoded once.
 *
 * A stored role that is no longer in `user.roles` (never held, or the account
 * changed shape) is DISCARDED — removed from storage, not merely ignored — so
 * it cannot resurface later and silently re-point the dashboard.
 */
function resolveRoleSelection(user: AuthUser): Pick<AuthState, "activeRole" | "needsRoleChoice"> {
  const { roles } = user;
  if (roles.length === 0) return { activeRole: null, needsRoleChoice: false };

  // Rule 1 — one role is not a choice. Auto-select, never prompt.
  if (roles.length === 1) {
    writeStoredRole(user.id, roles[0]);
    return { activeRole: roles[0], needsRoleChoice: false };
  }

  // Rule 2 — honour a saved preference that is still valid.
  const stored = readStoredRole(user.id);
  if (stored && roles.includes(stored)) return { activeRole: stored, needsRoleChoice: false };
  if (stored) writeStoredRole(user.id, null);

  // Otherwise the prompt is owed. `activeRole` is still populated with a safe
  // default so no downstream component has to handle a null role while the
  // prompt is on screen — the prompt is what the user acts on, this is only
  // what sits behind it.
  return { activeRole: primaryRole(roles), needsRoleChoice: true };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    roles: [],
    activeRole: null,
    needsRoleChoice: false,
  });

  // NOTE on SSR: there is deliberately no mount-time re-resolve here.
  // `isAuthenticated` starts false and can only become true through login()
  // or addRoles(), both of which run in the browser in response to a user
  // action and call resolveRoleSelection() themselves. So localStorage is only
  // ever read at a point where it exists, the server and first client render
  // are identical by construction, and no post-mount setState is needed.

  const login = useCallback((account: DemoAccount) => {
    const user: AuthUser = { id: account.id, name: account.name, roles: account.roles };
    const roles: HeldRole[] = account.roles.map((role) => ({
      role,
      state: "role-verified",
      subscriptionState: role === "landlord" ? "active" : undefined,
      context: role === "tenant-buyer" ? "rent" : undefined,
    }));

    setState({ isAuthenticated: true, user, roles, ...resolveRoleSelection(user) });
  }, []);

  const logout = useCallback(() => {
    // The saved role preference deliberately SURVIVES logout — see the header
    // comment. Signing back in restores it rather than re-asking.
    setState({ isAuthenticated: false, user: null, roles: [], activeRole: null, needsRoleChoice: false });
  }, []);

  const setActiveRole = useCallback((role: RoleName) => {
    setState((prev) => {
      // Never switch into a role the account does not hold. activeRole is a
      // view context, but it still has to name something real.
      if (prev.user && !prev.user.roles.includes(role)) return prev;
      if (prev.user) writeStoredRole(prev.user.id, role);
      return { ...prev, activeRole: role, needsRoleChoice: false };
    });
  }, []);

  const chooseSessionRole = useCallback(
    (role: RoleName) => {
      setActiveRole(role);
    },
    [setActiveRole]
  );

  const clearRolePreference = useCallback((userId?: string) => {
    setState((prev) => {
      const id = userId ?? prev.user?.id;
      if (id) writeStoredRole(id, null);
      return prev;
    });
  }, []);

  const addRoles = useCallback((incoming: RoleName[]) => {
    setState((prev) => {
      const fresh = incoming.filter((r) => !prev.roles.some((held) => held.role === r));
      if (fresh.length === 0) return prev;

      const added: HeldRole[] = fresh.map((role) => {
        const needsTrustLayer = role === "landlord" || role === "service-provider";
        return {
          role,
          state: needsTrustLayer ? "pending-admin-document-review" : "role-verified",
          subscriptionState: role === "landlord" ? "inactive" : undefined,
          context: role === "tenant-buyer" ? "rent" : undefined,
        };
      });

      // PRODUCT_DECISIONS.md §8.1: adding a role never restricts existing
      // roles — they remain untouched in prev.roles.
      const roles = [...prev.roles, ...added];
      const roleNames = roles.map((r) => r.role);

      // Registration creates the account; adding a role extends it.
      const user: AuthUser = prev.user
        ? { ...prev.user, roles: roleNames }
        : { ...demoAccountForRoles(roleNames) };

      // EDGE CASE — role added later (1 → 2 roles): the NEW role becomes
      // active immediately, and the caller lands the user on its dashboard.
      // Asking "which role?" one second after they told us is not a choice,
      // it is an echo. Registration multi-select grants several at once and
      // falls back to ROLE_PRIORITY among the ones just granted.
      const active = primaryRole(fresh) ?? prev.activeRole;
      if (active) writeStoredRole(user.id, active);

      return {
        ...prev,
        isAuthenticated: true,
        user,
        roles,
        activeRole: active,
        needsRoleChoice: false,
      };
    });
  }, []);

  const addRole = useCallback((role: RoleName) => addRoles([role]), [addRoles]);

  const setTenantBuyerContext = useCallback((context: TenantBuyerContext) => {
    setState((prev) => ({
      ...prev,
      roles: prev.roles.map((r) => (r.role === "tenant-buyer" ? { ...r, context } : r)),
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      setActiveRole,
      chooseSessionRole,
      clearRolePreference,
      addRole,
      addRoles,
      setTenantBuyerContext,
    }),
    [
      state,
      login,
      logout,
      setActiveRole,
      chooseSessionRole,
      clearRolePreference,
      addRole,
      addRoles,
      setTenantBuyerContext,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
