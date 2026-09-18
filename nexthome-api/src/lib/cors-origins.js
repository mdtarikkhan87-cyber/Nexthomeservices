// Single source of truth for which frontend origins may talk to this API —
// shared by app.js's REST CORS middleware and lib/socket.js's Socket.IO
// handshake CORS, which used to duplicate this list. Tighten this to your
// real frontend URL(s) before adding a new domain in production; updating
// it here updates both REST and WebSocket CORS at once.
module.exports = ["http://localhost:3000", "https://nexthomeservices.vercel.app"];
