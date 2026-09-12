const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth.middleware");
const { getPresignedUploadUrl } = require("../lib/s3");

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
// Body: { purpose: "listing-photo" | "trust-document" | "ad-image", fileName, fileType }
// Returns a short-lived URL the frontend PUTs the raw file to directly.
router.post(
  "/presign",
  authenticate,
  [
    body("purpose").isIn(["listing-photo", "trust-document", "ad-image"]),
    body("fileName").isString().notEmpty(),
    body("fileType").isString().notEmpty(),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { purpose, fileName, fileType } = req.body;
    // Railway terminates TLS at its edge and forwards over plain HTTP, so
    // req.protocol alone would report "http" even though the site is served
    // over https — x-forwarded-proto is what actually reflects that.
    const proto = req.headers["x-forwarded-proto"] || req.protocol;
    const baseUrl = `${proto}://${req.get("host")}`;
    const result = await getPresignedUploadUrl({
      purpose,
      fileName,
      fileType,
      userId: req.user.sub,
      baseUrl,
    });

    res.json(result);
  },
);

module.exports = router;