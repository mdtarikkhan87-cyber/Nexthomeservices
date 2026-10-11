// Boot-time environment validation. Called first thing in server.js so a
// missing or half-set variable crashes the process immediately with a clear
// message, instead of surfacing later as a confusing jwt.sign() failure, a
// 500 on the first upload, or a silent fallback to ephemeral storage.

const S3_VARS = ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET"];
const TWILIO_VARS = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"];

function assertEnv(env = process.env) {
  const isProd = env.NODE_ENV === "production";
  const problems = [];
  const missing = (name) => !env[name] || !String(env[name]).trim();

  // Always required — the app can't do anything useful without these.
  for (const name of ["DATABASE_URL", "JWT_ACCESS_SECRET", "FRONTEND_URL"]) {
    if (missing(name)) problems.push(`${name} is not set.`);
  }

  if (!missing("FRONTEND_URL") && !/^https?:\/\//.test(env.FRONTEND_URL)) {
    problems.push("FRONTEND_URL must start with http:// or https:// (it is used to build emailed links).");
  }

  // S3 is all-or-nothing. A partial set used to silently drop to the
  // local-disk fallback, which is never what anyone meant.
  const s3Set = S3_VARS.filter((n) => !missing(n));
  if (s3Set.length > 0 && s3Set.length < S3_VARS.length) {
    problems.push(
      `S3 is only partly configured — also set: ${S3_VARS.filter((n) => missing(n)).join(", ")} (or unset the rest).`,
    );
  }

  // Twilio is all-or-nothing too, and the IDs have a fixed shape — a pasted
  // value with a stray space or the wrong kind of SID fails here, at boot,
  // instead of as a confusing 503 the first time someone registers.
  const twilioSet = TWILIO_VARS.filter((n) => !missing(n));
  if (twilioSet.length > 0 && twilioSet.length < TWILIO_VARS.length) {
    problems.push(`Twilio is only partly configured — also set: ${TWILIO_VARS.filter((n) => missing(n)).join(", ")} (or unset the rest).`);
  }
  if (!missing("TWILIO_ACCOUNT_SID") && !/^AC[0-9a-f]{32}$/.test(env.TWILIO_ACCOUNT_SID)) {
    problems.push("TWILIO_ACCOUNT_SID must look like AC followed by 32 hex characters.");
  }
  if (!missing("TWILIO_VERIFY_SERVICE_SID") && !/^VA[0-9a-f]{32}$/.test(env.TWILIO_VERIFY_SERVICE_SID)) {
    problems.push("TWILIO_VERIFY_SERVICE_SID must look like VA followed by 32 hex characters (a Verify Service, not the Account SID).");
  }

  if (isProd) {
    if (!missing("JWT_ACCESS_SECRET") && env.JWT_ACCESS_SECRET.length < 32) {
      problems.push("JWT_ACCESS_SECRET must be at least 32 characters in production.");
    }
    // Uploaded photos/ad creatives/trust documents must survive a deploy;
    // the local-disk fallback is wiped on every Railway redeploy.
    if (s3Set.length === 0) {
      problems.push(
        `S3 is not configured (${S3_VARS.join(", ")}) — required in production, since local-disk uploads are lost on every deploy.`,
      );
    }
    // Phone OTP goes through Twilio Verify; without it no one can verify a phone.
    for (const name of TWILIO_VARS) {
      if (missing(name)) problems.push(`${name} is not set (required in production for phone verification via Twilio Verify).`);
    }
    for (const name of ["BREVO_API_KEY", "EMAIL_FROM"]) {
      if (missing(name)) problems.push(`${name} is not set (required in production to send verification and reset emails).`);
    }
  }

  if (problems.length > 0) {
    console.error(
      `\nNextHome API cannot start — invalid environment:\n${problems.map((p) => `  - ${p}`).join("\n")}\n\nSee nexthome-api/.env.example.\n`,
    );
    process.exit(1);
  }
}

module.exports = { assertEnv };
