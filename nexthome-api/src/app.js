const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

const { isConfigured: isS3Configured } = require("./lib/s3");
const CORS_ORIGINS = require("./lib/cors-origins");
const {
  globalLimiter,
  loginLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  authWriteLimiter,
} = require("./lib/rate-limit");

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

// Railway (like most PaaS hosts) puts one reverse proxy in front of the app.
// Without this, req.ip is the proxy's address for every request — so every
// visitor would share one rate-limit bucket, and the limiters below would
// either throttle everyone together or none of them.
app.set("trust proxy", 1);

// Security headers. This is a JSON API (no HTML served), so helmet's
// defaults are fine; cross-origin resource policy is relaxed because the
// separately-hosted frontend legitimately fetches from here.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS must be registered BEFORE express.json(). If a request body parser
// rejects a request (e.g. PayloadTooLargeError below) before CORS has run,
// the error response goes out with no CORS headers at all — the browser
// then reports it as a CORS failure, masking the real error (a confusing
// bug to debug blind; caught here by seeing the real error in this
// terminal versus what the browser console showed).
// `origin` is the explicit allowlist in lib/cors-origins.js — never "*",
// since credentials (the refresh-token cookie) are allowed.
app.use(
  cors({
    origin: CORS_ORIGINS,
    credentials: true,
  }),
);

// Parses incoming JSON request bodies into req.body. 1 MB is generous for
// everything the API accepts: photos and documents never travel in a JSON
// body (they go straight to S3 via presigned URLs — see uploads.routes.js),
// so the largest legitimate payload is a listing's text fields plus up to 20
// photo URLs, a few tens of KB at most. Anything bigger is rejected with 413
// (see the error handler below).
app.use(express.json({ limit: "1mb" }));

// Reads the httpOnly refresh-token cookie (see lib/refresh-tokens.js).
app.use(cookieParser());

app.use(globalLimiter);

// Stricter per-route limits, registered before the routers they guard.
// Login: brute force. OTP/email sends: every one costs real money (Termii
// SMS credit) or sender reputation, and the per-phone 60s cooldown alone
// doesn't stop an attacker rotating phone numbers.
app.use("/auth/login", loginLimiter);
app.use("/auth/register", authWriteLimiter);
app.use("/auth/forgot-password", authWriteLimiter);
// Method-specific: GET /auth/me is hit on every page load and must not share this budget.
app.patch("/auth/me", authWriteLimiter);
app.use("/auth/pre-register/send-otp", otpSendLimiter);
app.use("/auth/pre-register/verify-otp", otpVerifyLimiter);
app.use("/trust/phone/send-otp", otpSendLimiter);
app.use("/trust/email/send-verification", otpSendLimiter);
app.use("/trust/phone/verify-otp", otpVerifyLimiter);

// Simple health check — useful for confirming the server is up, and later
// for deployment platforms (Railway) to verify the service is alive.
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// DEV-ONLY: backs the fake presigned upload URLs s3.js returns when AWS
// isn't configured (see lib/s3.js), so the upload flow works end-to-end
// locally without a real AWS account.
//
// Never registered in production: Railway's filesystem is ephemeral, so
// anything written here would vanish on the next deploy. assertEnv()
// (lib/env.js) refuses to boot in production without S3, and s3.js throws
// rather than hand out a fake URL — this guard is the third layer, so the
// route can't exist there even if both of those were bypassed. It is also
// off whenever S3 is configured.
if (!isS3Configured() && process.env.NODE_ENV !== "production") {
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
// Express only treats a 4-argument function as an error handler, so the
// unused `_next` must stay in the signature.
app.use((err, req, res, _next) => {
  // Errors raised by the body parser (oversized or malformed JSON) carry a
  // 4xx status and are the client's fault — report them as such rather than
  // as a 500.
  const status = err.status || err.statusCode;
  if (status >= 400 && status < 500) {
    return res.status(status).json({
      message: err.type === "entity.too.large" ? "Request body is too large." : "Invalid request.",
    });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong." });
});

module.exports = app;