const crypto = require("crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const prisma = require("../lib/prisma");
const { startVerification, checkVerification, respondWithVerifyError, E164 } = require("../lib/twilio");
const { getPresignedUploadUrl } = require("../lib/s3");
const { validateUpload } = require("../lib/upload-policy");

const router = express.Router();

// Codes are generated, texted, expired and checked by Twilio Verify (see
// lib/twilio.js). There is no account yet for these endpoints to attach to, so
// they are keyed by phone number. PreRegistrationOtp is now only a short send
// log: its rows power the per-number resend cooldown below, which protects
// SMS spend (Twilio separately caps sends per number, and app.js limits per IP).
const OTP_TTL_MINUTES = 10;
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

// -----------------------------------------------------------------------
// POST /auth/pre-register/send-otp — body: { phone }  (E.164, e.g. +2348012345678)
// Unauthenticated: there is no account yet. Abuse protection: the per-IP limiter
// in app.js, a 60s resend cooldown per phone, and Twilio's own per-number limits.
// -----------------------------------------------------------------------
router.post("/send-otp", [body("phone").isString().notEmpty()], async (req, res) => {
  if (!checkValidation(req, res)) return;

  const phone = req.body.phone.trim();
  if (!E164.test(phone)) {
    return res.status(400).json({
      message: "That phone number doesn't look valid. Use international format, for example +2348012345678.",
    });
  }

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

  const log = await prisma.preRegistrationOtp.create({
    data: {
      phone,
      codeHash: "twilio-verify", // placeholder: Twilio owns the code; we never see it
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  try {
    await startVerification(phone);
  } catch (err) {
    // An undeliverable request must not count against the resend cooldown, or a
    // user who typed a bad number would be locked out of retrying for a minute.
    await prisma.preRegistrationOtp.delete({ where: { id: log.id } }).catch(() => {});
    return respondWithVerifyError(res, err);
  }

  res.json({ sent: true });
});

// -----------------------------------------------------------------------
// POST /auth/pre-register/verify-otp — body: { phone, code }
// Twilio checks the code. On success, returns a short-lived signed JWT proving
// THIS phone number was verified — not a login token (no account exists to log
// into yet). POST /auth/register and this file's own /presign-document both
// verify it before trusting anything it claims.
// -----------------------------------------------------------------------
router.post(
  "/verify-otp",
  [body("phone").isString().notEmpty(), body("code").isString()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;
    if (!/^\d{6}$/.test(String(req.body.code))) {
      return res.status(400).json({ message: "Enter the 6-digit code we texted you." });
    }

    const phone = req.body.phone.trim();
    let approved;
    try {
      approved = await checkVerification(phone, req.body.code);
    } catch (err) {
      return respondWithVerifyError(res, err);
    }
    if (!approved) return res.status(400).json({ message: "Incorrect code." });

    await prisma.preRegistrationOtp.updateMany({ where: { phone, consumedAt: null }, data: { consumedAt: new Date() } });

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
    body("fileSize").isInt({ min: 1 }),
    body("phoneVerificationToken").isString().notEmpty(),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { fileName, fileType, phoneVerificationToken } = req.body;
    const fileSize = Number(req.body.fileSize);

    const problem = validateUpload({ purpose: "trust-document", fileType, fileSize });
    if (problem) return res.status(400).json({ message: problem });

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
      fileSize,
      userId: `pending-${phoneHash}`,
      baseUrl,
    });

    res.json(result);
  },
);

module.exports = router;
