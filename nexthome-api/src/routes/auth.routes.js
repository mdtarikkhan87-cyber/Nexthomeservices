const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth.middleware");
const {
  initialRoleState,
  initialSubscriptionState,
  issueTokensFor,
} = require("../lib/auth-helpers");

const router = express.Router();

// Every role your frontend's registration screen can submit.
const VALID_ROLES = ["landlord", "tenant_buyer", "service_provider", "advertiser"];

// Small helper: if express-validator found problems with the request body,
// respond with them and stop; otherwise let the route handler continue.
function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

// -----------------------------------------------------------------------
// POST /auth/register
// Body: { name, email, phone?, password, roles: string[] }
// -----------------------------------------------------------------------
router.post(
  "/register",
  [
    body("name").isString().isLength({ min: 2 }),
    body("email").isEmail(),
    body("phone").optional().isString(),
    body("password").isString().isLength({ min: 8 }),
    body("roles").isArray({ min: 1 }),
    body("roles.*").isIn(VALID_ROLES),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { name, email, phone, password, roles } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const uniqueRoles = Array.from(new Set(roles));

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        roles: {
          create: uniqueRoles.map((role) => ({
            role,
            state: initialRoleState(role),
            subscriptionState: initialSubscriptionState(role),
          })),
        },
      },
      include: { roles: true },
    });

    const tokens = issueTokensFor({ userId: user.id, email: user.email, roles: uniqueRoles });
    res.status(201).json(tokens);
  },
);

// -----------------------------------------------------------------------
// POST /auth/login
// Body: { email, password }
// -----------------------------------------------------------------------
router.post(
  "/login",
  [body("email").isEmail(), body("password").isString().isLength({ min: 1 })],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });

    // Same error for "no such user" and "wrong password" — never reveal
    // which one it was, or you've handed an attacker a way to check which
    // emails are registered.
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const roleNames = user.roles.map((r) => r.role);
    const tokens = issueTokensFor({ userId: user.id, email: user.email, roles: roleNames });
    res.json(tokens);
  },
);

// -----------------------------------------------------------------------
// POST /auth/refresh
// Body: { refreshToken }
// -----------------------------------------------------------------------
router.post("/refresh", [body("refreshToken").isString()], async (req, res) => {
  if (!checkValidation(req, res)) return;

  const { refreshToken } = req.body;

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired refresh token." });
  }

  // Re-fetch roles rather than trusting the old token's claims, in case a
  // role was added/changed since the refresh token was issued.
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { roles: true },
  });
  if (!user) {
    return res.status(401).json({ message: "Account no longer exists." });
  }

  const roleNames = user.roles.map((r) => r.role);
  const tokens = issueTokensFor({ userId: user.id, email: user.email, roles: roleNames });
  res.json(tokens);
});

// -----------------------------------------------------------------------
// GET /auth/me — requires "Authorization: Bearer <accessToken>" header
// -----------------------------------------------------------------------
router.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    include: { roles: true },
  });
  if (!user) {
    return res.status(401).json({ message: "Account no longer exists." });
  }
  const { passwordHash, ...safeUser } = user;
  res.json(safeUser);
});

// -----------------------------------------------------------------------
// POST /auth/roles — the "Add a Role" flow from /account.
// Requires "Authorization: Bearer <accessToken>" header.
// Body: { role: string }
// -----------------------------------------------------------------------
router.post(
  "/roles",
  authenticate,
  [body("role").isIn(VALID_ROLES)],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { role } = req.body;
    const userId = req.user.sub;

    const result = await prisma.userRole.upsert({
      where: { userId_role: { userId, role } },
      create: {
        userId,
        role,
        state: initialRoleState(role),
        subscriptionState: initialSubscriptionState(role),
      },
      // If they already held this role, adding it again is a no-op rather
      // than resetting their verification progress.
      update: {},
    });

    res.json(result);
  },
);

module.exports = router;