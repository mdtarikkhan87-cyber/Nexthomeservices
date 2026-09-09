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

module.exports = { sendEmail };