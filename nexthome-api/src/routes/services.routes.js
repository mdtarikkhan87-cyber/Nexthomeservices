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
// listing should still be able to see it.
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
// POST /services — create a service listing. Service Provider only.
// Starts as "pending_review" — same admin-approval gate as Listings.
// -----------------------------------------------------------------------
router.post(
  "/",
  authenticate,
  requireRole("service_provider"),
  [
    body("category").isString().notEmpty(),
    body("description").isString().isLength({ min: 10 }),
    body("state").isString().notEmpty(),
    // Empty/omitted lgas means "covers the whole state" (PRD §6.6) — not
    // missing data, a real answer.
    body("lgas").optional().isArray(),
    body("photoUrl").optional().isString(),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { category, description, state, lgas, photoUrl } = req.body;

    const service = await prisma.serviceListing.create({
      data: {
        providerId: req.user.sub,
        category,
        description,
        state,
        lgas: lgas || [],
        photoUrl,
      },
    });

    res.status(201).json(service);
  },
);

// -----------------------------------------------------------------------
// GET /services — public search. Only ever returns "live" listings.
// Query params: state, category, lga, page, limit
// -----------------------------------------------------------------------
router.get(
  "/",
  [
    query("state").optional().isString(),
    query("category").optional().isString(),
    query("lga").optional().isString(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { state, category, lga } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const where = {
      status: "live",
      ...(state && { state }),
      ...(category && { category }),
      // A provider with an empty lgas list covers the whole state — matches
      // any lga filter for that state. Otherwise, the requested lga must be
      // explicitly in their coverage list.
      ...(lga && { OR: [{ lgas: { isEmpty: true } }, { lgas: { has: lga } }] }),
    };

    const [services, total] = await Promise.all([
      prisma.serviceListing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { provider: { select: { id: true, name: true } } },
      }),
      prisma.serviceListing.count({ where }),
    ]);

    res.json({
      services,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);

// -----------------------------------------------------------------------
// GET /services/mine — the authenticated provider's own listings,
// regardless of status.
// IMPORTANT: declared before GET /:id, or Express matches "mine" as an id.
// -----------------------------------------------------------------------
router.get("/mine", authenticate, requireRole("service_provider"), async (req, res) => {
  const services = await prisma.serviceListing.findMany({
    where: { providerId: req.user.sub },
    orderBy: { createdAt: "desc" },
  });
  res.json(services);
});

// -----------------------------------------------------------------------
// GET /services/:id — single service listing detail. Public, but only for
// "live" listings — a pending/rejected one is only visible to its owner,
// same moderation gate as the list endpoint above.
// -----------------------------------------------------------------------
router.get("/:id", optionalAuthenticate, [param("id").isString()], async (req, res) => {
  if (!checkValidation(req, res)) return;

  const service = await prisma.serviceListing.findUnique({
    where: { id: req.params.id },
    include: { provider: { select: { id: true, name: true } } },
  });
  const isOwner = req.user && service && service.providerId === req.user.sub;
  if (!service || (service.status !== "live" && !isOwner)) {
    return res.status(404).json({ message: "Service listing not found." });
  }
  res.json(service);
});

// -----------------------------------------------------------------------
// PATCH /services/:id — update. Only the owning provider can.
// -----------------------------------------------------------------------
router.patch(
  "/:id",
  authenticate,
  requireRole("service_provider"),
  [
    param("id").isString(),
    body("category").optional().isString().notEmpty(),
    body("description").optional().isString().isLength({ min: 10 }),
    body("state").optional().isString().notEmpty(),
    body("lgas").optional().isArray(),
    body("photoUrl").optional().isString(),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const existing = await prisma.serviceListing.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "Service listing not found." });
    }
    if (existing.providerId !== req.user.sub) {
      return res.status(403).json({ message: "You don't own this service listing." });
    }

    // Only a fixed set of fields — never let the request body silently
    // overwrite providerId, status, or verified.
    const { category, description, state, lgas, photoUrl } = req.body;
    const updated = await prisma.serviceListing.update({
      where: { id: req.params.id },
      data: { category, description, state, lgas, photoUrl },
    });

    res.json(updated);
  },
);

// -----------------------------------------------------------------------
// DELETE /services/:id — only the owning provider can delete.
// -----------------------------------------------------------------------
router.delete(
  "/:id",
  authenticate,
  requireRole("service_provider"),
  [param("id").isString()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const existing = await prisma.serviceListing.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "Service listing not found." });
    }
    if (existing.providerId !== req.user.sub) {
      return res.status(403).json({ message: "You don't own this service listing." });
    }

    await prisma.serviceListing.delete({ where: { id: req.params.id } });
    res.status(204).send();
  },
);

module.exports = router;