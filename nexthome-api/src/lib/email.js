// Sends email via Brevo's HTTP Transactional Email API (not raw SMTP).
//
// This used to go through nodemailer over SMTP, but Railway blocks
// outbound SMTP entirely — confirmed by running a verbose nodemailer
// verify+send from inside the actual deployed container (not `railway
// run`, which executes locally with Railway's env vars injected and gives
// a misleading result): every attempt, on both port 587 and Brevo's
// alternate 2525, timed out (ETIMEDOUT) with no response from Brevo's
// server at all — not a credentials/IP-allowlist rejection, a network-
// level block. HTTPS (443) isn't subject to that restriction, so the fix
// is Brevo's REST API instead of SMTP, not a different port.
//
// If BREVO_API_KEY isn't set, falls back to logging the email to the
// server console instead of failing — lets you build and test the whole
// verification flow before a Brevo account exists.
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// EMAIL_FROM is kept in the same "Name <email>" shape nodemailer used,
// since that's still how it reads everywhere else it's documented — only
// parsed apart here because Brevo's API wants sender name/email as two
// separate JSON fields rather than one combined header string.
function parseFrom(raw) {
  const match = /^(.*)<(.+)>$/.exec(raw || "");
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].trim() };
  return { name: "NextHome", email: raw || "no-reply@nexthome.example" };
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.BREVO_API_KEY) {
    // NODE_ENV-gated for the same reason as sms.js's dev fallbacks: this
    // email's html can carry a raw verification/reset token in its link,
    // and this fallback logs the full html. Never let that reach
    // production logs — fail loudly instead if Brevo isn't configured there.
    if (process.env.NODE_ENV === "production") {
      throw new Error("BREVO_API_KEY is not configured.");
    }
    console.log(`[DEV EMAIL — no BREVO_API_KEY set] To: ${to} | Subject: ${subject}\n${html}`);
    return { delivered: false, dev: true };
  }

  const sender = parseFrom(process.env.EMAIL_FROM);
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo API send failed (${res.status}): ${body}`);
  }
  return { delivered: true };
}

// One bullet per role, in the backend's underscored vocabulary — never
// combined with the frontend's hyphenated RoleName, same reasoning as
// every other -client.js/-client.ts translation boundary in this project.
const ROLE_BULLETS = {
  landlord: "List your property and reach genuine tenants directly — no more sifting through WhatsApp groups.",
  tenant_buyer: "Browse verified rental and sale listings, and message landlords directly, in-app.",
  service_provider: "List your services and get discovered by people who actually need them.",
  advertiser: "Put your ads in front of our audience, reviewed and placed by our team.",
};

// The welcome email doubles as the verification email sent on registration
// (auth.routes.js) — one email, not two landing seconds apart. Role-aware:
// only the bullets for roles this specific account holds are included,
// since a registration can hold any combination of the four.
function buildWelcomeEmailHtml({ name, roles, verifyUrl }) {
  const bullets = roles
    .filter((role) => ROLE_BULLETS[role])
    .map((role) => `<li style="margin-bottom: 8px;">${ROLE_BULLETS[role]}</li>`)
    .join("");

  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #172a3a;">
      <h1 style="font-size: 22px; margin-bottom: 16px;">Welcome to NextHome, ${name}! 👋</h1>
      <p style="font-size: 15px; line-height: 1.6;">
        We built NextHome so finding a home, listing a property, or offering your services is
        simple and trustworthy — no more relying on scattered WhatsApp groups and word of mouth.
      </p>
      ${
        bullets
          ? `<p style="font-size: 15px; line-height: 1.6; margin-bottom: 8px;">Here's what you can do:</p>
      <ul style="font-size: 15px; line-height: 1.6; padding-left: 20px;">${bullets}</ul>`
          : ""
      }
      <p style="font-size: 15px; line-height: 1.6;">
        First, let's confirm this is really your email address:
      </p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="${verifyUrl}" style="background-color: #0492c2; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
          Verify my email
        </a>
      </p>
      <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">
        Or paste this link into your browser: <a href="${verifyUrl}" style="color: #0492c2;">${verifyUrl}</a>
      </p>
      <p style="font-size: 15px; line-height: 1.6; margin-top: 24px;">
        Welcome aboard!<br />The NextHome Team
      </p>
    </div>
  `;
}

module.exports = { sendEmail, buildWelcomeEmailHtml };