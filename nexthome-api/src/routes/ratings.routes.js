const express = require("express");
const { body, param, query, validationResult } = require("express-validator");

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

// -----------------------------------------------------------------------
// POST /ratings — leave a rating on another user (PRD §8.1: a
// tenant/buyer rates a landlord after contacting them via a listing).
// Not restricted to a specific role — any authenticated user can rate any
// other, mirroring the schema (Rating has no role or listing constraint).
// -----------------------------------------------------------------------
router.post(
  "/",
  authenticate,
  [
    body("rateeId").isString().notEmpty(),
    body("score").isInt({ min: 1, max: 5 }),
    body("comment").optional().isString(),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { rateeId, score, comment } = req.body;

    if (rateeId === req.user.sub) {
      return res.status(400).json({ message: "You can't rate yourself." });
    }

    const ratee = await prisma.user.findUnique({ where: { id: rateeId } });
    if (!ratee) {
      return res.status(404).json({ message: "That user doesn't exist." });
    }

    const rating = await prisma.rating.create({
      data: {
        raterId: req.user.sub,
        rateeId,
        score,
        comment,
      },
    });

    res.status(201).json(rating);
  },
);

// -----------------------------------------------------------------------
// GET /ratings/user/:userId — public. Every rating a given user has
// received, newest first — e.g. shown on a landlord's listings.
// -----------------------------------------------------------------------
router.get(
  "/user/:userId",
  [param("userId").isString()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const ratings = await prisma.rating.findMany({
      where: { rateeId: req.params.userId },
      orderBy: { createdAt: "desc" },
      include: { rater: { select: { id: true, name: true } } },
    });

    res.json(ratings);
  },
);

// -----------------------------------------------------------------------
// GET /ratings/mine-given — ratings the authenticated user has given.
// -----------------------------------------------------------------------
router.get("/mine-given", authenticate, async (req, res) => {
  const ratings = await prisma.rating.findMany({
    where: { raterId: req.user.sub },
    orderBy: { createdAt: "desc" },
  });
  res.json(ratings);
});

module.exports = router;