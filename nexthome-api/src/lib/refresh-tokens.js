const crypto = require("crypto");

const prisma = require("./prisma");

// Refresh tokens are opaque random strings, not JWTs: only the server ever
// needs to read one, and a DB row per token is what lets logout and rotation
// actually invalidate it (see RefreshToken in schema.prisma). Only the
// SHA-256 hash is stored.
const COOKIE_NAME = "nh_refresh";
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// The frontend (Vercel) and API (Railway) are different sites, so in
// production the cookie must be SameSite=None; Secure to be sent on
// cross-site fetches (and Safari/ITP will still block it as third-party).
// Once the API is served from a subdomain of the frontend's own domain
// (e.g. app.example.com -> api.example.com) the requests are same-site, and
// REFRESH_COOKIE_SAMESITE=lax is both sufficient and safer against CSRF.
// Locally (localhost:3000 -> localhost:4000 is same-site) Lax works over
// plain http.
function sameSiteSetting(isProd) {
  const configured = (process.env.REFRESH_COOKIE_SAMESITE || "").toLowerCase();
  if (["lax", "strict", "none"].includes(configured)) return configured;
  return isProd ? "none" : "lax";
}

function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  const sameSite = sameSiteSetting(isProd);
  return {
    httpOnly: true,
    // SameSite=None is rejected by browsers without Secure.
    secure: isProd || sameSite === "none",
    sameSite,
    // Only sent to /auth/* — the cookie has no business on any other route.
    path: "/auth",
  };
}

function setRefreshCookie(res, rawToken) {
  res.cookie(COOKIE_NAME, rawToken, { ...cookieOptions(), maxAge: REFRESH_TTL_MS });
}

function clearRefreshCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
}

function readRefreshCookie(req) {
  const value = req.cookies && req.cookies[COOKIE_NAME];
  return typeof value === "string" && value ? value : null;
}

// Creates a new refresh token row. Pass an existing familyId when rotating.
async function createRefreshToken(userId, familyId = crypto.randomUUID()) {
  const raw = crypto.randomBytes(48).toString("hex");
  const row = await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      familyId,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });
  return { raw, row };
}

// Validates and rotates in one step. Returns { userId, raw } for the new
// token, or null if the presented token is unknown, expired or revoked.
// Presenting an already-revoked token means someone is replaying a token
// that was already rotated away (the legitimate client holds the newer
// one), so the entire family is revoked — thief and victim both have to
// log in again.
async function rotateRefreshToken(rawToken) {
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!existing) return null;

  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: existing.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return null;
  }
  if (existing.expiresAt <= new Date()) return null;

  // revokedAt: null in the WHERE makes the claim atomic: if two requests
  // race with the same token, exactly one wins.
  const claimed = await prisma.refreshToken.updateMany({
    where: { id: existing.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (claimed.count !== 1) return null;

  const next = await createRefreshToken(existing.userId, existing.familyId);
  await prisma.refreshToken.update({ where: { id: existing.id }, data: { replacedById: next.row.id } });
  return { userId: existing.userId, raw: next.raw };
}

async function revokeFamilyByToken(rawToken) {
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!existing) return;
  await prisma.refreshToken.updateMany({
    where: { familyId: existing.familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function revokeAllForUser(userId) {
  await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

module.exports = {
  createRefreshToken,
  rotateRefreshToken,
  revokeFamilyByToken,
  revokeAllForUser,
  setRefreshCookie,
  clearRefreshCookie,
  readRefreshCookie,
};
