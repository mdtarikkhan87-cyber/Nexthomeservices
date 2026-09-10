const crypto = require("crypto");
const express = require("express");
const { body, query, validationResult } = require("express-validator");

const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth.middleware");
const { sendSms } = require("../lib/sms");
const { sendEmail } = require("../lib/email");

const router = express.Router();

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const EMAIL_TOKEN_TTL_HOURS = 24;
const ROLES_NEEDING_TRUST_LAYER = ["landlord", "tenant_buyer", "service_provider", "advertiser"];

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

function hashValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function generateOtpCode() {
  return String(crypto.randomInt(100000, 999999)); // 6 digits
}

// -----------------------------------------------------------------------
// POST /trust/phone/send-otp
// -----------------------------------------------------------------------
router.post("/phone/send-otp", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) return res.status(401).json({ message: "Account not found." });
  if (!user.phone) {
    return res.status(400).json({ message: "No phone number on file for this account." });
  }
  if (user.phoneVerifiedAt) {
    return res.status(400).json({ message: "Phone is already verified." });
  }

  const code = generateOtpCode();
  await prisma.otpCode.create({
    data: {
      userId: user.id,
      codeHash: hashValue(code),
      purpose: "phone_verification",
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  await sendSms(user.phone, `Your NextHome verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`);

  res.json({ sent: true });
});

// -----------------------------------------------------------------------
// POST /trust/phone/verify-otp
// Body: { code }
// -----------------------------------------------------------------------
router.post(
  "/phone/verify-otp",
  authenticate,
  [body("code").isString().isLength({ min: 6, max: 6 })],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const otp = await prisma.otpCode.findFirst({
      where: {
        userId: req.user.sub,
        purpose: "phone_verification",
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return res.status(400).json({ message: "No active code found. Request a new one." });
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Too many incorrect attempts. Request a new code." });
    }

    const matches = hashValue(req.body.code) === otp.codeHash;
    if (!matches) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      return res.status(400).json({ message: "Incorrect code." });
    }

    await prisma.$transaction([
      prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
      prisma.user.update({ where: { id: req.user.sub }, data: { phoneVerifiedAt: new Date() } }),
    ]);

    res.json({ verified: true });
  },
);

// -----------------------------------------------------------------------
// POST /trust/email/send-verification
// -----------------------------------------------------------------------
router.post("/email/send-verification", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) return res.status(401).json({ message: "Account not found." });
  if (user.emailVerifiedAt) {
    return res.status(400).json({ message: "Email is already verified." });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashValue(rawToken),
      expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_HOURS * 60 * 60 * 1000),
    },
  });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your NextHome email address",
    html: `<p>Hi ${user.name},</p><p>Click below to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in ${EMAIL_TOKEN_TTL_HOURS} hours.</p>`,
  });

  res.json({ sent: true });
});

// -----------------------------------------------------------------------
// GET /trust/email/verify?token=...
// Public — the link itself, clicked from an email, IS the credential.
// -----------------------------------------------------------------------
router.get("/email/verify", [query("token").isString().notEmpty()], async (req, res) => {
  if (!checkValidation(req, res)) return;

  const tokenHash = hashValue(req.query.token);
  const record = await prisma.emailVerificationToken.findFirst({
    where: { tokenHash, consumedAt: null, expiresAt: { gt: new Date() } },
  });

  if (!record) {
    return res.status(400).json({ message: "This verification link is invalid or has expired." });
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
  ]);

  res.json({ verified: true });
});

// -----------------------------------------------------------------------
// POST /trust/roles/:role/document
// Body: { documentUrl }  (the frontend already uploaded to S3 via
// /uploads/presign and is now telling us where it landed)
// Moves that role from "role_added" into "pending_admin_document_review" —
// an admin approving it later (Admin panel, next phase) moves it to
// "role_verified".
// -----------------------------------------------------------------------
router.post(
  "/roles/:role/document",
  authenticate,
  [body("documentUrl").isString().notEmpty()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { role } = req.params;
    if (!ROLES_NEEDING_TRUST_LAYER.includes(role)) {
      return res.status(400).json({ message: "This role doesn't require document review." });
    }

    const userRole = await prisma.userRole.findUnique({
      where: { userId_role: { userId: req.user.sub, role } },
    });
    if (!userRole) {
      return res.status(404).json({ message: "You don't hold this role." });
    }

    const updated = await prisma.userRole.update({
      where: { id: userRole.id },
      data: {
        documentUrl: req.body.documentUrl,
        documentSubmittedAt: new Date(),
        state: userRole.state === "role_verified" ? userRole.state : "pending_admin_document_review",
      },
    });

    res.json(updated);
  },
);

module.exports = router;