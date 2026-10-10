const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth.middleware");
const { sendEmail, buildWelcomeEmailHtml } = require("../lib/email");
const {
  initialRoleState,
  initialSubscriptionState,
  signAccessToken,
  startSession,
} = require("../lib/auth-helpers");
const {
  rotateRefreshToken,
  revokeFamilyByToken,
  revokeAllForUser,
  setRefreshCookie,
  clearRefreshCookie,
  readRefreshCookie,
} = require("../lib/refresh-tokens");

const router = express.Router();

// Every role your frontend's registration screen can submit.
const VALID_ROLES = ["landlord", "tenant_buyer", "service_provider", "advertiser"];

// What the signed-in user may be sent about themselves. Secrets never leave
// the server: the password hash, and the mother's maiden name (a recovery
// answer — it is only ever written at registration and never read by the
// client, so there is no reason for it to travel to the browser).
function toPublicUser(user) {
  const { passwordHash: _passwordHash, motherMaidenName: _motherMaidenName, ...safeUser } = user;
  return safeUser;
}

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
    body("motherMaidenName").optional().isString(),
    body("roles").isArray({ min: 1 }),
    body("roles.*").isIn(VALID_ROLES),
    // Both optional and both produced by the pre-registration trust-layer
    // step (pre-register.routes.js) — this endpoint is now the ONE moment a
    // real account gets created, whether or not that step ran. Neither
    // field blocks registration if missing or invalid; they only decide
    // whether phoneVerifiedAt/documentUrl get set immediately below.
    body("phoneVerificationToken").optional().isString(),
    body("documentUrl").optional().isString(),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { name, email, phone, password, motherMaidenName, roles, phoneVerificationToken, documentUrl } = req.body;

    // Basic Trust Layer: every role now goes through phone + document
    // review (extended from the original landlord/service-provider-only
    // scope — see auth-helpers.js initialRoleState), so mother's maiden
    // name and a phone number are required for any registration.
    if (!motherMaidenName) {
      return res.status(400).json({
        message: "Mother's maiden name is required.",
      });
    }
    if (!phone) {
      return res.status(400).json({
        message: "A phone number is required for identity verification.",
      });
    }

        const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return res.status(409).json({ message: "An account with this phone number already exists." });
      }
    }

    // A phoneVerificationToken only ever proves ONE thing: this exact phone
    // number completed OTP verification during pre-registration (see
    // pre-register.routes.js). Cross-checking payload.phone against the
    // phone actually being registered stops someone from verifying phone A
    // and reusing that proof to mark a DIFFERENT phone B "verified" here
    // without ever texting B. An invalid/expired/mismatched token never
    // blocks registration outright — it just leaves phoneVerifiedAt unset,
    // same as if the trust-layer step had never run.
    let phoneVerifiedAt = null;
    if (phoneVerificationToken) {
      try {
        const payload = jwt.verify(phoneVerificationToken, process.env.JWT_ACCESS_SECRET);
        if (payload.purpose === "phone_verification" && payload.phone === phone) {
          phoneVerifiedAt = new Date();
        }
      } catch {
        // Invalid or expired — phone just stays unverified.
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const uniqueRoles = Array.from(new Set(roles));

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        motherMaidenName,
        phoneVerifiedAt,
        roles: {
          create: uniqueRoles.map((role) => {
            // VALID_ROLES doubles as "roles needing trust-layer review" —
            // every one of them does today (trust.routes.js's own
            // ROLES_NEEDING_TRUST_LAYER is the identical four), so a
            // documentUrl submitted for ANY selected role moves it straight
            // to pending_admin_document_review at creation instead of the
            // separate authenticated POST /trust/roles/:role/document call
            // this used to require after the account already existed.
            const needsReview = documentUrl && VALID_ROLES.includes(role);
            return {
              role,
              state: needsReview ? "pending_admin_document_review" : initialRoleState(role),
              subscriptionState: initialSubscriptionState(role),
              documentUrl: needsReview ? documentUrl : undefined,
              documentSubmittedAt: needsReview ? new Date() : undefined,
            };
          }),
        },
      },
      include: { roles: true },
    });

    // Fire the email verification link immediately on registration — don't
    // block the response on it (verification isn't required to use the
    // account, per PRD; it's tracked separately via emailVerifiedAt).
    const rawToken = crypto.randomBytes(32).toString("hex");
    prisma.emailVerificationToken
      .create({
        data: {
          userId: user.id,
          tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })
      .then(() => {
        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;
        // One email doing both jobs — the warm welcome moment AND the
        // verification link — rather than two emails landing seconds apart.
        return sendEmail({
          to: user.email,
          subject: "Welcome to NextHome! 🎉",
          html: buildWelcomeEmailHtml({ name: user.name, roles: uniqueRoles, verifyUrl }),
        });
      })
      .catch((err) => console.error("Failed to send verification email:", err));

    const session = await startSession(res, { userId: user.id, email: user.email, roles: uniqueRoles, isAdmin: user.isAdmin });
    res.status(201).json(session);
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
    const session = await startSession(res, { userId: user.id, email: user.email, roles: roleNames, isAdmin: user.isAdmin });
    res.json(session);
  },
);

