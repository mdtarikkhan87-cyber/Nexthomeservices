const jwt = require("jsonwebtoken");

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
  } catch (err) {
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

module.exports = { authenticate, requireRole };