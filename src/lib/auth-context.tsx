"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { RoleName, TenantBuyerContext } from "./types";

// Demo-only, in-memory auth state — there is no backend yet (see final
// implementation report). This models just enough of the account/role
// state layers from PRODUCT_DECISIONS.md §6 to drive the gated-action flow
// and role-aware UI structurally, without inventing real authentication.
//
// ---------------------------------------------------------------------------
// REVISION (Website Revision Spec §3B, 24 Aug 2026) — session role model
// ---------------------------------------------------------------------------
// The spec adds a session layer on top of the existing multi-role account
// model. Verbatim requirements and how each is implemented here:
//
//   "a user with only one role is placed into that role automatically, with
//    no prompt"                     → resolveSession() below, single-role path
//   "a user holding multiple roles is prompted to choose an active role only
//    once, at the start of a fresh session ... never on every page load"
//                                    → needsSessionRoleChoice, latched once per
//                                      session and cleared through sessionStorage
//   "the chosen active role persists for the rest of that session"
//                                    → SESSION_ROLE_KEY in sessionStorage
//   "a persistent role switcher ... lets the user change their active role at
//    any point mid-session, without logging out"
//                                    → setActiveRole(), which also rewrites the
//                                      session key so the switch sticks
//
// sessionStorage (not localStorage) is the correct store for this: it is
// scoped to the tab and cleared when the browsing session ends, which is
// exactly the lifetime the spec describes for "this session". logout()
// clears it explicitly so the next login counts as a fresh session and
// prompts again.

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
  /** True only while a multi-role user has yet to pick an active role for
      this session. Drives the one-time prompt; never set for single-role
      users, and never re-set on navigation within the same session. */
  needsSessionRoleChoice: boolean;
}

