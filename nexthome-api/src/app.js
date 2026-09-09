const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const listingsRoutes = require("./routes/listings.routes");
const conversationsRoutes = require("./routes/conversations.routes");
const trustRoutes = require("./routes/trust.routes");
const uploadsRoutes = require("./routes/uploads.routes");

const servicesRoutes = require("./routes/services.routes");
const adsRoutes = require("./routes/ads.routes");
const ratingsRoutes = require("./routes/ratings.routes");
const complaintsRoutes = require("./routes/complaints.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// CORS must be registered BEFORE express.json(). If a request body parser
// rejects a request (e.g. PayloadTooLargeError below) before CORS has run,
// the error response goes out with no CORS headers at all — the browser
// then reports it as a CORS failure, masking the real error (a confusing
// bug to debug blind; caught here by seeing the real error in this
// terminal versus what the browser console showed).
// Tighten `origin` to your real frontend URL before going to production
// instead of leaving it wide open.
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

// Parses incoming JSON request bodies into req.body. Default limit is only
// 100kb — far too small for the interim base64-encoded photo uploads this
// project currently uses (no S3 yet). Raised to 50mb to comfortably cover
// the wizard's own limits (up to 8 photos, 5MB each, plus ~33% base64
// overhead). This is exactly the kind of practical ceiling that motivates
// moving to real presigned S3 uploads instead of embedding photos in JSON.
app.use(express.json({ limit: "50mb" }));

// Simple health check — useful for confirming the server is up, and later
// for deployment platforms (Railway) to verify the service is alive.
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// DEV-ONLY: accepts the fake presigned upload URLs s3.js returns when AWS
// isn't configured yet, so the whole upload flow can be tested end-to-end
// without a real AWS account. Just swallows the file and says "ok" — real
// AWS handles the real upload once configured.
app.put(/^\/dev-fake-upload\/.*/, (req, res) => {
  res.sendStatus(200);
});

app.use("/auth", authRoutes);
app.use("/listings", listingsRoutes);
app.use("/conversations", conversationsRoutes);
app.use("/trust", trustRoutes);
app.use("/uploads", uploadsRoutes);

app.use("/services", servicesRoutes);
app.use("/ads", adsRoutes);
app.use("/ratings", ratingsRoutes);
app.use("/complaints", complaintsRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/admin", adminRoutes);

// Catch-all error handler — anything thrown/rejected in a route handler
// that isn't already caught ends up here instead of crashing the server or
// leaking a raw stack trace to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong." });
});

module.exports = app;