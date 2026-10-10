const express = require("express");
const { param, validationResult } = require("express-validator");

const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const { isConfigured, kindFromKey, fileNameFromKey, objectExists, getSignedReadUrl } = require("../lib/s3");

const router = express.Router();

// Every route below requires a real, authenticated admin account —
// isAdmin is a hardcoded, non-self-serve flag (see schema.prisma User.isAdmin
// and its own comment), never combined with the RoleName system.
router.use(authenticate, requireAdmin);

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

const VALID_ROLES = ["landlord", "tenant_buyer", "service_provider", "advertiser"];
const ROLE_LABELS = {
  landlord: "Landlord",
  tenant_buyer: "Renter / Buyer",
  service_provider: "Service Provider",
  advertiser: "Advertiser",
};

// Real, persisted audit trail — this used to be client-side React state only
// (admin-client.tsx's AdminAuditLogProvider), which reset to empty on every
// page reload and was never shared between admin sessions. Its own comment
// said an entry couldn't name WHO acted ("no real actor") only because there
// was nowhere durable to attribute it to; now that this is a real table,
// every entry properly records the acting admin.
async function logAudit(req, action, itemTitle) {
  await prisma.auditLogEntry.create({
    data: { actorId: req.user.sub, action, itemTitle },
  });
}

