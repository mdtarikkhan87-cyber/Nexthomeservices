const express = require("express");
const jwt = require("jsonwebtoken");
const { body, query, param, validationResult } = require("express-validator");

const prisma = require("../lib/prisma");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

// Unlike `authenticate`, this NEVER rejects the request — it just attaches
// req.user if a valid token happens to be present, and silently continues
// otherwise. GET /:id is public, but the owning landlord (or an admin)
// checking a pending/rejected listing should still see it, and — see
// redactForAnonymous below — a signed-in visitor unlocks full detail while
// a truly anonymous one gets only the public teaser fields.
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

// Website Revision Spec §3B: anonymous visitors can browse listing cards but
// "cannot open a full property detail page" — description, the rest of the
// gallery, amenities, bathrooms, furnishing and shared-room facility detail
// all stay behind registration. This used to be enforced only by the
// frontend choosing not to render those fields (ListingDetailGate.tsx) while
// this endpoint always returned everything to every caller regardless of
// auth — meaning a direct request to this URL (curl, devtools, anything
// that isn't the React app) bypassed the wall entirely. galleryUrls keeps
// its true LENGTH (blanking every entry past the first) so the "N more
// photos" count the wall shows stays accurate without leaking the URLs.
function redactForAnonymous(listing) {
  return {
    ...listing,
    description: "",
    amenities: [],
    bathrooms: null,
    furnishing: null,
    shared: null,
    galleryUrls: listing.galleryUrls.map((url, i) => (i === 0 ? url : "")),
  };
}

const LISTING_TYPES = ["rent", "sale"];
const RENT_DURATIONS = ["short_term", "long_term"];
const OCCUPANCY_TYPES = ["entire", "shared"];
const BATHROOM_TYPES = ["private_bath", "shared_bath"];
const PROPERTY_TYPES = ["apartment", "duplex", "bungalow", "terrace", "studio", "detached"];
const FURNISHING_STATUSES = ["furnished", "semi_furnished", "unfurnished"];
const AMENITIES = [
  "borehole",
  "power_backup",
  "gated_security",
  "parking",
  "air_conditioning",
  "fitted_kitchen",
  "swimming_pool",
  "balcony",
];

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

// -----------------------------------------------------------------------
// POST /listings — create a new listing. Landlord only.
// Starts as status "pending_review" — only becomes visible to the public
// once an admin approves it (Phase 6). Landlords can still see their own
// pending listings via GET /listings/mine.
// -----------------------------------------------------------------------
router.post(
  "/",
  authenticate,
  requireRole("landlord"),
  [
    body("type").isIn(LISTING_TYPES),
    body("title").isString().isLength({ min: 3 }),
    body("description").isString().isLength({ min: 10 }),
    body("price").isInt({ min: 0 }),
    body("currency").optional().isString(),
    body("state").isString().notEmpty(),
    body("lga").optional().isString(),
    body("bedrooms").isInt({ min: 0 }),
    body("bathrooms").optional().isInt({ min: 0 }),
    body("rentDuration").optional().isIn(RENT_DURATIONS),
    body("propertyType").optional().isIn(PROPERTY_TYPES),
    body("furnishing").optional().isIn(FURNISHING_STATUSES),
    body("amenities").optional().isArray(),
    body("amenities.*").optional().isIn(AMENITIES),
    body("photoUrl").isString().notEmpty(),
    body("galleryUrls").optional().isArray(),
    body("occupancyType").optional().isIn(OCCUPANCY_TYPES),
    // Only required/validated when occupancyType === "shared"
    body("shared").optional().isObject(),
    body("shared.totalRooms").if(body("shared").exists()).isInt({ min: 1 }),
    body("shared.bathroomType").if(body("shared").exists()).isIn(BATHROOM_TYPES),
    body("shared.kitchenShared").if(body("shared").exists()).isBoolean(),
    body("shared.maxOccupantsPerRoom").if(body("shared").exists()).isInt({ min: 1 }),
    body("shared.rentPerRoom").if(body("shared").exists()).isInt({ min: 0 }),
    body("shared.rooms").if(body("shared").exists()).isArray({ min: 1 }),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const {
      type, title, description, price, currency, state, lga, bedrooms,
      bathrooms, rentDuration, propertyType, furnishing, amenities,
      photoUrl, galleryUrls, occupancyType, shared,
    } = req.body;

    const data = {
      landlordId: req.user.sub,
      type, title, description, price,
      currency: currency || "NGN",
      state, lga, bedrooms, bathrooms, rentDuration, propertyType,
      furnishing,
      amenities: amenities || [],
      photoUrl,
      galleryUrls: galleryUrls || [],
      occupancyType,
    };

    // If it's a shared-room listing, create the nested SharedDetails +
    // SharedRoom rows in the same transaction Prisma builds for a nested
    // write, so we never end up with a Listing that has no room data.
    if (occupancyType === "shared" && shared) {
      data.shared = {
        create: {
          totalRooms: shared.totalRooms,
          bathroomType: shared.bathroomType,
          kitchenShared: shared.kitchenShared,
          maxOccupantsPerRoom: shared.maxOccupantsPerRoom,
          rentPerRoom: shared.rentPerRoom,
          rooms: {
            create: shared.rooms.map((label) => ({ label })),
          },
        },
      };
    }

    const listing = await prisma.listing.create({
      data,
      include: { shared: { include: { rooms: true } } },
    });

    res.status(201).json(listing);
  },
);

