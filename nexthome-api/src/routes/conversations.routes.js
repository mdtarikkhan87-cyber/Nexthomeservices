const express = require("express");
const { body, param, validationResult } = require("express-validator");

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

// Loads a conversation and checks the current user is actually a
// participant in it. Returns the conversation, or sends a 404/403 response
// and returns null if the caller should stop processing.
async function loadConversationForParticipant(req, res) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.id },
  });
  if (!conversation) {
    res.status(404).json({ message: "Conversation not found." });
    return null;
  }
  const isParticipant =
    conversation.participantAId === req.user.sub ||
    conversation.participantBId === req.user.sub;
  if (!isParticipant) {
    res.status(403).json({ message: "You're not part of this conversation." });
    return null;
  }
  return conversation;
}

// -----------------------------------------------------------------------
// POST /conversations — start a conversation about a listing or service,
// OR return the existing one if this pair already has one for that
// listing/service (prevents duplicate threads for the same context).
// Body: { listingId } OR { serviceListingId }
// -----------------------------------------------------------------------
router.post(
  "/",
  authenticate,
  [
    body("listingId").optional().isString(),
    body("serviceListingId").optional().isString(),
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { listingId, serviceListingId } = req.body;
    if (!listingId && !serviceListingId) {
      return res.status(400).json({
        message: "Provide either listingId or serviceListingId.",
      });
    }
    if (listingId && serviceListingId) {
      return res.status(400).json({
        message: "Provide only one of listingId or serviceListingId, not both.",
      });
    }

    // Figure out who the other participant is: the listing's landlord, or
    // the service's provider. You can't start a conversation with yourself
    // about your own listing.
    let otherUserId;
    if (listingId) {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing) return res.status(404).json({ message: "Listing not found." });
      otherUserId = listing.landlordId;
    } else {
      const service = await prisma.serviceListing.findUnique({ where: { id: serviceListingId } });
      if (!service) return res.status(404).json({ message: "Service listing not found." });
      otherUserId = service.providerId;
    }

    if (otherUserId === req.user.sub) {
      return res.status(400).json({ message: "You can't message yourself about your own listing." });
    }

    const contextFilter = listingId ? { listingId } : { serviceListingId };

    // Check both possible orderings of participantA/B, since we don't
    // enforce which side is "A" vs "B" when creating.
    const existing = await prisma.conversation.findFirst({
      where: {
        ...contextFilter,
        OR: [
          { participantAId: req.user.sub, participantBId: otherUserId },
          { participantAId: otherUserId, participantBId: req.user.sub },
        ],
      },
    });
    if (existing) {
      return res.json(existing);
    }

    const conversation = await prisma.conversation.create({
      data: {
        ...contextFilter,
        participantAId: req.user.sub,
        participantBId: otherUserId,
      },
    });

    res.status(201).json(conversation);
  },
);

// -----------------------------------------------------------------------
// GET /conversations — the authenticated user's inbox: every conversation
// they're a participant in, most recently active first, with the last
// message and the other participant's basic info attached.
// -----------------------------------------------------------------------
router.get("/", authenticate, async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ participantAId: req.user.sub }, { participantBId: req.user.sub }],
    },
    include: {
      participantA: { select: { id: true, name: true } },
      participantB: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true, photoUrl: true } },
      serviceListing: { select: { id: true, category: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1, // just the most recent message, for an inbox preview
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  res.json(conversations);
});

// -----------------------------------------------------------------------
// GET /conversations/:id/messages — full message history for one
// conversation. Only accessible to its two participants.
// -----------------------------------------------------------------------
router.get(
  "/:id/messages",
  authenticate,
  [param("id").isString()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const conversation = await loadConversationForParticipant(req, res);
    if (!conversation) return; // response already sent

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  },
);

// -----------------------------------------------------------------------
// POST /conversations/:id/messages — send a message. Only participants.
// Body: { body: string }
// -----------------------------------------------------------------------
router.post(
  "/:id/messages",
  authenticate,
  [param("id").isString(), body("body").isString().trim().notEmpty()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const conversation = await loadConversationForParticipant(req, res);
    if (!conversation) return;

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: req.user.sub,
        body: req.body.body,
      },
    });

    // Bump the conversation's updatedAt so it sorts to the top of the
    // inbox — this is why GET /conversations orders by updatedAt.
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(message);
  },
);

// -----------------------------------------------------------------------
// PATCH /conversations/:id/read — mark every message NOT sent by me (i.e.
// sent by the other participant) as read.
// -----------------------------------------------------------------------
router.patch(
  "/:id/read",
  authenticate,
  [param("id").isString()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    const conversation = await loadConversationForParticipant(req, res);
    if (!conversation) return;

    const result = await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: { not: req.user.sub },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    res.json({ markedRead: result.count });
  },
);

module.exports = router;