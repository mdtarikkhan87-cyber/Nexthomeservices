const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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
// DEV MODE: if AWS isn't configured yet, returns a fake local placeholder
// URL instead of failing — lets you build/test the upload flow's shape
// (the request/response contract) before an AWS account exists. The
// "upload" won't actually go anywhere in this mode.
const PUBLIC_PURPOSES = ["listing-photo", "ad-image"];
const FOLDER_BY_PURPOSE = { "trust-document": "documents", "ad-image": "ads" };

async function getPresignedUploadUrl({ purpose, fileName, fileType, userId }) {
  const folder = FOLDER_BY_PURPOSE[purpose] || "listings";
  const key = `${folder}/${userId}/${uuidv4()}-${fileName}`;
  const isPublic = PUBLIC_PURPOSES.includes(purpose);

  if (!isConfigured()) {
    console.log(`[DEV S3 — AWS env vars not set] Would upload to key: ${key} (${fileType})`);
    return {
      uploadUrl: `http://localhost:4000/dev-fake-upload/${key}`,
      key,
      publicUrl: isPublic ? `http://localhost:4000/dev-fake-file/${key}` : null,
      dev: true,
    };
  }

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ContentType: fileType,
    ...(isPublic ? { ACL: "public-read" } : {}),
  });

  const uploadUrl = await getSignedUrl(getClient(), command, { expiresIn: 300 }); // 5 minutes

  const publicUrl = isPublic
    ? `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    : null; // trust documents have no public URL — admins access via a signed GET later

  return { uploadUrl, key, publicUrl };
}

module.exports = { getPresignedUploadUrl };