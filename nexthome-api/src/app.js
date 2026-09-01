const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const listingsRoutes = require("./routes/listings.routes");
const conversationsRoutes = require("./routes/conversations.routes");

const app = express();

// Parses incoming JSON request bodies into req.body.
app.use(express.json());

// Allows your Next.js frontend (running on a different port/domain) to call
// this API from the browser. Tighten `origin` to your real frontend URL
// before going to production instead of leaving it wide open.
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

// Simple health check — useful for confirming the server is up, and later
// for deployment platforms (Railway) to verify the service is alive.
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/listings", listingsRoutes);
app.use("/conversations", conversationsRoutes);

// Catch-all error handler — anything thrown/rejected in a route handler
// that isn't already caught ends up here instead of crashing the server or
// leaking a raw stack trace to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong." });
});

module.exports = app;