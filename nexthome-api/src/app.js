const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const { isConfigured: isS3Configured } = require("./lib/s3");
const CORS_ORIGINS = require("./lib/cors-origins");

const authRoutes = require("./routes/auth.routes");
const preRegisterRoutes = require("./routes/pre-register.routes");
const listingsRoutes = require("./routes/listings.routes");
const conversationsRoutes = require("./routes/conversations.routes");
const trustRoutes = require("./routes/trust.routes");
const uploadsRoutes = require("./routes/uploads.routes");
const savedRoutes = require("./routes/saved.routes");

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
    origin: CORS_ORIGINS,
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

// DEV-ONLY: backs the fake presigned upload URLs s3.js returns when AWS
// isn't configured (see lib/s3.js), so the upload flow works end-to-end —
// actually saving and serving the file — without a real AWS account.
//
// NOT DURABLE: Railway's filesystem is ephemeral, so anything written here
// is gone on the next deploy or restart. This used to just swallow the file
// and say "ok" with no GET counterpart at all, which was silently broken
// for every real visitor on the live site (their browser has nothing at
// localhost:4000 — that was always the developer's own machine, never a
// real server). This makes uploads at least actually work until the next
// deploy; it is a stopgap, not a replacement for configuring real S3
// credentials (isS3Configured() below gates it off entirely once you do).
if (!isS3Configured()) {
  const UPLOAD_ROOT = path.join(__dirname, "..", "uploads");

  // Keys are server-generated (`${folder}/${userId}/${uuid}-${fileName}` in
  // s3.js) but fileName itself is user-supplied, so this still guards
  // against a crafted "../../etc/passwd"-style key escaping UPLOAD_ROOT.
  function resolveUploadPath(key) {
    const resolved = path.normalize(path.join(UPLOAD_ROOT, key));
    if (resolved !== UPLOAD_ROOT && !resolved.startsWith(UPLOAD_ROOT + path.sep)) return null;
    return resolved;
  }

  app.put(
    /^\/dev-fake-upload\/(.*)/,
    express.raw({ type: "*/*", limit: "10mb" }),
    (req, res) => {
      const filePath = resolveUploadPath(decodeURIComponent(req.params[0]));
      if (!filePath) return res.status(400).json({ message: "Invalid upload path." });
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, req.body);
      res.sendStatus(200);
    },
  );

  app.get(/^\/dev-fake-file\/(.*)/, (req, res) => {
    const filePath = resolveUploadPath(decodeURIComponent(req.params[0]));
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ message: "Not found." });
    res.sendFile(filePath);
  });
}

app.use("/auth", authRoutes);
// Unauthenticated on purpose — see pre-register.routes.js's own comments.
// Mounted under /auth so the register page's whole account-creation surface
// stays under one path prefix, even though these three endpoints don't
// share auth.routes.js's authenticated register/login/refresh handlers.
app.use("/auth/pre-register", preRegisterRoutes);
app.use("/listings", listingsRoutes);
app.use("/conversations", conversationsRoutes);
app.use("/trust", trustRoutes);
app.use("/uploads", uploadsRoutes);
app.use("/saved", savedRoutes);

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