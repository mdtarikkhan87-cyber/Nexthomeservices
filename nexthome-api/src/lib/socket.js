const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const prisma = require("./prisma");
const CORS_ORIGINS = require("./cors-origins");

// Real-time layer for messaging — the REST endpoints in
// conversations.routes.js remain the single source of truth for reading
// and writing messages (auth, ownership, validation all stay there); this
// only pushes what already happened out to connected clients, so nothing
// duplicates the business logic already proven correct over REST.
//
// Two room types:
//   `user:<userId>`         — every authenticated socket joins its own on
//                              connect. Used for inbox-level updates (a new
//                              message's preview/unread count) that should
//                              reach a participant regardless of whether
//                              they currently have that conversation open.
//   `conversation:<id>`     — joined on demand (see join-conversation
//                              below) by whoever has that thread open, so
//                              the message itself can stream in live.
let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: CORS_ORIGINS,
      credentials: true,
    },
  });

  // Same JWT this app already issues for REST (auth.middleware.js) — a
  // socket connection has to prove who it is exactly the same way a
  // request does. Auth is the handshake payload, not a header, since
  // that's how socket.io-client sends it.
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error("Missing auth token"));
    try {
      socket.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.sub}`);

    // Authorization check on join, not just on the initial REST fetch —
    // a socket that only ever proved it's SOME authenticated user has no
    // business being handed every message in a conversation it isn't part
    // of just because it asked to join that room.
    socket.on("join-conversation", async (conversationId, callback) => {
      try {
        const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
        const isParticipant =
          conversation &&
          (conversation.participantAId === socket.user.sub || conversation.participantBId === socket.user.sub);
        if (!isParticipant) {
          if (callback) callback({ ok: false, error: "Not a participant in this conversation." });
          return;
        }
        socket.join(`conversation:${conversationId}`);
        if (callback) callback({ ok: true });
      } catch {
        if (callback) callback({ ok: false, error: "Server error." });
      }
    });

    socket.on("leave-conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.IO has not been initialized yet — call initSocket() first.");
  return io;
}

module.exports = { initSocket, getIO };
