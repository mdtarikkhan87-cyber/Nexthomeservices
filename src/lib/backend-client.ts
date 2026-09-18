import { RoleName } from "./types";
import { HeldRole } from "./auth-context";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./token-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ---------------------------------------------------------------------------
// Naming translation — the backend (Prisma doesn't allow hyphens in schema
// enums) uses underscores; this entire frontend codebase already uses
// hyphens for RoleName/RoleState/SubscriptionState. Rather than rewriting
// every existing frontend file, we translate at this one boundary.
// ---------------------------------------------------------------------------

type BackendRoleName = "landlord" | "tenant_buyer" | "service_provider" | "advertiser";
type BackendRoleState = "role_added" | "pending_admin_document_review" | "role_verified";
type BackendSubscriptionState = "inactive" | "pending_confirmation" | "active";

interface BackendUserRole {
  role: BackendRoleName;
  state: BackendRoleState;
  subscriptionState: BackendSubscriptionState | null;
  context: "rent" | "sale" | null;
}

interface BackendUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  roles: BackendUserRole[];
}

const ROLE_TO_BACKEND: Record<RoleName, BackendRoleName> = {
  "landlord": "landlord",
  "tenant-buyer": "tenant_buyer",
  "service-provider": "service_provider",
  "advertiser": "advertiser",
};
const ROLE_TO_FRONTEND: Record<BackendRoleName, RoleName> = {
  landlord: "landlord",
  tenant_buyer: "tenant-buyer",
  service_provider: "service-provider",
  advertiser: "advertiser",
};
const STATE_TO_FRONTEND: Record<BackendRoleState, HeldRole["state"]> = {
  role_added: "role-added",
  pending_admin_document_review: "pending-admin-document-review",
  role_verified: "role-verified",
};
const SUBSCRIPTION_TO_FRONTEND: Record<BackendSubscriptionState, NonNullable<HeldRole["subscriptionState"]>> = {
  inactive: "inactive",
  pending_confirmation: "pending-confirmation",
  active: "active",
};

function toFrontendRoles(backendRoles: BackendUserRole[]): HeldRole[] {
  return backendRoles.map((r) => ({
    role: ROLE_TO_FRONTEND[r.role],
    state: STATE_TO_FRONTEND[r.state],
    subscriptionState: r.subscriptionState ? SUBSCRIPTION_TO_FRONTEND[r.subscriptionState] : undefined,
    context: r.context ?? undefined,
  }));
}

// ---------------------------------------------------------------------------
// Low-level fetch helper
// ---------------------------------------------------------------------------

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Attaches the current access token, and retries ONCE after a silent token
// refresh if the server says the token is expired/invalid (401).
export async function authedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = getAccessToken();
  try {
    return await request<T>(path, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return request<T>(path, {
          ...options,
          headers: { ...options.headers, Authorization: `Bearer ${refreshed}` },
        });
      }
    }
    throw err;
  }
}

// Exported so socket-context.tsx can trigger the same refresh proactively
// on a socket auth failure — see its `connect_error` handler for why a
// purely reactive (401-only) refresh isn't enough for a long-lived socket.
export async function tryRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const tokens = await request<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    setTokens(tokens.accessToken, tokens.refreshToken);
    return tokens.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API — everything auth-context.tsx and the register page call
// ---------------------------------------------------------------------------

export interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  /** Basic Trust Layer (PRD §6.1) — required by the backend only when
      `roles` includes "landlord" or "service-provider"; omit otherwise. */
  motherMaidenName?: string;
  roles: RoleName[];
}

export async function apiRegister(input: RegisterInput): Promise<void> {
  const tokens = await request<{ accessToken: string; refreshToken: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...input, roles: input.roles.map((r) => ROLE_TO_BACKEND[r]) }),
  });
  setTokens(tokens.accessToken, tokens.refreshToken);
}

export async function apiLogin(email: string, password: string): Promise<void> {
  const tokens = await request<{ accessToken: string; refreshToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setTokens(tokens.accessToken, tokens.refreshToken);
}

export function apiLogout() {
  clearTokens();
}

/** Always resolves the same way regardless of whether the email is
    registered — the backend deliberately never reveals which emails exist
    here (unlike /auth/register's 409). */
export async function apiForgotPassword(email: string): Promise<void> {
  await request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function apiResetPassword(token: string, password: string): Promise<void> {
  await request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

/** Fetches the current user + roles, translated into frontend-shaped data.
    Returns null if there's no valid session (no token, or refresh failed). */
export async function apiFetchCurrentUser(): Promise<{ id: string; name: string; email: string; isAdmin: boolean; roles: RoleName[]; heldRoles: HeldRole[] } | null> {
  if (!getAccessToken()) return null;
  try {
    const user = await authedRequest<BackendUser>("/auth/me");
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      roles: user.roles.map((r) => ROLE_TO_FRONTEND[r.role]),
      heldRoles: toFrontendRoles(user.roles),
    };
  } catch {
    return null;
  }
}

export async function apiAddRole(role: RoleName): Promise<void> {
  await authedRequest("/auth/roles", {
    method: "POST",
    body: JSON.stringify({ role: ROLE_TO_BACKEND[role] }),
  });
}

export async function apiSendPhoneOtp(): Promise<void> {
  await authedRequest("/trust/phone/send-otp", { method: "POST" });
}

export async function apiVerifyPhoneOtp(code: string): Promise<void> {
  await authedRequest("/trust/phone/verify-otp", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export interface PresignedUpload {
  uploadUrl: string;
  key: string;
  publicUrl: string | null;
  dev?: boolean;
}

export async function apiGetPresignedUpload(input: {
  purpose: "listing-photo" | "trust-document" | "ad-image";
  fileName: string;
  fileType: string;
}): Promise<PresignedUpload> {
  return authedRequest("/uploads/presign", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiSubmitTrustDocument(role: RoleName, documentUrl: string): Promise<void> {
  const backendRole = ROLE_TO_BACKEND[role];
  await authedRequest(`/trust/roles/${backendRole}/document`, {
    method: "POST",
    body: JSON.stringify({ documentUrl }),
  });
}