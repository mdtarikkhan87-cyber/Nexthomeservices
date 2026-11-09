const express = require("express");
const jwt = require("jsonwebtoken");
const { body, query, param, validationResult } = require("express-validator");

const prisma = require("../lib/prisma");
const { normalizeCategory, CATEGORY_PATTERN } = require("../lib/service-category");
const { ACTOR, EVENTS, emitToUser, publishServiceChange, publishAdminQueueChange } = require("../lib/realtime");
const { authenticate, requireRole, requireVerifiedRole } = require("../middleware/auth.middleware");

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
// POST /services — create a service listing. Verified service provider only.
// Starts as "pending_review" — same admin-approval gate as Listings.
// -----------------------------------------------------------------------
router.post(
  "/",
  authenticate,
  requireRole("service_provider"),
  requireVerifiedRole("service_provider"),
  [
    body("category")
      .customSanitizer(normalizeCategory)
      .isLength({ min: 2, max: 40 })
      .withMessage("Enter the service you offer, 2 to 40 characters.")
      .matches(CATEGORY_PATTERN)
      .withMessage("Use letters, numbers and spaces only.")
      .matches(/\p{L}/u)
      .withMessage("Include at least one letter."),
    body("description").isString().isLength({ min: 10, max: 3000 }).withMessage("The description must be 10 to 3000 characters."),
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

    // Committed: owner's other tabs update; admins' review queue refreshes.
    publishServiceChange(service, ACTOR.SELF);
    publishAdminQueueChange("listing");

    res.status(201).json(service);
  },
);

// The category filter is a LITERAL, case-insensitive comparison. It must not be
// a pattern: Prisma's `mode: "insensitive"` is implemented with ILIKE, where
// `%` and `_` are wildcards, so `?category=%` used to match everything. Instead
// the stored spellings that equal the input ignoring case and surrounding
// spaces are looked up first, and the query then filters with an exact `in`.
async function storedSpellingsOf(category) {
  const wanted = String(category).trim().toLowerCase();
  if (!wanted) return [];
  const rows = await prisma.serviceListing.findMany({ distinct: ["category"], select: { category: true } });
  return rows.map((r) => r.category).filter((c) => c.trim().toLowerCase() === wanted);
}

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
      // Case-insensitive but literal, so ?category=plumber finds "Plumber" and
      // ?category=% finds nothing (see storedSpellingsOf above).
      ...(category && { category: { in: await storedSpellingsOf(category) } }),
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
// GET /services/categories — the distinct categories that have at least one
// LIVE service listing, alphabetical. Public. This is what the homepage's
// "Service type" dropdown offers, so a category appears there as soon as a
// listing in it goes live, and disappears when none is left; nothing is
// hard-coded. Two spellings that differ only by case or surrounding space
// ("Tutor" / "tutor ") are one category (the first spelling seen is kept).
// IMPORTANT: declared before GET /:id, or Express matches "categories" as an id.
// -----------------------------------------------------------------------
router.get("/categories", async (req, res) => {
  const rows = await prisma.serviceListing.findMany({
    where: { status: "live" },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  const seen = new Map();
  for (const { category } of rows) {
    const name = category.trim();
    if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
  }
  res.json({ categories: [...seen.values()] });
});

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
    body("category")
      .optional()
      .customSanitizer(normalizeCategory)
      .isLength({ min: 2, max: 40 })
      .withMessage("Enter the service you offer, 2 to 40 characters.")
      .matches(CATEGORY_PATTERN)
      .withMessage("Use letters, numbers and spaces only.")
      .matches(/\p{L}/u)
      .withMessage("Include at least one letter."),
    body("description").optional().isString().isLength({ min: 10, max: 3000 }).withMessage("The description must be 10 to 3000 characters."),
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

    // RE-REVIEW. Everything on a service listing is content the public sees and
    // an admin approved (the category even becomes an option in the homepage
    // dropdown). Changing any of it on a LIVE listing sends it back to review
    // and drops the Verified badge until approved again, like a new listing.
    // Only an actual change counts: saving the form unchanged leaves it live.
    const sameSet = (a, b) => JSON.stringify([...(a ?? [])].sort()) === JSON.stringify([...(b ?? [])].sort());
    const contentChanged =
      (category !== undefined && String(category).trim() !== existing.category.trim()) ||
      (description !== undefined && String(description).trim() !== existing.description.trim()) ||
      (state !== undefined && state !== existing.state) ||
      (lgas !== undefined && !sameSet(lgas, existing.lgas)) ||
      (photoUrl !== undefined && (photoUrl || null) !== (existing.photoUrl || null));
    const sendBackToReview = contentChanged && existing.status === "live";

    const updated = await prisma.serviceListing.update({
      where: { id: req.params.id },
      data: { category, description, state, lgas, photoUrl, ...(sendBackToReview && { status: "pending_review", verified: false }) },
    });

    publishServiceChange(updated, ACTOR.SELF);
    if (sendBackToReview) publishAdminQueueChange("listing"); // back in the review queue

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
    emitToUser(req.user.sub, EVENTS.SERVICE_UPDATED, { id: req.params.id, removed: true, actor: ACTOR.SELF });
    res.status(204).send();
  },
);

module.exports = router;