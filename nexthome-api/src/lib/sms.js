// Routes SMS by the recipient's country code, mirroring the same pattern
// this project already uses for Stripe vs. Paystack payments:
//   +234 (Nigeria)        -> Termii  (cheapest, best local delivery)
//   everything else       -> Twilio  (reliable global delivery)
//
// If neither provider has credentials configured, falls back to logging
// the message to the server console — lets you build/test the whole OTP
// flow before either provider account exists.

function isNigerianNumber(phone) {
  const normalized = phone.replace(/[\s-]/g, "");
  if (normalized.startsWith("+234") || normalized.startsWith("234")) return true;
  // Common local format, e.g. 08031234567 — 11 digits starting with 0.
  if (/^0\d{10}$/.test(normalized)) return true;
  return false;
}

async function sendViaTermii(to, message) {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID || "NextHome";

  if (!apiKey) {
    // NODE_ENV-gated: this fallback exists so the OTP flow can be built
    // and tested before a Termii account exists, but it logs the message
    // itself — which for an OTP is the verification code in plaintext.
    // Never let that reach production logs; if Termii isn't configured
    // there, fail loudly instead of silently "succeeding" with an OTP
    // nobody actually receives.
    if (process.env.NODE_ENV === "production") {
      throw new Error("TERMII_API_KEY is not configured.");
    }
    console.log(`[DEV SMS via Termii — no TERMII_API_KEY set] To: ${to} | Message: ${message}`);
    return { delivered: false, dev: true, provider: "termii" };
  }

  const res = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      from: senderId,
      sms: message,
      type: "plain",
      channel: "generic",
      api_key: apiKey,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Termii failed (${res.status}): ${body}`);
  }
  return { delivered: true, provider: "termii" };
}

async function sendViaTwilio(to, message) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !authToken || !fromNumber) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Twilio credentials are not configured.");
    }
    console.log(`[DEV SMS via Twilio — Twilio env vars not set] To: ${to} | Message: ${message}`);
    return { delivered: false, dev: true, provider: "twilio" };
  }

  const body = new URLSearchParams({ To: to, From: fromNumber, Body: message });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${sid}:${authToken}`).toString("base64"),
    },
    body,
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Twilio failed (${res.status}): ${errBody}`);
  }
  return { delivered: true, provider: "twilio" };
}

// Public function every route file should call — routing decision happens
// here, once, so nothing else in the codebase needs to know these two
// providers exist.
async function sendSms(to, message) {
  if (isNigerianNumber(to)) {
    return sendViaTermii(to, message);
  }
  return sendViaTwilio(to, message);
}

module.exports = { sendSms };