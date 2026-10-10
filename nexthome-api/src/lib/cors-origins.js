// Single source of truth for which frontend origins may talk to this API —
// shared by app.js's REST CORS middleware and lib/socket.js's Socket.IO
// handshake CORS, which used to duplicate this list. Tighten this to your
// real frontend URL(s) before adding a new domain in production; updating
// it here updates both REST and WebSocket CORS at once.
const origins = ["http://localhost:3000", "https://nexthomeservices.vercel.app"];

// The configured FRONTEND_URL (assertEnv guarantees it's set) is always
// allowed, so moving the site to a custom domain is an env-var change, not a
// code change. Normalised to a bare origin: no path, no trailing slash.
try {
  const configured = new URL(process.env.FRONTEND_URL).origin;
  if (!origins.includes(configured)) origins.push(configured);
} catch {
  /* assertEnv rejects a malformed FRONTEND_URL at boot */
}

module.exports = origins;
