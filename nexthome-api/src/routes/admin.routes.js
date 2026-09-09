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

// -----------------------------------------------------------------------
// GET /admin/users — every non-admin account and the roles it holds.
// -----------------------------------------------------------------------
router.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    where: { isAdmin: false },
    select: {
      id: true,
      name: true,
      roles: { select: { role: true, state: true } },
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
    });
    res.json(updated);
  } catch {
    res.status(404).json({ message: "That user doesn't hold this role." });
  }
}

// -----------------------------------------------------------------------
// GET /admin/listings — every property AND service listing, any status.
// Shaped as one combined list ({ id, kind, title, status }) since the
// admin UI's toggle switches between them client-side, not via separate
// requests.
// -----------------------------------------------------------------------
router.get("/listings", async (req, res) => {
  const [properties, services] = await Promise.all([
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
  ]);

  const rows = [
    ...properties.map((p) => ({ id: p.id, kind: "property", title: p.title, status: p.status })),
    ...services.map((s) => ({
      id: s.id,
      kind: "service",
      title: `${s.category} — ${s.provider.name}`,
      status: s.status,
    })),
  ];

  res.json(rows);
});

// -----------------------------------------------------------------------
// PATCH /admin/listings/:kind/:id/:action — kind: property|service,
// action: approve|reject.
// -----------------------------------------------------------------------
router.patch(
  "/listings/:kind/:id/:action",
  [
    param("kind").isIn(["property", "service"]),
    param("id").isString(),
    param("action").isIn(["approve", "reject"]),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { kind, id, action } = req.params;
    const status = action === "approve" ? "live" : "rejected";
    const model = kind === "property" ? prisma.listing : prisma.serviceListing;

    try {
      const updated = await model.update({ where: { id }, data: { status } });
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
    res.json(updated);
  } catch {
    res.status(404).json({ message: "Complaint not found." });
  }
});

module.exports = router;
