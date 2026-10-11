const { getIO } = require("./socket");
const prisma = require("./prisma");

// Live updates: when something changes that a logged-in user can see, push it
// to that user's open tabs over the existing Socket.IO connection (lib/socket.js).
//
// RULES — read before adding an event:
//   1. Emit only AFTER the database change has committed, never before. A
//      client must never be told about a change that then rolls back.
//   2. Address a user, never everyone. Every authenticated socket joins exactly
//      one private room, `user:<its own id>`, taken from its verified token
//      (socket.js) — clients cannot join someone else's room — so emitting to a
//      user's room is what keeps one account's events out of another's.
//   3. Payloads are small and safe: ids, states and flags the user's own UI
//      already shows. Never a document key, a secret, or another user's data.
//      The client patches its state from the payload (or refetches through the
//      normal authorised REST route when the server must decide what's visible).
//   4. A socket problem must never fail the request that caused the event.

const EVENTS = {
  ROLE_UPDATED: "role:updated", // a role's verification/subscription state changed
  ACCOUNT_UPDATED: "account:updated", // name/phone/verification flags changed
  LISTING_UPDATED: "listing:updated", // a property listing the user owns changed
  LISTING_REMOVED: "listing:removed", // a property listing the user owns was deleted
  SAVED_LISTING_UPDATED: "saved-listing:updated", // a listing the user saved changed visibility
  SERVICE_UPDATED: "service:updated",
  AD_UPDATED: "ad:updated",
  ADMIN_QUEUE_CHANGED: "admin:queue-changed", // something landed in (or left) the admin review queue
};

// Who caused the change. Lets the client raise a notification only for changes
// someone ELSE made ("admin"), not echo the user's own action back at them.
const ACTOR = { ADMIN: "admin", SELF: "self" };

function emitToUser(userId, event, payload) {
  if (!userId) return;
  try {
    getIO().to(`user:${userId}`).emit(event, payload);
  } catch (err) {
    // Socket.IO not initialised (scripts, tests) is normal and silent; anything
    // else is logged, but never allowed to break the request.
    if (!/not been initialized/.test(err.message)) console.error(`[realtime] emit ${event} failed:`, err.message);
  }
}

function emitToAdmins(event, payload) {
  try {
    getIO().to("admins").emit(event, payload);
  } catch (err) {
    if (!/not been initialized/.test(err.message)) console.error(`[realtime] emit ${event} failed:`, err.message);
  }
}

// --- payload builders: only fields the user's own screens already show --------

const rolePayload = (userRole, actor) => ({
  role: userRole.role,
  state: userRole.state,
  subscriptionState: userRole.subscriptionState ?? null,
  hasDocument: Boolean(userRole.documentUrl), // never the document key itself
  actor,
});

const listingPayload = (l, actor) => ({
  id: l.id,
  title: l.title,
  type: l.type,
  status: l.status,
  availability: l.availability,
  isPublished: l.isPublished,
  verified: l.verified,
  actor,
});

// --- high-level helpers used by the routes -----------------------------------

function publishRoleChange(userId, userRole, actor) {
  emitToUser(userId, EVENTS.ROLE_UPDATED, rolePayload(userRole, actor));
}

function publishAccountChange(userId, patch, actor = ACTOR.SELF) {
  emitToUser(userId, EVENTS.ACCOUNT_UPDATED, { ...patch, actor });
}

// A property listing changed: tell its owner, and everyone who saved it (their
// Saved list hides unpublished listings, so a change can alter what they see —
// they get just the id and refetch, so the server decides what they may see).
async function publishListingChange(listing, actor) {
  emitToUser(listing.landlordId, EVENTS.LISTING_UPDATED, listingPayload(listing, actor));
  await notifySavers(listing.id, actor);
}

// Deleting a listing cascades to its saved-list rows, so who saved it must be
// read BEFORE the delete and handed to publishListingRemoved afterwards.
async function getSaverIds(listingId) {
  try {
    const rows = await prisma.savedListing.findMany({ where: { listingId }, select: { userId: true } });
    return rows.map((r) => r.userId);
  } catch (err) {
    console.error("[realtime] reading savers failed:", err.message);
    return [];
  }
}

async function publishListingRemoved(listing, actor, saverIds = []) {
  emitToUser(listing.landlordId, EVENTS.LISTING_REMOVED, { id: listing.id, actor });
  for (const userId of saverIds) emitToUser(userId, EVENTS.SAVED_LISTING_UPDATED, { id: listing.id, actor });
}

async function notifySavers(listingId, actor) {
  for (const userId of await getSaverIds(listingId)) {
    emitToUser(userId, EVENTS.SAVED_LISTING_UPDATED, { id: listingId, actor });
  }
}

const publishServiceChange = (service, actor) =>
  emitToUser(service.providerId, EVENTS.SERVICE_UPDATED, {
    id: service.id,
    category: service.category,
    status: service.status,
    verified: service.verified,
    actor,
  });

const publishAdChange = (ad, actor) =>
  emitToUser(ad.advertiserId, EVENTS.AD_UPDATED, {
    id: ad.id,
    headline: ad.headline,
    status: ad.status,
    placement: ad.placement ?? null,
    actor,
  });

// Something was submitted that an admin must now look at (or just resolved).
// Admins' open review pages refetch their own queue.
const publishAdminQueueChange = (kind) => emitToAdmins(EVENTS.ADMIN_QUEUE_CHANGED, { kind });

module.exports = {
  EVENTS,
  ACTOR,
  emitToUser,
  publishRoleChange,
  publishAccountChange,
  publishListingChange,
  getSaverIds,
  publishListingRemoved,
  publishServiceChange,
  publishAdChange,
  publishAdminQueueChange,
};