// -----------------------------------------------------------------------
// GET /admin/activity — the audit log, newest first.
// -----------------------------------------------------------------------
router.get("/activity", async (req, res) => {
  const entries = await prisma.auditLogEntry.findMany({
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(
    entries.map((e) => ({
      id: e.id,
      action: e.action,
      itemTitle: e.itemTitle,
      actorName: e.actor.name,
      timestamp: e.createdAt,
    })),
  );
});

// -----------------------------------------------------------------------
// GET /admin/users — every non-admin account and the roles it holds.
//
// `hasDocument` is derived from documentUrl here and the raw value is
// dropped before the response goes out — the admin UI needs to know
// whether a role has *something* on file (to decide whether "Review
// document" shows at all for a role-added/role-verified row), but the raw
// S3 key itself should never reach the client, same principle as the
// signed-URL document route below.
// -----------------------------------------------------------------------
router.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    where: { isAdmin: false },
    select: {
      id: true,
      name: true,
      roles: { select: { role: true, state: true, subscriptionState: true, documentUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(
    users.map((u) => ({
      ...u,
      roles: u.roles.map(({ documentUrl, ...role }) => ({ ...role, hasDocument: Boolean(documentUrl) })),
    })),
  );
});

// -----------------------------------------------------------------------
// PATCH /admin/users/:userId/roles/:role/verify — clears document review.
// PATCH /admin/users/:userId/roles/:role/reject — sends it back to
// role_added (RoleState has no terminal "rejected" — see UserRole.state).
// -----------------------------------------------------------------------
router.patch(
  "/users/:userId/roles/:role/verify",
  [param("userId").isString(), param("role").isIn(VALID_ROLES)],
  async (req, res) => {
    if (!checkValidation(req, res)) return;
    await reviewUserRole(req, res, "verify");
  },
);

router.patch(
  "/users/:userId/roles/:role/reject",
  [param("userId").isString(), param("role").isIn(VALID_ROLES)],
  async (req, res) => {
    if (!checkValidation(req, res)) return;
    await reviewUserRole(req, res, "reject");
  },
);

const PENDING_REVIEW = "pending_admin_document_review";

// Both decisions are only valid for a role that is actually awaiting document
// review, and verifying additionally requires a document on file — an admin
// can't approve what was never submitted. The transition is a conditional
// update (the checks are in the WHERE clause), so two admins acting at once,
// or a request racing the user's own resubmission, can't both succeed.
async function reviewUserRole(req, res, action) {
  const { userId, role } = req.params;
  const verifying = action === "verify";
  try {
    const existing = await prisma.userRole.findUnique({
      where: { userId_role: { userId, role } },
      include: { user: { select: { name: true } } },
    });
    if (!existing) {
      return res.status(404).json({ message: "That user doesn't hold this role." });
    }

    const claimed = await prisma.userRole.updateMany({
      where: {
        userId,
        role,
        state: PENDING_REVIEW,
        ...(verifying ? { documentUrl: { not: null } } : {}),
      },
      data: verifying
        ? { state: "role_verified" }
        : // Rejecting sends the role back to "role_added" AND clears the stored
          // document: it must not linger looking like a submission awaiting
          // review, and the user has to upload a fresh one. (The S3 object is
          // left in place — the app's IAM user can't delete — and its key is
          // recorded in the audit entry below.)
          { state: "role_added", documentUrl: null, documentSubmittedAt: null },
    });

    if (claimed.count === 0) {
      if (existing.state !== PENDING_REVIEW) {
        return res.status(409).json({
          message:
            existing.state === "role_verified"
              ? "This role is already verified."
              : "This role isn't awaiting document review — the user hasn't submitted a document yet.",
        });
      }
      return res.status(409).json({ message: "No document is on file for this role, so it can't be verified." });
    }

    const updated = await prisma.userRole.findUnique({ where: { userId_role: { userId, role } } });
    const subject = `${existing.user.name} — ${ROLE_LABELS[role]}`;
    await logAudit(
      req,
      verifying ? "Verified user role" : "Rejected user role",
      verifying || !existing.documentUrl ? subject : `${subject} (cleared document: ${existing.documentUrl})`,
    );
    res.json(updated);
  } catch (err) {
    console.error(`[admin] Failed to ${action} role ${role} for user ${userId}:`, err);
    res.status(500).json({ message: "Couldn't update that role." });
  }
}

// -----------------------------------------------------------------------
// GET /admin/users/:userId/roles/:role/document — a short-lived signed
// view of the trust document submitted for that role (never the raw key,
// which the client must never be able to hand back to us — see lib/s3.js).
// Looked up by the same (userId, role) pair /verify and /reject use, so no
// new id needs to flow to the frontend. Cache-Control: no-store since the
// signed URL expires in 5 minutes — nothing here should be cached.
// -----------------------------------------------------------------------
router.get(
  "/users/:userId/roles/:role/document",
  [param("userId").isString(), param("role").isIn(VALID_ROLES)],
  async (req, res) => {
    if (!checkValidation(req, res)) return;
    res.set("Cache-Control", "no-store");

    const { userId, role } = req.params;

    // Explicit try/catch (not relying on Express 5's automatic
    // promise-rejection forwarding alone) so a Prisma or S3/AWS SDK failure
    // here always returns a clean 500 JSON message, same as the rest of
    // this router's existing routes below.
    try {
      const userRole = await prisma.userRole.findUnique({
        where: { userId_role: { userId, role } },
        select: { documentUrl: true, documentSubmittedAt: true, user: { select: { name: true } } },
      });

      if (!userRole) {
        return res.status(404).json({ message: "That user doesn't hold this role." });
      }
      if (!userRole.documentUrl) {
        return res.json({ available: false, reason: "no-document", submittedAt: userRole.documentSubmittedAt });
      }

      const kind = kindFromKey(userRole.documentUrl);
      const fileName = fileNameFromKey(userRole.documentUrl);
      const submittedAt = userRole.documentSubmittedAt;

      // Not configured at all (local dev without AWS credentials) — the key
      // was never a real S3 upload to begin with.
      if (!isConfigured()) {
        return res.json({ available: false, reason: "placeholder", kind, fileName, submittedAt });
      }

      // Configured now, but this key may predate that — e.g. a document
      // submitted while S3 wasn't set up yet. Nothing in the DB records
      // which case this is, so we check the bucket directly rather than
      // trusting the stored value.
      const exists = await objectExists(userRole.documentUrl);
      if (!exists) {
        return res.json({ available: false, reason: "not-found", kind, fileName, submittedAt });
      }

      // An ID document is sensitive, so every time one is actually opened is
      // recorded against the admin who did it. Logged BEFORE the link is
      // handed out, and a failure to log aborts the request (the catch below
      // returns a 500): no access without a trail.
      await logAudit(req, "Viewed user document", `${userRole.user.name} — ${ROLE_LABELS[role]}`);

      const url = await getSignedReadUrl({
        key: userRole.documentUrl,
        disposition: kind === "other" ? "attachment" : "inline",
        fileName,
      });

      res.json({ available: true, url, fileName, kind, submittedAt });
    } catch (err) {
      console.error(`[admin] Failed to load document for user ${userId}, role ${role}:`, err);
      res.status(500).json({ message: "Couldn't load that document." });
    }
  },
);

// -----------------------------------------------------------------------
// PATCH /admin/users/:userId/roles/:role/activate-subscription
// PATCH /admin/users/:userId/roles/:role/deactivate-subscription
//
// Stand-in for real payment processing (Stripe/Paystack), which isn't
// wired up yet — see SubscriptionPage on the frontend, which currently
// can't move a landlord's subscriptionState off "inactive" on its own.
// subscriptionState only exists on the landlord role (schema.prisma), so
// this is scoped to that role rather than accepting any of VALID_ROLES.
// -----------------------------------------------------------------------
router.patch(
  "/users/:userId/roles/:role/activate-subscription",
  [param("userId").isString(), param("role").equals("landlord")],
  async (req, res) => {
    if (!checkValidation(req, res)) return;
    await setUserSubscriptionState(req, res, "active");
  },
);

router.patch(
  "/users/:userId/roles/:role/deactivate-subscription",
  [param("userId").isString(), param("role").equals("landlord")],
  async (req, res) => {
    if (!checkValidation(req, res)) return;
    await setUserSubscriptionState(req, res, "inactive");
  },
);

async function setUserSubscriptionState(req, res, subscriptionState) {
  const { userId, role } = req.params;
  try {
    const updated = await prisma.userRole.update({
      where: { userId_role: { userId, role } },
      data: { subscriptionState },
      include: { user: { select: { name: true } } },
    });
    await logAudit(
      req,
      subscriptionState === "active" ? "Activated subscription" : "Deactivated subscription",
      `${updated.user.name} — ${ROLE_LABELS[role]}`,
    );
    res.json(updated);
  } catch {
    res.status(404).json({ message: "That user doesn't hold this role." });
  }
}

// -----------------------------------------------------------------------
// GET /admin/listings — every property, service listing, AND
// advertisement, any status. Shaped as one combined list
// ({ id, kind, title, status }) since the admin UI's toggle switches
// between them client-side, not via separate requests. Ads previously had
// no admin surface at all — schema.prisma's own comment says every content
// item shares "one shape [for] admin moderation... per DESIGN_SYSTEM.md
// §7," but nothing ever implemented that shape for Advertisement, so every
// ad submitted stayed in pending_review forever with no way to ever go
// live.
// -----------------------------------------------------------------------
router.get("/listings", async (req, res) => {
  const [properties, services, ads] = await Promise.all([
    prisma.listing.findMany({
      select: { id: true, title: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.serviceListing.findMany({
      select: {
        id: true,
        category: true,
        status: true,
        provider: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.advertisement.findMany({
      select: {
        id: true,
        headline: true,
        status: true,
        advertiser: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const rows = [
    ...properties.map((p) => ({ id: p.id, kind: "property", title: p.title, status: p.status })),
    ...services.map((s) => ({
      id: s.id,
      kind: "service",
      title: `${s.category} — ${s.provider.name}`,
      status: s.status,
    })),
    ...ads.map((a) => ({
      id: a.id,
      kind: "advertisement",
      title: `${a.headline} — ${a.advertiser.name}`,
      status: a.status,
    })),
  ];

  res.json(rows);
});

// -----------------------------------------------------------------------
// GET /admin/listings/advertisement/:id/review — full ad detail for the
// review dialog (the combined /admin/listings list above deliberately
// stays lean — see its own comment — so this is fetched only when an
// admin opens the dialog, not preloaded per row).
//
// imageUrl is passed through UNSIGNED: ad images are public by design
// (lib/s3.js's PUBLIC_PURPOSES — a bucket policy grants public read on the
// ads/ prefix), so there's no key to sign here, only a URL already fully
// resolved at upload time. isPlaceholder flags the one case that URL can't
// actually be trusted — a dev-mode "/dev-fake-file/" URL recorded before
// S3 was configured, which no longer resolves to anything.
// -----------------------------------------------------------------------
router.get(
  "/listings/advertisement/:id/review",
  [param("id").isString()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;
    res.set("Cache-Control", "no-store");

    // Explicit try/catch for the same reason as the document route above —
    // a clean 500 JSON message on a Prisma failure, not an implicit
    // framework behavior.
    try {
      const ad = await prisma.advertisement.findUnique({
        where: { id: req.params.id },
        select: { headline: true, linkUrl: true, imageUrl: true, status: true },
      });
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found." });
      }

      res.json({
        headline: ad.headline,
        linkUrl: ad.linkUrl,
        imageUrl: ad.imageUrl,
        status: ad.status,
        isPlaceholder: ad.imageUrl.includes("/dev-fake-file/"),
      });
    } catch (err) {
      console.error(`[admin] Failed to load ad review for ${req.params.id}:`, err);
      res.status(500).json({ message: "Couldn't load that advertisement." });
    }
  },
);

// -----------------------------------------------------------------------
// GET /admin/listings/:kind/:id/review — kind: property|service. Full
// detail for the review dialog, same "fetched only on open" reasoning as
// the ad route above. Advertisement keeps its own dedicated route (image
// handling is different enough — public URL vs this route's photo array —
// that folding it in here wouldn't actually simplify anything).
//
// photos is built from photoUrl + galleryUrls (property) or just photoUrl
// (service, which has no gallery) — de-duplicated, since photoUrl usually
// repeats galleryUrls[0] (see scripts/migrate-listing-photos.js). All
// public by design (lib/s3.js PUBLIC_PURPOSES), so passed through
// unsigned, same as ad images; isPlaceholder flags a dead dev-mode URL.
//
// ownerVerificationState is the owner's OWN UserRole.state for the role
// that actually submitted this listing (landlord for a property,
// service_provider for a service) — i.e. "is this a verified landlord?",
// not the listing's own `verified` flag (which is also returned
// separately, and is always false before an admin's first approval).
// -----------------------------------------------------------------------
const REVIEWABLE_LISTING_KIND = {
  property: "landlord",
  service: "service_provider",
};

function photosFromUrls(urls) {
  const unique = [...new Set(urls.filter(Boolean))];
  return unique.map((url) => ({ url, isPlaceholder: url.includes("/dev-fake-file/") }));
}

router.get(
  "/listings/:kind/:id/review",
  [param("kind").isIn(Object.keys(REVIEWABLE_LISTING_KIND)), param("id").isString()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;
    res.set("Cache-Control", "no-store");

    const { kind, id } = req.params;
    const ownerRole = REVIEWABLE_LISTING_KIND[kind];

    try {
      if (kind === "property") {
        const listing = await prisma.listing.findUnique({
          where: { id },
          select: {
            title: true,
            description: true,
            status: true,
            verified: true,
            createdAt: true,
            photoUrl: true,
            galleryUrls: true,
            landlord: {
              select: { name: true, roles: { where: { role: ownerRole }, select: { state: true } } },
            },
          },
        });
        if (!listing) {
          return res.status(404).json({ message: "Listing not found." });
        }
        return res.json({
          title: listing.title,
          description: listing.description,
          status: listing.status,
          verified: listing.verified,
          submittedAt: listing.createdAt,
          ownerName: listing.landlord.name,
          ownerVerificationState: listing.landlord.roles[0]?.state ?? null,
          photos: photosFromUrls([listing.photoUrl, ...listing.galleryUrls]),
        });
      }

      const service = await prisma.serviceListing.findUnique({
        where: { id },
        select: {
          category: true,
          description: true,
          status: true,
          verified: true,
          createdAt: true,
          photoUrl: true,
          provider: {
            select: { name: true, roles: { where: { role: ownerRole }, select: { state: true } } },
          },
        },
      });
      if (!service) {
        return res.status(404).json({ message: "Service listing not found." });
      }
      res.json({
        title: service.category,
        description: service.description,
        status: service.status,
        verified: service.verified,
        submittedAt: service.createdAt,
        ownerName: service.provider.name,
        ownerVerificationState: service.provider.roles[0]?.state ?? null,
        photos: photosFromUrls([service.photoUrl]),
      });
    } catch (err) {
      console.error(`[admin] Failed to load ${kind} review for ${id}:`, err);
      res.status(500).json({ message: "Couldn't load that listing." });
    }
  },
);

// -----------------------------------------------------------------------
// PATCH /admin/listings/:kind/:id/:action —
// kind: property|service|advertisement, action: approve|reject.
// -----------------------------------------------------------------------
const LISTING_MODEL_BY_KIND = {
  property: () => prisma.listing,
  service: () => prisma.serviceListing,
  advertisement: () => prisma.advertisement,
};

router.patch(
  "/listings/:kind/:id/:action",
  [
    param("kind").isIn(Object.keys(LISTING_MODEL_BY_KIND)),
    param("id").isString(),
    param("action").isIn(["approve", "reject"]),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { kind, id, action } = req.params;
    const status = action === "approve" ? "live" : "rejected";
    const model = LISTING_MODEL_BY_KIND[kind]();

    const data = { status };
    // GET /ads (ads.routes.js) only ever matches an exact placement, and an
    // advertiser can't set one themselves (PRD §9 — the admin decides where
    // an ad appears). Without this, approving an ad left it "live" with
    // placement still null, which matched no placement-scoped query
    // anywhere — the ad was approved but literally unable to appear on the
    // site. "homepage-banner" is the only placement that exists today
    // (AdBanner on the homepage); this stops being a blanket assignment the
    // moment a second one is added and an admin needs to actually choose.
    if (kind === "advertisement" && action === "approve") {
      data.placement = "homepage-banner";
    }
    // The "Verified" badge on property and service listings means an admin
    // has reviewed and approved them (the homepage promises "every listing
    // is reviewed"). Nothing else ever set this flag, so every approved
    // listing used to show "Not yet verified". Rejecting clears it.
    // Advertisements have no verified field.
    if (kind === "property" || kind === "service") {
      data.verified = action === "approve";
    }

    try {
      const updated = await model.update({ where: { id }, data });
      const itemTitle = kind === "property" ? updated.title : kind === "service" ? updated.category : updated.headline;
      await logAudit(req, action === "approve" ? "Approved listing" : "Rejected listing", itemTitle);
      res.json(updated);
    } catch {
      res.status(404).json({ message: "Listing not found." });
    }
  },
);

// -----------------------------------------------------------------------
// GET /admin/complaints — every complaint ticket, any status.
// -----------------------------------------------------------------------
router.get("/complaints", async (req, res) => {
  const complaints = await prisma.complaintTicket.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(complaints);
});

// -----------------------------------------------------------------------
// PATCH /admin/complaints/:id/resolve
// -----------------------------------------------------------------------
router.patch("/complaints/:id/resolve", [param("id").isString()], async (req, res) => {
  if (!checkValidation(req, res)) return;

  try {
    const updated = await prisma.complaintTicket.update({
      where: { id: req.params.id },
      data: { status: "resolved" },
    });
    await logAudit(req, "Resolved complaint", updated.subject);
    res.json(updated);
  } catch {
    res.status(404).json({ message: "Complaint not found." });
  }
});

module.exports = router;
