const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");

// Lazily created — NOT at module load time. Building this eagerly (the
// previous version of this file) crashes the whole server on startup if
// AWS_REGION isn't set yet, since the AWS SDK treats an empty string
// differently from "not configured". Every function below checks
// isConfigured() first and falls back to a dev-mode response instead.
let s3Client = null;
function isConfigured() {
  return Boolean(
    process.env.AWS_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET,
  );
}
function getClient() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

// Returns a short-lived URL the FRONTEND uploads the file to directly
// (browser -> S3, never touching our server, keeping large file uploads
// off our backend entirely). `purpose` controls the folder + whether the
// object should be publicly readable:
//   "listing-photo"   -> public (anyone can view a live listing's photos)
//   "ad-image"        -> public (anyone can view a live ad's creative)
//   "trust-document"  -> private (only admins should ever see these)
//
// DEV MODE (NODE_ENV !== "production" only): if AWS isn't configured, returns
// a fake placeholder URL instead of failing — lets you build/test the upload
// flow's shape (the request/response contract) before an AWS account exists.
// In production this throws instead — see below. `baseUrl` is the
// caller's own live origin (see uploads.routes.js), NOT a hardcoded
// "localhost:4000" — that was reachable from a developer's own machine
// running the backend locally, but was returned to EVERY caller including
// real visitors on the live site, whose browsers have nothing listening on
// their own localhost:4000. Pointing this at the actual backend host means
// the URL at least resolves to a real server (see app.js's dev-fake-upload/
// dev-fake-file handlers) — but it is still not durable storage: Railway's
// filesystem is ephemeral, so anything saved this way is gone on the next
// deploy or restart. Set up real AWS S3 credentials to replace this.
const PUBLIC_PURPOSES = ["listing-photo", "ad-image"];
const FOLDER_BY_PURPOSE = { "trust-document": "documents", "ad-image": "ads" };

