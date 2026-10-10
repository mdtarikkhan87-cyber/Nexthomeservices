require("dotenv").config();

const { assertEnv } = require("./lib/env");

// Before anything else loads: crash at boot with a clear message rather
// than failing confusingly at request time.
assertEnv();

const http = require("http");
const app = require("./app");
const { initSocket } = require("./lib/socket");

const PORT = process.env.PORT || 4000;

// http.createServer(app), not app.listen() directly — Socket.IO needs the
// raw http.Server instance to attach to, so both HTTP and WebSocket
// traffic share the exact same port Railway already exposes.
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`NextHome API running on http://localhost:${PORT}`);
});
