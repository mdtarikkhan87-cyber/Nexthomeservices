const express = require("express");
const jwt = require("jsonwebtoken");
const { body, query, param, validationResult } = require("express-validator");

const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

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
// otherwise. GET /:id is public, but an owner checking their own pending
// ad should still be able to see it.
function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length);
    try {
      req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch {
      // Invalid/expired token on an optional-auth route — proceed as an
      // anonymous request rather than rejecting it.
    }
  }
  next();
}

// -----------------------------------------------------------------------
// POST /ads — submit an ad for review. Advertiser only.
// `placement`, `startsAt`, `endsAt` are deliberately NOT settable here —
// PRD §9: "the admin decides where ads appear... how long they run, and
// what they cost." Those get set later by an admin (Admin phase, not yet
// built). An advertiser can only submit the creative itself.
// -----------------------------------------------------------------------
router.post(
  "/",
  authenticate,
  requireRole("advertiser"),
  [
    body("imageUrl").isString().notEmpty(),
    body("headline").isString().isLength({ min: 3 }),
    body("linkUrl").isURL(),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { imageUrl, headline, linkUrl } = req.body;

    const ad = await prisma.advertisement.create({
      data: {
        advertiserId: req.user.sub,
        imageUrl,
        headline,
        linkUrl,
      },
    });

    res.status(201).json(ad);
  },
);

// -----------------------------------------------------------------------
// GET /ads — public. Only "live" ads, currently within their active
// window if the admin has set one (startsAt/endsAt). An ad with no
// window set (nothing admin-configured yet) is treated as always active
// once live — matches today's reality where the Admin phase doesn't
// exist yet to set a window.
// Query params: placement, page, limit
// -----------------------------------------------------------------------
router.get(
  "/",
  [
    query("placement").optional().isString(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { placement } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const now = new Date();

    const where = {
      status: "live",
      ...(placement && { placement }),
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    };

    const [ads, total] = await Promise.all([
      prisma.advertisement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.advertisement.count({ where }),
    ]);

    res.json({
      ads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);

// -----------------------------------------------------------------------
// GET /ads/mine — the authenticated advertiser's own ads, any status.
// IMPORTANT: declared before GET /:id, or Express matches "mine" as an id.
// -----------------------------------------------------------------------
router.get("/mine", authenticate, requireRole("advertiser"), async (req, res) => {
  const ads = await prisma.advertisement.findMany({
    where: { advertiserId: req.user.sub },
    orderBy: { createdAt: "desc" },
  });
  res.json(ads);
});

// -----------------------------------------------------------------------
// GET /ads/:id — single ad detail. Public, but only for "live" ads — a
// pending/rejected one is only visible to its owner, same moderation gate
// as the list endpoint above.
// -----------------------------------------------------------------------
router.get("/:id", optionalAuthenticate, [param("id").isString()], async (req, res) => {
  if (!checkValidation(req, res)) return;

  const ad = await prisma.advertisement.findUnique({ where: { id: req.params.id } });
  const isOwner = req.user && ad && ad.advertiserId === req.user.sub;
  if (!ad || (ad.status !== "live" && !isOwner)) {
    return res.status(404).json({ message: "Advertisement not found." });
  }
  res.json(ad);
});

// -----------------------------------------------------------------------
// PATCH /ads/:id — update the creative. Only the owning advertiser can,
// and only the creative fields — placement/status/dates stay admin-only.
// -----------------------------------------------------------------------
router.patch(
  "/:id",
  authenticate,
  requireRole("advertiser"),
  [
    param("id").isString(),
    body("imageUrl").optional().isString().notEmpty(),
    body("headline").optional().isString().isLength({ min: 3 }),
    body("linkUrl").optional().isURL(),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const existing = await prisma.advertisement.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "Advertisement not found." });
    }
    if (existing.advertiserId !== req.user.sub) {
      return res.status(403).json({ message: "You don't own this advertisement." });
    }

    const { imageUrl, headline, linkUrl } = req.body;
    const updated = await prisma.advertisement.update({
      where: { id: req.params.id },
      data: { imageUrl, headline, linkUrl },
    });

    res.json(updated);
  },
);

// -----------------------------------------------------------------------
// DELETE /ads/:id — only the owning advertiser can delete.
// -----------------------------------------------------------------------
router.delete(
  "/:id",
  authenticate,
  requireRole("advertiser"),
  [param("id").isString()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const existing = await prisma.advertisement.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "Advertisement not found." });
    }
    if (existing.advertiserId !== req.user.sub) {
      return res.status(403).json({ message: "You don't own this advertisement." });
    }

    await prisma.advertisement.delete({ where: { id: req.params.id } });
    res.status(204).send();
  },
);

module.exports = router;