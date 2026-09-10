const jwt = require("jsonwebtoken");

// Which state a newly-added role starts in. Every role now goes through
// phone + document review before it's trusted — a later product decision
// than PRODUCT_DECISIONS.md §6's original landlord/service-provider-only
// scope, extended to all roles (register page trust-layer step).
function initialRoleState() {
  return "role_added"; // -> pending_admin_document_review later, set by admin
}

// Only landlords have a subscription; everyone else gets null/undefined.
function initialSubscriptionState(role) {
  return role === "landlord" ? "inactive" : undefined;
}

// Builds and signs both tokens for a user. `roles` is a plain array of role
// name strings, e.g. ["landlord", "tenant_buyer"]. `isAdmin` is embedded the
// same way `roles` is — trusted from the token, same as requireRole checks
// req.user.roles directly rather than re-querying the DB per request.
function issueTokensFor({ userId, email, roles, isAdmin }) {
  const payload = { sub: userId, email, roles, isAdmin: Boolean(isAdmin) };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

  return { accessToken, refreshToken };
}

module.exports = { initialRoleState, initialSubscriptionState, issueTokensFor };