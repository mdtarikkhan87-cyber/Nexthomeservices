// Sends email via any standard SMTP account (Gmail app password, SendGrid,
// Mailgun, Postmark — anything that speaks SMTP). If SMTP_HOST isn't set,
// falls back to logging the email to the server console instead of failing
// — lets you build and test the whole verification flow before an email
// provider account exists.
const nodemailer = require("nodemailer");

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV EMAIL — no SMTP_HOST set] To: ${to} | Subject: ${subject}\n${html}`);
    return { delivered: false, dev: true };
  }

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || "NextHome <no-reply@nexthome.example>",
    to,
    subject,
    html,
  });
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