async function getPresignedUploadUrl({ purpose, fileName, fileType, userId, baseUrl }) {
  const folder = FOLDER_BY_PURPOSE[purpose] || "listings";
  const key = `${folder}/${userId}/${uuidv4()}-${fileName}`;
  const isPublic = PUBLIC_PURPOSES.includes(purpose);

  if (!isConfigured()) {
    // Never hand out a fake local URL in production: the file would be
    // written to Railway's ephemeral disk and lost on the next deploy, while
    // the user was told the upload worked. assertEnv() should already have
    // refused to boot; this is the runtime backstop.
    if (process.env.NODE_ENV === "production") {
      throw new Error("S3 is not configured (AWS_REGION/AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/AWS_S3_BUCKET) — refusing to use local-disk uploads in production.");
    }
    console.log(`[DEV S3 — AWS env vars not set] Would upload to key: ${key} (${fileType})`);
    return {
      uploadUrl: `${baseUrl}/dev-fake-upload/${key}`,
      key,
      publicUrl: isPublic ? `${baseUrl}/dev-fake-file/${key}` : null,
      dev: true,
    };
  }

  // No per-object ACL here — every bucket created since April 2023 defaults
  // to "Bucket owner enforced" (Object Ownership), which disables ACLs
  // entirely; a PutObjectCommand carrying ACL: "public-read" against such a
  // bucket fails outright. Public read for listings/ and ads/ is granted by
  // a bucket policy scoped to those prefixes instead (see the setup notes
  // this project's README/setup guide), which works regardless of Object
  // Ownership setting and doesn't require "Block Public Access" disabled
  // for ACLs at all — only for bucket policies.
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(getClient(), command, { expiresIn: 300 }); // 5 minutes

  const publicUrl = isPublic
    ? `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    : null; // trust documents have no public URL — admins access via a signed GET later

  return { uploadUrl, key, publicUrl };
}

// ---------------------------------------------------------------------------
// Admin document/ad-image review (GET side) — see admin.routes.js.
//
// Trust documents are the one upload purpose that's actually private (no
// publicUrl is ever generated for them — see PUBLIC_PURPOSES above), so an
// admin needs a short-lived signed GET to view one at all. Ad images are
// public by design and never go through this; admin.routes.js passes
// Advertisement.imageUrl straight through unsigned.
// ---------------------------------------------------------------------------

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
const MIME_BY_EXTENSION = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};
// Matches the "<uuid>-" prefix getPresignedUploadUrl's key format always adds
// (see `key` above), so the admin UI can show the file's original name
// rather than its storage key.
const UUID_PREFIX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;

function extensionFromKey(key) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(key);
  return match ? match[1].toLowerCase() : "";
}

// "image" | "pdf" | "other" — decided from the key's extension alone, since
// nothing in the DB records the original content type for a trust document.
function kindFromKey(key) {
  const ext = extensionFromKey(key);
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}

function fileNameFromKey(key) {
  const basename = key.split("/").pop() || key;
  return basename.replace(UUID_PREFIX, "") || basename;
}

// True only if the object genuinely exists in the bucket. Our IAM user has
// no s3:ListBucket, so S3 returns 403 (not 404) for a key that was never
// written — both, along with the SDK's own "NotFound" error name, mean
// "can't show this" from the caller's point of view. Any other failure
// (network, throttling, a real permissions problem) degrades to the same
// "unavailable" result rather than throwing, so a storage hiccup shows the
// admin a plain "not found" instead of a 500 — the real error is logged
// server-side (with no credentials in it) for whoever investigates.
async function objectExists(key) {
  if (!isConfigured()) return false;
  try {
    await getClient().send(new HeadObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key }));
    return true;
  } catch (err) {
    const status = err?.$metadata?.httpStatusCode;
    if (status === 403) {
      // Ambiguous by nature: no s3:ListBucket means a genuinely missing key
      // 403s instead of 404ing (see above) — but this IAM user could just as
      // easily be missing s3:GetObject on a key that actually exists. Can't
      // tell which from this response alone, so this is a warning to go
      // check, not a confirmed diagnosis either way.
      console.warn(
        `[s3] HeadObject got 403 for key "${key}" — either the key doesn't exist, or the IAM user is missing s3:GetObject on it.`,
      );
    } else if (err?.name !== "NotFound" && status !== 404) {
      console.error(`[s3] HeadObject failed unexpectedly for key "${key}":`, err?.name || err);
    }
    return false;
  }
}

// Content-Disposition is a header value, not a JSON field — an arbitrary
// original file name (unicode, quotes, CRLF) can break the header or inject
// into it. Restricted to a safe ASCII subset for THIS use only; the real
// fileName (returned to the frontend for display, via fileNameFromKey) is
// never touched by this.
function sanitizeFileNameForHeader(fileName, ext) {
  const cleaned = (fileName || "").replace(/[^A-Za-z0-9._ -]/g, "_");
  if (!/[A-Za-z0-9]/.test(cleaned)) {
    return ext ? `document.${ext}` : "document";
  }
  return cleaned;
}

// Short-lived signed GET for a private object (trust documents only — see
// above). `disposition` is "inline" for image/pdf so the browser renders
// them directly in the viewer dialog, and "attachment" for anything else so
// an unrecognized file type downloads instead of being executed/rendered by
// the browser.
async function getSignedReadUrl({ key, expiresIn = 300, disposition = "inline", fileName }) {
  const ext = extensionFromKey(key);
  const contentType = MIME_BY_EXTENSION[ext];
  const safeFileName = fileName ? sanitizeFileNameForHeader(fileName, ext) : null;
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ResponseContentDisposition: safeFileName ? `${disposition}; filename="${safeFileName}"` : disposition,
    ...(contentType ? { ResponseContentType: contentType } : {}),
  });
  return getSignedUrl(getClient(), command, { expiresIn });
}

module.exports = {
  getPresignedUploadUrl,
  isConfigured,
  kindFromKey,
  fileNameFromKey,
  objectExists,
  getSignedReadUrl,
};