// -----------------------------------------------------------------------
// POST /auth/refresh
// No body — the refresh token arrives in the httpOnly `nh_refresh` cookie.
// Rotates: the presented token is revoked and a new one set in its place.
// Replaying an already-rotated token revokes the whole session family.
// -----------------------------------------------------------------------
router.post("/refresh", async (req, res) => {
  const presented = readRefreshCookie(req);
  if (!presented) {
    return res.status(401).json({ message: "No refresh token." });
  }

  const rotated = await rotateRefreshToken(presented);
  if (!rotated) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Invalid or expired refresh token." });
  }

  // Re-fetch roles rather than trusting stale claims, in case a role was
  // added/changed since the last token was issued.
  const user = await prisma.user.findUnique({
    where: { id: rotated.userId },
    include: { roles: true },
  });
  if (!user) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Account no longer exists." });
  }

  setRefreshCookie(res, rotated.raw);
  const roleNames = user.roles.map((r) => r.role);
  res.json({ accessToken: signAccessToken({ userId: user.id, email: user.email, roles: roleNames, isAdmin: user.isAdmin }) });
});

// -----------------------------------------------------------------------
// POST /auth/logout
// Revokes the refresh token's whole family server-side and clears the
// cookie. Always 204 — logging out must never fail from the user's side,
// even with a missing/expired/unknown cookie.
// -----------------------------------------------------------------------
router.post("/logout", async (req, res) => {
  const presented = readRefreshCookie(req);
  if (presented) {
    try {
      await revokeFamilyByToken(presented);
    } catch (err) {
      console.error("Failed to revoke refresh token on logout:", err);
    }
  }
  clearRefreshCookie(res);
  res.sendStatus(204);
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
  res.json(toPublicUser(user));
});

// -----------------------------------------------------------------------
// PATCH /auth/me — update the signed-in user's own name and/or phone.
// Body: { name?, phone? }
//
// Email is deliberately NOT editable here: it is the login identity and the
// target of email verification, so changing it needs its own re-verification
// flow rather than a silent field edit — a request that includes it is
// rejected with a clear message instead of being ignored.
//
// Changing the phone clears phoneVerifiedAt (the new number is unproven) and
// cancels any outstanding OTP — the verify route matches a code to the USER,
// not to a number, so without this a code texted to the OLD number could be
// used to mark the NEW one verified.
// -----------------------------------------------------------------------
router.patch(
  "/me",
  authenticate,
  [
    body("name").optional().isString().trim().isLength({ min: 2, max: 100 }),
    body("phone").optional().isString().matches(/^\+[1-9]\d{6,14}$/).withMessage("Enter the phone number in international format, e.g. +2348012345678."),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    if (req.body.email !== undefined) {
      return res.status(400).json({
        message: "Your email address can't be changed here — it's your login and is tied to verification.",
      });
    }

    const { name, phone } = req.body;
    if (name === undefined && phone === undefined) {
      return res.status(400).json({ message: "Nothing to update." });
    }

    const existing = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!existing) {
      return res.status(401).json({ message: "Account no longer exists." });
    }

    const data = {};
    if (name !== undefined) data.name = name;

    const phoneChanged = phone !== undefined && phone !== existing.phone;
    if (phoneChanged) {
      const taken = await prisma.user.findUnique({ where: { phone } });
      if (taken && taken.id !== existing.id) {
        return res.status(409).json({ message: "An account with this phone number already exists." });
      }
      data.phone = phone;
      data.phoneVerifiedAt = null;
    }

    const [user] = await prisma.$transaction([
      prisma.user.update({ where: { id: existing.id }, data, include: { roles: true } }),
      ...(phoneChanged
        ? [prisma.otpCode.updateMany({ where: { userId: existing.id, consumedAt: null }, data: { consumedAt: new Date() } })]
        : []),
    ]);

    res.json(toPublicUser(user));
  },
);

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

// -----------------------------------------------------------------------
// POST /auth/forgot-password
// Body: { email }
// Always responds the same way regardless of whether the email is
// registered — unlike /auth/register's 409, a password-reset endpoint is
// exactly the kind of place account enumeration matters, so this never
// reveals which emails exist.
// -----------------------------------------------------------------------
router.post(
  "/forgot-password",
  [body("email").isEmail()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
      sendEmail({
        to: user.email,
        subject: "Reset your NextHome password",
        html: `<p>Hi ${user.name},</p><p>Click below to set a new password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
      }).catch((err) => console.error("Failed to send password reset email:", err));
    }

    res.json({ message: "If an account exists for that email, a reset link has been sent." });
  },
);

// -----------------------------------------------------------------------
// POST /auth/reset-password
// Body: { token, password }
// -----------------------------------------------------------------------
router.post(
  "/reset-password",
  [body("token").isString().notEmpty(), body("password").isString().isLength({ min: 8 })],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { token, password } = req.body;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const record = await prisma.passwordResetToken.findFirst({
      where: { tokenHash, consumedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!record) {
      return res.status(400).json({ message: "This reset link is invalid or has expired." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
    ]);
    // A password reset is the "I think someone else has my account" path —
    // kill every session that existed before it.
    await revokeAllForUser(record.userId);

    res.json({ message: "Password reset. You can now log in with your new password." });
  },
);

module.exports = router;