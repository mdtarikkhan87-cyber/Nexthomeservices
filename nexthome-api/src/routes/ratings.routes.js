const express = require("express");
const { body, param, validationResult } = require("express-validator");

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
// Not restricted to a specific role, but the rater and ratee must have messaged
// each other (a shared conversation), and each rater has one rating per ratee.
// -----------------------------------------------------------------------
router.post(
  "/",
  authenticate,
  [
    body("rateeId").isString().notEmpty(),
    body("score").isInt({ min: 1, max: 5 }),
    body("comment").optional().isString().isLength({ max: 1000 }),
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

    // A rating has to come from a real interaction: the rater and the ratee
    // must share a conversation (about a listing or a service). Without this
    // anyone could rate anyone they had never dealt with.
    const interaction = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participantAId: req.user.sub, participantBId: rateeId },
          { participantAId: rateeId, participantBId: req.user.sub },
        ],
      },
      select: { id: true },
    });
    if (!interaction) {
      return res.status(403).json({ message: "You can rate someone after you've messaged them." });
    }

    // One rating per rater and target. A second submission REPLACES the first
    // (people change their mind) instead of stacking another row, so a score
    // can't be inflated or bombed by repeating it. Any older duplicates that
    // already exist for the pair are removed in the same step.
    const rating = await prisma.$transaction(async (tx) => {
      const existing = await tx.rating.findMany({
        where: { raterId: req.user.sub, rateeId },
        orderBy: { createdAt: "desc" },
      });
      if (existing.length === 0) {
        return { created: true, row: await tx.rating.create({ data: { raterId: req.user.sub, rateeId, score, comment } }) };
      }
      const [latest, ...older] = existing;
      if (older.length) await tx.rating.deleteMany({ where: { id: { in: older.map((r) => r.id) } } });
      return { created: false, row: await tx.rating.update({ where: { id: latest.id }, data: { score, comment: comment ?? null } }) };
    });

    res.status(rating.created ? 201 : 200).json(rating.row);
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