// ---------------------------------------------------------------------------
// Admin identification — placeholder pending backend.
//
// There is no real authentication yet, so "is this an admin" is decided the
// same way the demo accounts are: a hardcoded, documented placeholder — not
// a real security check yet.
//
// TEMPORARY: once the backend exists, this check should move server-side.
// The backend should return `isAdmin: true` on the logged-in user; this
// file's job then becomes reading that flag, not checking a raw email.
// ---------------------------------------------------------------------------

const ADMIN_EMAILS = ["owner@nexthome.example"];

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}