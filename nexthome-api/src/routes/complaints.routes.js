const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

// Unlike `authenticate`, this NEVER rejects the request — it just attaches
// req.user if a valid token happens to be present, and silently continues
// otherwise. Complaints are explicitly an open/unauthenticated form (PRD
// §8.3, IMPLEMENTATION_NOTES.md #3): a logged-in visitor's complaint gets
// linked to their account, but nobody is required to log in to file one.
function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length);
    try {
      req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch {
      // Invalid/expired token on an optional-auth route — proceed as an
      // anonymous submission rather than rejecting the request.
    }
  }
  next();
}

// -----------------------------------------------------------------------
// POST /complaints — file a complaint. Open to anyone; linked to an
// account only if the request happens to carry a valid access token.
// -----------------------------------------------------------------------
router.post(
  "/",
  optionalAuthenticate,
  [
    body("subject").isString().isLength({ min: 3 }),
    body("body").isString().isLength({ min: 10 }),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { subject, body: complaintBody } = req.body;

    const complaint = await prisma.complaintTicket.create({
      data: {
        userId: req.user ? req.user.sub : null,
        subject,
        body: complaintBody,
      },
    });

    res.status(201).json(complaint);
  },
);

// -----------------------------------------------------------------------
// GET /complaints/mine — complaints the authenticated user has filed.
// Requires real auth (not optional) — there's nothing to look up for an
// anonymous visitor, since their past submissions were never linked to
// any account.
// -----------------------------------------------------------------------
router.get("/mine", authenticate, async (req, res) => {
  const complaints = await prisma.complaintTicket.findMany({
    where: { userId: req.user.sub },
    orderBy: { createdAt: "desc" },
  });
  res.json(complaints);
});

module.exports = router;