// -----------------------------------------------------------------------
// GET /listings — public search/browse. Only ever returns "live" listings.
// Query params: state, type, minPrice, maxPrice, bedrooms, rentDuration,
// page (default 1), limit (default 20, max 50)
// -----------------------------------------------------------------------
router.get(
  "/",
  [
    query("state").optional().isString(),
    query("type").optional().isIn(LISTING_TYPES),
    query("minPrice").optional().isInt({ min: 0 }),
    query("maxPrice").optional().isInt({ min: 0 }),
    query("bedrooms").optional().isInt({ min: 0 }),
    query("rentDuration").optional().isIn(RENT_DURATIONS),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { state, type, minPrice, maxPrice, bedrooms, rentDuration } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const where = {
      status: "live",
      ...(state && { state }),
      ...(type && { type }),
      ...(bedrooms && { bedrooms: parseInt(bedrooms) }),
      ...(rentDuration && { rentDuration }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: parseInt(minPrice) }),
          ...(maxPrice && { lte: parseInt(maxPrice) }),
        },
      }),
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      listings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);

// -----------------------------------------------------------------------
// GET /listings/mine — the authenticated landlord's own listings,
// regardless of status (pending_review, live, or rejected).
// IMPORTANT: this route must be declared BEFORE GET /listings/:id, or
// Express will try to match "mine" as an :id value instead.
// -----------------------------------------------------------------------
router.get("/mine", authenticate, requireRole("landlord"), async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { landlordId: req.user.sub },
    include: { shared: { include: { rooms: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(listings);
});

// -----------------------------------------------------------------------
// GET /listings/:id?count=false — full listing detail. Increments viewCount
// by default. Pass ?count=false to read without counting a view — used by
// ListingFullDetail.tsx's client-side fetch, since the server-rendered
// teaser page (app/(public)/listing/[id]/page.tsx) already counted this
// same visit once; without this, a signed-in visitor's page view would be
// double-counted (teaser fetch + full-detail fetch) while an anonymous
// visitor's (teaser only) counted once.
// -----------------------------------------------------------------------
router.get(
  "/:id",
  optionalAuthenticate,
  [param("id").isString(), query("count").optional().isBoolean()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const shouldCount = req.query.count !== "false";

    const listing = shouldCount
      ? await prisma.listing
          .update({
            where: { id: req.params.id },
            data: { viewCount: { increment: 1 } },
            include: { shared: { include: { rooms: true } } },
          })
          .catch(() => null)
      : await prisma.listing
          .findUnique({
            where: { id: req.params.id },
            include: { shared: { include: { rooms: true } } },
          })
          .catch(() => null);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    const isOwner = req.user && listing.landlordId === req.user.sub;
    const isAdmin = req.user && req.user.isAdmin;
    if (listing.status !== "live" && !isOwner && !isAdmin) {
      return res.status(404).json({ message: "Listing not found." });
    }

    if (listing.status === "live" && !req.user) {
      return res.json(redactForAnonymous(listing));
    }
    res.json(listing);
  },
);

// -----------------------------------------------------------------------
// PATCH /listings/:id — update a listing. Only the owning landlord can.
// -----------------------------------------------------------------------
router.patch(
  "/:id",
  authenticate,
  requireRole("landlord"),
  [
    param("id").isString(),
    body("title").optional().isString().isLength({ min: 3 }),
    body("description").optional().isString().isLength({ min: 10 }),
    body("price").optional().isInt({ min: 0 }),
    body("bedrooms").optional().isInt({ min: 0 }),
    body("bathrooms").optional().isInt({ min: 0 }),
    body("photoUrl").optional().isString().notEmpty(),
    body("galleryUrls").optional().isArray(),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "Listing not found." });
    }
    if (existing.landlordId !== req.user.sub) {
      return res.status(403).json({ message: "You don't own this listing." });
    }

    // Only allow updating a fixed set of fields — never let the request
    // body silently overwrite landlordId, status, or viewCount.
    const { title, description, price, bedrooms, bathrooms, photoUrl, galleryUrls } = req.body;
    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: { title, description, price, bedrooms, bathrooms, photoUrl, galleryUrls },
    });

    res.json(updated);
  },
);

