const crypto = require("crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const prisma = require("../lib/prisma");
const { sendSms } = require("../lib/sms");
const { getPresignedUploadUrl } = require("../lib/s3");

const router = express.Router();

// Same shape as trust.routes.js's phone-OTP flow (OTP_TTL_MINUTES,
// OTP_MAX_ATTEMPTS, hashValue, generateOtpCode) — this is the identical
// pattern, just keyed by phone instead of userId, since there is no
// account yet for these three endpoints to attach to. See PreRegistrationOtp
// in schema.prisma for why.
const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const PHONE_TOKEN_TTL = "30m";

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
// POST /auth/pre-register/send-otp — body: { phone }
// Unauthenticated: there is no account yet. Abuse protection is a 60s
// resend cooldown per phone, same idea as any OTP flow.
// -----------------------------------------------------------------------
router.post("/send-otp", [body("phone").isString().notEmpty()], async (req, res) => {
  if (!checkValidation(req, res)) return;

  const { phone } = req.body;

  // Sending a real code to an already-registered number just wastes an SMS
  // credit — that phone's registration would 409 at the final /auth/register
  // call anyway, so reject it here before spending anything on it.
  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) {
    return res.status(409).json({ message: "An account with this phone number already exists." });
  }

  const recent = await prisma.preRegistrationOtp.findFirst({
    where: { phone, createdAt: { gt: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS) } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    return res.status(429).json({ message: "Please wait a minute before requesting another code." });
  }

  const code = generateOtpCode();
  const otp = await prisma.preRegistrationOtp.create({
    data: {
      phone,
      codeHash: hashValue(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  try {
    await sendSms(phone, `Your NextHome verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`);
  } catch (err) {
    // sendSms throws in production when the relevant provider (Termii for
    // Nigerian numbers, Twilio otherwise) isn't configured — see sms.js.
    // Delete the row rather than leave it: an undeliverable code would
    // otherwise still count against the 60s resend cooldown above, blocking
    // a retry once the provider IS configured, for no benefit to anyone.
    await prisma.preRegistrationOtp.delete({ where: { id: otp.id } }).catch(() => {});
    console.error("Failed to send pre-registration OTP:", err);
    return res.status(503).json({ message: "We couldn't send a verification code right now. Please try again shortly." });
  }

  res.json({ sent: true });
});

// -----------------------------------------------------------------------
// POST /auth/pre-register/verify-otp — body: { phone, code }
// On success, returns a short-lived signed JWT proving THIS phone number
// was verified — not a login token (no account exists to log into yet).
// POST /auth/register and this file's own /presign-document both verify it
// before trusting anything it claims.
// -----------------------------------------------------------------------
router.post(
  "/verify-otp",
  [body("phone").isString().notEmpty(), body("code").isString().isLength({ min: 6, max: 6 })],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { phone, code } = req.body;

    const otp = await prisma.preRegistrationOtp.findFirst({
      where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return res.status(400).json({ message: "No active code found. Request a new one." });
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Too many incorrect attempts. Request a new code." });
    }

    const matches = hashValue(code) === otp.codeHash;
    if (!matches) {
      await prisma.preRegistrationOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      return res.status(400).json({ message: "Incorrect code." });
    }

    await prisma.preRegistrationOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

    const phoneVerificationToken = jwt.sign(
      { purpose: "phone_verification", phone },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: PHONE_TOKEN_TTL },
    );

    res.json({ phoneVerificationToken });
  },
);

// -----------------------------------------------------------------------
// POST /auth/pre-register/presign-document
// Body: { fileName, fileType, phoneVerificationToken }
// Requires a valid, unexpired phoneVerificationToken — this is the only
// thing standing between this endpoint and an anonymous visitor getting a
// free presigned S3 upload URL, so it is checked exactly like a real auth
// token would be, not just a formality.
// -----------------------------------------------------------------------
router.post(
  "/presign-document",
  [
    body("fileName").isString().notEmpty(),
    body("fileType").isString().notEmpty(),
    body("phoneVerificationToken").isString().notEmpty(),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { fileName, fileType, phoneVerificationToken } = req.body;

    let payload;
    try {
      payload = jwt.verify(phoneVerificationToken, process.env.JWT_ACCESS_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired phone verification token." });
    }
    if (payload.purpose !== "phone_verification" || !payload.phone) {
      return res.status(401).json({ message: "Invalid phone verification token." });
    }

    // Railway terminates TLS at its edge and forwards over plain HTTP — see
    // the identical comment in uploads.routes.js.
    const proto = req.headers["x-forwarded-proto"] || req.protocol;
    const baseUrl = `${proto}://${req.get("host")}`;

    // No userId exists yet, so the verified phone number takes its place in
    // the S3 key path (getPresignedUploadUrl only ever uses it as a path
    // segment) — hashed rather than embedded raw, since S3 keys for
    // "documents/" aren't public and a raw phone number in a key path is an
    // unnecessary PII exposure in logs/URLs even so.
    const phoneHash = hashValue(payload.phone);
    const result = await getPresignedUploadUrl({
      purpose: "trust-document",
      fileName,
      fileType,
      userId: `pending-${phoneHash}`,
      baseUrl,
    });

    res.json(result);
  },
);

module.exports = router;
