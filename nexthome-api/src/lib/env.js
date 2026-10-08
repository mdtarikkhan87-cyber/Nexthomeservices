// Boot-time environment validation. Called first thing in server.js so a
// missing or half-set variable crashes the process immediately with a clear
// message, instead of surfacing later as a confusing jwt.sign() failure, a
// 500 on the first upload, or a silent fallback to ephemeral storage.

const S3_VARS = ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET"];

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
