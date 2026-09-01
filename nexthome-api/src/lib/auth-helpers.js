const jwt = require("jsonwebtoken");

// Which state a newly-added role starts in, mirroring the frontend's
// PRODUCT_DECISIONS.md §6 model: landlord & service-provider need admin
// document review before they're trusted; tenant-buyer & advertiser don't.
function initialRoleState(role) {
  if (role === "landlord" || role === "service_provider") {
    return "role_added"; // -> pending_admin_document_review later, set by admin
  }
  return "role_verified";
}

// Only landlords have a subscription; everyone else gets null/undefined.
function initialSubscriptionState(role) {
  return role === "landlord" ? "inactive" : undefined;
}

// Builds and signs both tokens for a user. `roles` is a plain array of role
// name strings, e.g. ["landlord", "tenant_buyer"].
function issueTokensFor({ userId, email, roles }) {
  const payload = { sub: userId, email, roles };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

  return { accessToken, refreshToken };
}

module.exports = { initialRoleState, initialSubscriptionState, issueTokensFor };