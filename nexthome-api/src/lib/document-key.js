// Who a stored trust-document key belongs to.
//
// Keys are minted by the server in lib/s3.js, so their shape is known:
//   signed-in upload        documents/<userId>/<uuid>-<name>
//   pre-registration upload documents/pending-<sha256(phone)>/<uuid>-<name>
// The client later reports the key back ("this is the document I uploaded").
// Nothing stopped it reporting someone else's key, which an admin would then
// open as if it were the submitter's own. These checks make the reported key
// prove it came from the caller's own upload folder.

const crypto = require("crypto");

const MAX_KEY_LENGTH = 512;

function wellFormed(key) {
  return typeof key === "string" && key.length <= MAX_KEY_LENGTH && !key.includes("..") && !key.includes("\\") && !key.includes("//");
}

/** A document uploaded by a signed-in account: documents/<that account's id>/... */
function isOwnDocumentKey(key, userId) {
  return wellFormed(key) && typeof userId === "string" && userId.length > 0 && key.startsWith(`documents/${userId}/`);
}

/** A document uploaded during registration, bound to the verified phone number. */
function isPreRegistrationDocumentKey(key, phone) {
  if (!wellFormed(key) || typeof phone !== "string" || !phone) return false;
  const phoneHash = crypto.createHash("sha256").update(phone).digest("hex");
  return key.startsWith(`documents/pending-${phoneHash}/`);
}

module.exports = { isOwnDocumentKey, isPreRegistrationDocumentKey };
