// Holds the short-lived access token IN MEMORY ONLY — never localStorage,
// where any XSS could read it. The long-lived refresh token isn't visible to
// JavaScript at all: the backend keeps it in an httpOnly cookie
// (nexthome-api/src/lib/refresh-tokens.js), and a page reload restores the
// session by calling POST /auth/refresh (see backend-client.ts tryRefresh).
//
// The one thing persisted is a non-secret "a session probably exists" hint,
// so anonymous first-time visitors don't fire a pointless /auth/refresh on
// every page load. It grants nothing: the cookie is still what authenticates.

const SESSION_HINT_KEY = "nexthome:hasSession";

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string) {
  accessToken = token;
  try {
    localStorage.setItem(SESSION_HINT_KEY, "1");
  } catch {
    /* non-fatal — the hint is only an optimisation */
  }
}

export function hasSessionHint(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearTokens() {
  accessToken = null;
  try {
    localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    /* non-fatal */
  }
}