interface AuthContextValue extends AuthState {
  /** Demo sign-in. Accepts the roles to grant so the caller decides what the
      session looks like rather than this file hard-coding one shape. */
  login: (roles?: RoleName[]) => void;
  logout: () => void;
  setActiveRole: (role: RoleName) => void;
  addRole: (role: RoleName) => void;
  /** Registration path — the spec requires roles to be selectable as a
      multi-select at registration, so they are granted as one atomic set
      rather than by looping addRole() and firing four state updates. */
  addRoles: (roles: RoleName[]) => void;
  /** Resolves the once-per-session prompt. Separate from setActiveRole so the
      prompt's own dismissal semantics stay explicit at the call site. */
  chooseSessionRole: (role: RoleName) => void;
  /** Switches the Tenant/Buyer role's context (Renting vs. Buying) — same
      mechanism/spirit as role switching, but does not touch `activeRole`
      or trigger any verification flow (context is not a role). */
  setTenantBuyerContext: (context: TenantBuyerContext) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_ROLE_KEY = "nexthome:session-active-role";

/** Canonical order used whenever a role has to be picked without asking —
    Renter first, because the spec's own example ("Renter → listings-oriented
    view") treats browsing as the neutral default landing state. */
const ROLE_PRIORITY: RoleName[] = ["tenant-buyer", "landlord", "service-provider", "advertiser"];

function primaryRole(roles: RoleName[]): RoleName | null {
  return ROLE_PRIORITY.find((r) => roles.includes(r)) ?? roles[0] ?? null;
}

function readSessionRole(): RoleName | null {
  if (typeof window === "undefined") return null;
  try {
    return (sessionStorage.getItem(SESSION_ROLE_KEY) as RoleName | null) ?? null;
  } catch {
    // Private-mode / storage-disabled browsers must still be able to sign in;
    // they simply get prompted once per page load instead of once per session.
    return null;
  }
}

function writeSessionRole(role: RoleName | null) {
  if (typeof window === "undefined") return;
  try {
    if (role) sessionStorage.setItem(SESSION_ROLE_KEY, role);
    else sessionStorage.removeItem(SESSION_ROLE_KEY);
  } catch {
    /* non-fatal — see readSessionRole */
  }
}

/**
 * Decides the active role for a set of held roles, and whether the one-time
 * session prompt is owed. This is the single place the spec's three session
 * rules are encoded, so no call site can implement a fourth interpretation.
 */
function resolveSession(held: HeldRole[]): Pick<AuthState, "activeRole" | "needsSessionRoleChoice"> {
  const names = held.map((r) => r.role);
  if (names.length === 0) return { activeRole: null, needsSessionRoleChoice: false };

  // Single role → straight in, no prompt. Spec, verbatim.
  if (names.length === 1) return { activeRole: names[0], needsSessionRoleChoice: false };

  // Multi-role → honour a choice already made this session, if it is still a
  // role the user actually holds.
  const stored = readSessionRole();
  if (stored && names.includes(stored)) return { activeRole: stored, needsSessionRoleChoice: false };

  // Otherwise the prompt is owed. `activeRole` is still populated with a safe
  // default so no downstream component has to handle a null role while the
  // prompt is on screen — the prompt is what the user actually acts on, this
  // is only what sits behind it.
  return { activeRole: primaryRole(names), needsSessionRoleChoice: true };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    roles: [],
    activeRole: null,
    needsSessionRoleChoice: false,
  });

  // NOTE on SSR: there is deliberately no mount-time re-resolve here.
  // `isAuthenticated` starts false and can only become true through login()
  // or addRoles(), both of which run in the browser in response to a user
  // action and call resolveSession() themselves. So sessionStorage is only
  // ever read at a point where it exists, the server and first client render
  // are identical by construction, and no post-mount setState is needed.

  const login = useCallback((granted?: RoleName[]) => {
    // Demo: signing in grants a verified Renter AND a verified Landlord.
    //
    // This is deliberately multi-role rather than the single Tenant/Buyer the
    // previous version granted: the spec's session prompt, the persistent
    // role switcher, and the role-gated "List Your Property" nav item are all
    // multi-role behaviours, and a demo sign-in that produces one role would
    // leave every one of them unreachable in review. Real credential handling
    // remains out of scope (IMPLEMENTATION_NOTES.md #9).
    const names: RoleName[] = granted?.length ? granted : ["tenant-buyer", "landlord"];
    const roles: HeldRole[] = names.map((role) => ({
      role,
      state: "role-verified",
      subscriptionState: role === "landlord" ? "active" : undefined,
      context: role === "tenant-buyer" ? "rent" : undefined,
    }));

    // A fresh sign-in is the start of a fresh session, so any role choice
    // carried over from a previous one is discarded before resolving.
    writeSessionRole(null);
    const session = resolveSession(roles);
    setState({ isAuthenticated: true, roles, ...session });
  }, []);

  const logout = useCallback(() => {
    writeSessionRole(null);
    setState({ isAuthenticated: false, roles: [], activeRole: null, needsSessionRoleChoice: false });
  }, []);

  const setActiveRole = useCallback((role: RoleName) => {
    // The persistent switcher. Writing through to sessionStorage is what makes
    // the spec's "persists for the rest of that session" true of a mid-session
    // switch, not just of the initial choice.
    writeSessionRole(role);
    setState((prev) => ({ ...prev, activeRole: role, needsSessionRoleChoice: false }));
  }, []);

  const chooseSessionRole = useCallback(
    (role: RoleName) => {
      setActiveRole(role);
    },
    [setActiveRole]
  );

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
      // roles — they remain untouched in `prev.roles`.
      const roles = [...prev.roles, ...added];

      // Registration/role-add is an explicit act of choosing, so it settles
      // the session directly instead of immediately re-asking the user what
      // they just told us. The spec's prompt is for the START of a fresh
      // session, which this is not.
      const active = primaryRole(fresh) ?? prev.activeRole;
      writeSessionRole(active);

      return {
        ...prev,
        isAuthenticated: true,
        roles,
        activeRole: active,
        needsSessionRoleChoice: false,
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
      addRole,
      addRoles,
      setTenantBuyerContext,
    }),
    [state, login, logout, setActiveRole, chooseSessionRole, addRole, addRoles, setTenantBuyerContext]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
