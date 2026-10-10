const { rateLimit } = require("express-rate-limit");

// Blocked requests get the same JSON error shape as the rest of the API so
// the frontend's request() helper surfaces `message` unchanged.
function limiter({ windowMs, limit, message, ...rest }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message },
    ...rest,
  });
}

const MINUTE = 60 * 1000;

// Whole-API backstop per IP.
const globalLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 600,
  message: "Too many requests. Please slow down and try again shortly.",
});

// Brute-force protection for /auth/login. Counts only failed attempts, so a
// user who mistypes twice isn't locked out by their own later successes.
const loginLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  message: "Too many login attempts. Please try again in 15 minutes.",
});

// Anything that spends SMS credit or sends email. Keyed by IP, so rotating
// phone numbers no longer gets an attacker unlimited sends past the
// per-phone cooldown. Counts every request, success or not.
const otpSendLimiter = limiter({
  windowMs: 60 * MINUTE,
  limit: 5,
  message: "Too many verification requests. Please try again later.",
});

// Guessing 6-digit codes.
const otpVerifyLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 20,
  message: "Too many attempts. Please try again later.",
});

// Account creation, password-reset and other email-sending endpoints.
const authWriteLimiter = limiter({
  windowMs: 60 * MINUTE,
  limit: 20,
  message: "Too many requests. Please try again later.",
});

module.exports = { globalLimiter, loginLimiter, otpSendLimiter, otpVerifyLimiter, authWriteLimiter };
