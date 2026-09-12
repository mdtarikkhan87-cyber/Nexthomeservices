const express = require("express");
const { param, validationResult } = require("express-validator");

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
// GET /saved — the authenticated user's saved listings, newest first.
// Real persistence for what dashboard/saved/page.tsx previously stood in
// with hardcoded demo data ("there is no persistence layer yet"). Not
// role-restricted: saving is a save-toggle on a property card, meaningful
// wherever a signed-in visitor is browsing, not only under an active
// tenant-buyer role.
// -----------------------------------------------------------------------
router.get("/", authenticate, async (req, res) => {
  const saved = await prisma.savedListing.findMany({
    where: { userId: req.user.sub },
    include: { listing: { include: { shared: { include: { rooms: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(saved.map((s) => s.listing));
});

// -----------------------------------------------------------------------
// PUT /saved/:listingId — save a listing. Idempotent (upsert): a save
// button doesn't distinguish "already saved" from "just saved" — both
// read the same to the user (heart filled in), so saving twice is a
// success, not an error.
// -----------------------------------------------------------------------
router.put("/:listingId", authenticate, [param("listingId").isString()], async (req, res) => {
  if (!checkValidation(req, res)) return;

  const listing = await prisma.listing.findUnique({ where: { id: req.params.listingId } });
  if (!listing) return res.status(404).json({ message: "Listing not found." });

  await prisma.savedListing.upsert({
    where: { userId_listingId: { userId: req.user.sub, listingId: req.params.listingId } },
    create: { userId: req.user.sub, listingId: req.params.listingId },
    update: {},
  });
  res.status(204).send();
});

// -----------------------------------------------------------------------
// DELETE /saved/:listingId — unsave. Idempotent for the same reason as
// PUT above — unsaving something already unsaved is still a success.
// -----------------------------------------------------------------------
router.delete("/:listingId", authenticate, [param("listingId").isString()], async (req, res) => {
  if (!checkValidation(req, res)) return;

  await prisma.savedListing.deleteMany({
    where: { userId: req.user.sub, listingId: req.params.listingId },
  });
  res.status(204).send();
});

module.exports = router;
