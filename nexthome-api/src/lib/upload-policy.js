// Server-side rules for what may be uploaded through a presigned URL.
//
// The browser's <input accept> and size checks are only a convenience — they
// are trivially bypassed with a direct API call — so the real limits live
// here, and the size is additionally SIGNED into the S3 URL (see s3.js), so S3
// itself rejects an upload whose bytes don't match what was declared.

const MB = 1024 * 1024;

// MIME type -> the file extension the stored object gets (the first entry).
// The extension on the stored key is derived from the validated type, never
// from the user-supplied file name, so an object's key can't claim to be
// something its type isn't (a public ads/ or listings/ object ending in .html
// or .exe, say).
const IMAGE_TYPES = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
};
const DOCUMENT_TYPES = { ...IMAGE_TYPES, "application/pdf": ["pdf"] };

const POLICY = {
  "listing-photo": { types: IMAGE_TYPES, maxBytes: 5 * MB, label: "JPG, PNG, WebP or GIF images up to 5 MB" },
  "ad-image": { types: IMAGE_TYPES, maxBytes: 5 * MB, label: "JPG, PNG, WebP or GIF images up to 5 MB" },
  "trust-document": { types: DOCUMENT_TYPES, maxBytes: 10 * MB, label: "an image (JPG, PNG, WebP, GIF) or a PDF, up to 10 MB" },
};

// Returns null when the upload is acceptable, otherwise a user-facing message.
function validateUpload({ purpose, fileType, fileSize }) {
  const policy = POLICY[purpose];
  if (!policy) return "Unknown upload type.";

  const type = String(fileType || "").toLowerCase();
  if (!policy.types[type]) {
    return `That file type isn't allowed here. Please upload ${policy.label}.`;
  }
  const size = Number(fileSize);
  if (!Number.isInteger(size) || size <= 0) {
    return "The file size is required.";
  }
  if (size > policy.maxBytes) {
    return `That file is ${(size / MB).toFixed(1)} MB — the limit is ${policy.maxBytes / MB} MB.`;
  }
  return null;
}

// The extension a stored object should carry for a validated MIME type.
function extensionForType(fileType) {
  const exts = DOCUMENT_TYPES[String(fileType || "").toLowerCase()];
  return exts ? exts[0] : null;
}

module.exports = { POLICY, validateUpload, extensionForType };