// -----------------------------------------------------------------------
// DELETE /listings/:id — only the owning landlord can delete.
// -----------------------------------------------------------------------
router.delete(
  "/:id",
  authenticate,
  requireRole("landlord"),
  [param("id").isString()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "Listing not found." });
    }
    if (existing.landlordId !== req.user.sub) {
      return res.status(403).json({ message: "You don't own this listing." });
    }

    await prisma.listing.delete({ where: { id: req.params.id } });
    res.status(204).send();
  },
);

// -----------------------------------------------------------------------
// PATCH /listings/:id/rooms/:roomId — mark a shared-listing room occupied
// or available. Landlord-only, and only the listing's own landlord.
//
// "occupied" is an atomic conditional update (WHERE status = 'available'),
// not a read-then-write — mirrors exactly what
// src/lib/listings-context.tsx on the frontend already documents as the
// eventual real-database behavior for this action.
// -----------------------------------------------------------------------
router.patch(
  "/:id/rooms/:roomId",
  authenticate,
  requireRole("landlord"),
  [
    param("id").isString(),
    param("roomId").isString(),
    body("status").isIn(["available", "occupied"]),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: { shared: true },
    });
    if (!listing) return res.status(404).json({ message: "Listing not found." });
    if (listing.landlordId !== req.user.sub) {
      return res.status(403).json({ message: "You don't own this listing." });
    }
    if (!listing.shared) {
      return res.status(400).json({ message: "This listing has no shared rooms." });
    }

    const room = await prisma.sharedRoom.findUnique({ where: { id: req.params.roomId } });
    if (!room || room.sharedDetailsId !== listing.shared.id) {
      return res.status(404).json({ message: "Room not found on this listing." });
    }

    const { status } = req.body;

    if (status === "occupied") {
      // Conditional update: only succeeds if the room is still "available"
      // at the moment of the write, closing the same race a naive
      // read-then-write would leave open.
      const result = await prisma.sharedRoom.updateMany({
        where: { id: room.id, status: "available" },
        data: { status: "occupied" },
      });
      if (result.count === 0) {
        return res.status(409).json({ message: "Room was already occupied." });
      }
    } else {
      await prisma.sharedRoom.update({ where: { id: room.id }, data: { status: "available" } });
    }

    const updatedRoom = await prisma.sharedRoom.findUnique({ where: { id: room.id } });
    res.json(updatedRoom);
  },
);

module.exports = router;