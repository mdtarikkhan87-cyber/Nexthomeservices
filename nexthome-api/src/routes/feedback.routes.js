const express = require("express");
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

// -----------------------------------------------------------------------
// POST /feedback — PRD §8.2: scoped to "any logged-in user," unlike
// Complaints (open/unauthenticated). No anonymous submission, no status
// workflow — this is read-only signal for the team, not a ticket queue.
// -----------------------------------------------------------------------
router.post(
  "/",
  authenticate,
  [body("body").isString().trim().notEmpty()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const feedback = await prisma.feedback.create({
      data: {
        userId: req.user.sub,
        body: req.body.body,
      },
    });

    res.status(201).json(feedback);
  },
);

module.exports = router;
