const express = require("express");
const { param, validationResult } = require("express-validator");

const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");

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
// -----------------------------------------------------------------------
router.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    where: { isAdmin: false },
    select: {
      id: true,
      name: true,
      roles: { select: { role: true, state: true, subscriptionState: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
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
    await setUserRoleState(req, res, "role_verified");
  },
);

router.patch(
  "/users/:userId/roles/:role/reject",
  [param("userId").isString(), param("role").isIn(VALID_ROLES)],
  async (req, res) => {
    if (!checkValidation(req, res)) return;
    await setUserRoleState(req, res, "role_added");
  },
);

async function setUserRoleState(req, res, state) {
  const { userId, role } = req.params;
  try {
    const updated = await prisma.userRole.update({
      where: { userId_role: { userId, role } },
      data: { state },
      include: { user: { select: { name: true } } },
    });
    await logAudit(
      req,
      state === "role_verified" ? "Verified user role" : "Rejected user role",
      `${updated.user.name} — ${ROLE_LABELS[role]}`,
    );
    res.json(updated);
  } catch {
    res.status(404).json({ message: "That user doesn't hold this role." });
  }
}

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

    try {
      const updated = await model.update({ where: { id }, data: { status } });
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
