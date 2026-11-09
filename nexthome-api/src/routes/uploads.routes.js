const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth.middleware");
const prisma = require("../lib/prisma");
const { getPresignedUploadUrl } = require("../lib/s3");
const { validateUpload } = require("../lib/upload-policy");

const router = express.Router();

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

// POST /uploads/presign
// Body: { purpose: "listing-photo" | "trust-document" | "ad-image" | "ad-image-pending", fileName, fileType, fileSize }
// Returns a short-lived URL the frontend PUTs the raw file to directly.
// Which role an upload purpose belongs to. Listing photos and ad images end up
// on PUBLIC prefixes of the bucket, so only an account that actually holds the
// matching role may ask for such an upload URL; otherwise any login could host
// public images. A trust document is needed by every role (it is how a role is
// verified), so that purpose only needs a login. The role is read from the
// database, not the token, so a role added a minute ago works immediately.
const ROLE_FOR_PURPOSE = {
  "listing-photo": { role: "landlord", label: "Landlord" },
  "ad-image": { role: "advertiser", label: "Advertiser" },
  "ad-image-pending": { role: "advertiser", label: "Advertiser" },
};

router.post(
  "/presign",
  authenticate,
  [
    body("purpose").isIn(["listing-photo", "trust-document", "ad-image", "ad-image-pending"]),
    body("fileName").isString().notEmpty(),
    body("fileType").isString().notEmpty(),
    // Declared size in bytes — validated against the per-purpose limit below
    // and signed into the upload URL, so S3 enforces it too.
    body("fileSize").isInt({ min: 1 }),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { purpose, fileName, fileType } = req.body;
    const fileSize = Number(req.body.fileSize);

    const problem = validateUpload({ purpose, fileType, fileSize });
    if (problem) return res.status(400).json({ message: problem });

    const needs = ROLE_FOR_PURPOSE[purpose];
    if (needs) {
      const held = await prisma.userRole.findUnique({
        where: { userId_role: { userId: req.user.sub, role: needs.role } },
        select: { id: true },
      });
      if (!held) {
        return res.status(403).json({ message: `Only an account with the ${needs.label} role can upload this.` });
      }
    }
    // Railway terminates TLS at its edge and forwards over plain HTTP, so
    // req.protocol alone would report "http" even though the site is served
    // over https — x-forwarded-proto is what actually reflects that.
    const proto = req.headers["x-forwarded-proto"] || req.protocol;
    const baseUrl = `${proto}://${req.get("host")}`;
    const result = await getPresignedUploadUrl({
      purpose,
      fileName,
      fileType,
      fileSize,
      userId: req.user.sub,
      baseUrl,
    });

    res.json(result);
  },
);

module.exports = router;