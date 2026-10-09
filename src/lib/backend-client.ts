import { RoleName } from "./types";
import { HeldRole } from "./auth-context";
import { getAccessToken, setAccessToken, clearTokens, hasSessionHint } from "./token-storage";

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
  phoneVerifiedAt: string | null;
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

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    // The refresh-token cookie (httpOnly, set by the API) must ride along on
    // these cross-origin calls for /auth/refresh and /auth/logout to see it.
    credentials: "include",
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
//
// The refresh token lives in an httpOnly cookie, so there's nothing to send
// in the body. The backend ROTATES it on every call and treats re-use of an
// old one as theft (revoking the whole session), so concurrent callers must
// share ONE in-flight request — two parallel refreshes would look like a
// replay and log the user out.
let refreshInFlight: Promise<string | null> | null = null;

export function tryRefresh(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const { accessToken } = await request<{ accessToken: string }>("/auth/refresh", { method: "POST" });
        setAccessToken(accessToken);
        return accessToken;
      } catch (err) {
        // Only a definitive rejection ends the session. A network blip or
        // 5xx (backend redeploying) must not log the user out.
        if (err instanceof ApiError && err.status === 401) clearTokens();
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
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
  /** From apiPreRegisterVerifyOtp — proves `phone` completed OTP
      verification before this account existed. Optional: registration
      still succeeds without it, just with phoneVerifiedAt left unset. */
  phoneVerificationToken?: string;
  /** From apiPreRegisterPresignDocument + the resulting S3 upload — moves
      every role in `roles` straight to pending_admin_document_review at
      creation instead of a separate authenticated call afterward. */
  documentUrl?: string;
}

export async function apiRegister(input: RegisterInput): Promise<void> {
  const { accessToken } = await request<{ accessToken: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...input, roles: input.roles.map((r) => ROLE_TO_BACKEND[r]) }),
  });
  setAccessToken(accessToken);
}

export async function apiLogin(email: string, password: string): Promise<void> {
  const { accessToken } = await request<{ accessToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(accessToken);
}

/** Revokes the session server-side (the refresh token's whole rotation
    family) and clears the cookie. Local state is cleared first so the UI
    logs out instantly and a failed network call can't leave the user
    looking signed-in. */
export async function apiLogout(): Promise<void> {
  clearTokens();
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    /* best effort — the local session is already gone */
  }
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
export async function apiFetchCurrentUser(): Promise<{ id: string; name: string; email: string; isAdmin: boolean; phoneVerified: boolean; roles: RoleName[]; heldRoles: HeldRole[] } | null> {
  // After a page reload the in-memory access token is gone; the httpOnly
  // refresh cookie is what restores the session. Skip the round trip for
  // visitors who've never signed in on this browser.
  if (!getAccessToken()) {
    if (!hasSessionHint() || !(await tryRefresh())) return null;
  }
  try {
    const user = await authedRequest<BackendUser>("/auth/me");
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      phoneVerified: Boolean(user.phoneVerifiedAt),
      roles: user.roles.map((r) => ROLE_TO_FRONTEND[r.role]),
      heldRoles: toFrontendRoles(user.roles),
    };
  } catch {
    return null;
  }
}

/** Redeems the token from the emailed /verify-email link. Rejects with the
    backend's message (400) when the link is invalid, expired or already used. */
export async function apiVerifyEmail(token: string): Promise<void> {
  await request(`/trust/email/verify?token=${encodeURIComponent(token)}`);
}

/** Emails a fresh verification link to the signed-in user. */
export async function apiSendEmailVerification(): Promise<void> {
  await authedRequest("/trust/email/send-verification", { method: "POST" });
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

// ---------------------------------------------------------------------------
// Pre-registration trust layer — used ONLY by the register page, before an
// account exists. Plain `request` (not `authedRequest`): there is no token
// to attach yet, and the backend's /auth/pre-register/* routes are
// deliberately unauthenticated for exactly that reason. See
// nexthome-api/src/routes/pre-register.routes.js.
// ---------------------------------------------------------------------------

export async function apiPreRegisterSendOtp(phone: string): Promise<void> {
  await request("/auth/pre-register/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

/** Returns a short-lived token proving this phone was verified — pass it
    through to apiPreRegisterPresignDocument and/or apiRegister. */
export async function apiPreRegisterVerifyOtp(phone: string, code: string): Promise<{ phoneVerificationToken: string }> {
  return request("/auth/pre-register/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
}

export async function apiPreRegisterPresignDocument(input: {
  fileName: string;
  fileType: string;
  phoneVerificationToken: string;
}): Promise<PresignedUpload> {
  return request("/auth/pre-register/presign-document", {
    method: "POST",
    body: JSON.stringify(input),
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