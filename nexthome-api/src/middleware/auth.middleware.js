const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

// "Is there a valid account behind this request at all?"
//
// Reads "Authorization: Bearer <token>", verifies it, and attaches the
// decoded payload to req.user for every later middleware/route handler to
// use. Responds 401 immediately if the header is missing or the token is
// invalid/expired.
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = payload; // { sub, email, roles }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

// "Does this account hold one of the roles this route requires?"
//
// Usage: router.get("/something", authenticate, requireRole("landlord"), handler)
// MUST be used AFTER `authenticate`, since it relies on req.user being set.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated." });
    }
    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        message: `This action requires one of these roles: ${allowedRoles.join(", ")}.`,
      });
    }
    next();
  };
}

// "Has this account's role been through document review?"
//
// requireRole only asks whether the account HOLDS a role (read from the JWT).
// Holding a role is not the same as being verified in it: a new landlord holds
// the role from the moment they register, and only becomes "role_verified" once
// an admin approves their document (admin.routes.js, reviewUserRole). Creating
// a listing is gated on the second, and the check has to live here: the
// dashboard hides the form for an unverified role, but that is a convenience,
// and anyone can call the endpoint directly.
//
// The state is read from the database on every request (never from the token),
// so an approval or a rejection takes effect immediately.
//
// Usage: router.post("/", authenticate, requireRole("landlord"), requireVerifiedRole("landlord"), handler)
const VERIFIED_ROLE_LABELS = { landlord: "landlord", service_provider: "service provider" };

function requireVerifiedRole(role) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated." });
    }
    try {
      const held = await prisma.userRole.findUnique({
        where: { userId_role: { userId: req.user.sub, role } },
        select: { state: true },
      });
      if (!held || held.state !== "role_verified") {
        const label = VERIFIED_ROLE_LABELS[role] ?? role;
        return res.status(403).json({
          message: `Your ${label} account needs to be verified before you can list. Finish verification from your Account page.`,
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

// "May this account use the property features (save a home, message a landlord)?"
//
// A Service User account exists to find and contact service providers, with no
// property features. The rule is about the account's WHOLE set of roles: it is
// blocked only when Service User is the only role it holds. An account that
// also holds Renter / Buyer (or Landlord, Service Provider, Advertiser) keeps
// full access, exactly as any other multi-role account does, and an admin
// (which holds no roles) is never blocked.
//
// Read from the database on every call, never from the token: someone who
// adds the Renter / Buyer role must be able to save a home straight away,
// without logging out and in to refresh their token.
const SERVICE_USER_ONLY_MESSAGE =
  "Service User accounts can browse and message service providers, but can't save homes or message landlords. Add the Renter / Buyer role from your Account page to do that.";

async function isServiceUserOnly(userId) {
  const held = await prisma.userRole.findMany({ where: { userId }, select: { role: true } });
  return held.length > 0 && held.every((r) => r.role === "service_user");
}

// Usage: router.put("/", authenticate, requirePropertyAccess, handler)
// MUST be used AFTER `authenticate`.
async function requirePropertyAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated." });
  }
  try {
    if (await isServiceUserOnly(req.user.sub)) {
      return res.status(403).json({ message: SERVICE_USER_ONLY_MESSAGE });
    }
    next();
  } catch (err) {
    next(err);
  }
}

// "Is this account the admin?"
//
// Usage: router.get("/something", authenticate, requireAdmin, handler)
// MUST be used AFTER `authenticate`. isAdmin is orthogonal to the
// RoleName/requireRole system — never combined with it — same as the
// frontend's AuthUser.isAdmin (lib/auth-context.tsx).
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated." });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "This action requires an admin account." });
  }
  next();
}

module.exports = {
  authenticate,
  requireRole,
  requireVerifiedRole,
  requirePropertyAccess,
  isServiceUserOnly,
  SERVICE_USER_ONLY_MESSAGE,
  requireAdmin,
};