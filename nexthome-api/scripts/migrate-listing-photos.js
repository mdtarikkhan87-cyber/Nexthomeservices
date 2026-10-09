// One-off migration: move listing photos stored as inline base64 `data:` URLs
// in Postgres out to S3, replacing each with its public URL.
//
//   node scripts/migrate-listing-photos.js            # DRY RUN — reads only, writes nothing
//   node scripts/migrate-listing-photos.js --apply    # uploads to S3 and updates the database
//
// Per listing, in this order:
//   1. Decode every distinct data: image (photoUrl usually duplicates
//      galleryUrls[0], so it is uploaded once).
//   2. Upload each to S3 under listings/ through the same presign code path
//      the app uses (lib/s3.js).
//   3. Fetch each resulting public URL back and check its bytes match what
//      was uploaded (this also proves the bucket's public-read policy works).
//   4. Save the original row to scripts/backups/ (JSON), THEN update the row.
// If any step fails for a listing, that listing's row is left untouched and
// the script moves on; a failure never leaves a half-migrated row. Safe to
// re-run: rows with no data: URLs are skipped.
//
// Reads DATABASE_URL and the AWS_* variables from the environment / .env.
// Refuses to --apply without S3 configured, unless MIGRATE_BASE_URL points at
// a local dev server (used only to test this script against local storage).

require("dotenv").config();

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const prisma = require("../src/lib/prisma");
const { getPresignedUploadUrl, isConfigured } = require("../src/lib/s3");

const APPLY = process.argv.includes("--apply");
const LOCAL_BASE_URL = process.env.MIGRATE_BASE_URL || null; // test hook for dev-fake storage only
const BACKUP_DIR = path.join(__dirname, "backups");

const EXT_BY_TYPE = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

const isDataUrl = (u) => typeof u === "string" && u.startsWith("data:");

function decodeDataUrl(dataUrl) {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!m) throw new Error("not a valid data: URL");
  const [, type, isBase64, payload] = m;
  const bytes = isBase64 ? Buffer.from(payload, "base64") : Buffer.from(decodeURIComponent(payload));
  if (bytes.length === 0) throw new Error("empty image");
  return { type, bytes };
}

const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

async function uploadAndVerify({ type, bytes }, landlordId, label) {
  const presigned = await getPresignedUploadUrl({
    purpose: "listing-photo",
    fileName: `${label}.${EXT_BY_TYPE[type] || "jpg"}`,
    fileType: type,
    userId: landlordId,
    baseUrl: LOCAL_BASE_URL,
  });
  if (!presigned.publicUrl) throw new Error("no public URL returned");

  const put = await fetch(presigned.uploadUrl, { method: "PUT", headers: { "Content-Type": type }, body: bytes });
  if (!put.ok) throw new Error(`upload PUT failed (${put.status})`);

  const get = await fetch(presigned.publicUrl);
  if (!get.ok) throw new Error(`public fetch failed (${get.status}) for ${presigned.publicUrl}`);
  const fetched = Buffer.from(await get.arrayBuffer());
  if (fetched.length !== bytes.length || sha(fetched) !== sha(bytes)) {
    throw new Error(`public fetch returned different bytes for ${presigned.publicUrl}`);
  }
  return presigned.publicUrl;
}

async function main() {
  const dbHost = (process.env.DATABASE_URL || "").replace(/^[a-z]+:\/\/[^@]*@/, "").split("/")[0];
  console.log(`Mode:     ${APPLY ? "APPLY (will upload and write)" : "DRY RUN (no writes)"}`);
  console.log(`Database: ${dbHost}`);
  console.log(`Storage:  ${LOCAL_BASE_URL ? `LOCAL dev storage at ${LOCAL_BASE_URL}` : isConfigured() ? `S3 bucket ${process.env.AWS_S3_BUCKET} (${process.env.AWS_REGION})` : "NOT CONFIGURED"}`);

  if (APPLY && !LOCAL_BASE_URL && !isConfigured()) {
    throw new Error("Refusing to --apply: S3 is not configured (AWS_REGION/AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/AWS_S3_BUCKET).");
  }

  const listings = await prisma.listing.findMany({ orderBy: { createdAt: "asc" } });
  const todo = listings.filter((l) => isDataUrl(l.photoUrl) || (l.galleryUrls || []).some(isDataUrl));
  console.log(`\n${listings.length} listings total, ${todo.length} with inline base64 photos.\n`);

  let migrated = 0;
  let failed = 0;

  for (const l of todo) {
    const distinct = [...new Set([l.photoUrl, ...(l.galleryUrls || [])].filter(isDataUrl))];
    const approxMb = (distinct.reduce((n, d) => n + d.length, 0) / 1e6).toFixed(2);
    console.log(`- ${l.id} "${l.title}" [${l.status}] — ${distinct.length} distinct image(s), ~${approxMb} MB inline`);
    if (!APPLY) continue;

    try {
      const urlByData = new Map();
      for (const [i, dataUrl] of distinct.entries()) {
        const publicUrl = await uploadAndVerify(decodeDataUrl(dataUrl), l.landlordId, `migrated-${i + 1}`);
        urlByData.set(dataUrl, publicUrl);
        console.log(`    uploaded + verified image ${i + 1}/${distinct.length}: ${publicUrl}`);
      }

      const swap = (u) => (isDataUrl(u) ? urlByData.get(u) : u);
      const next = { photoUrl: swap(l.photoUrl), galleryUrls: (l.galleryUrls || []).map(swap) };

      // Keep the original bytes on disk before overwriting them.
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(BACKUP_DIR, `listing-${l.id}.json`),
        JSON.stringify({ id: l.id, photoUrl: l.photoUrl, galleryUrls: l.galleryUrls }),
      );

      await prisma.listing.update({ where: { id: l.id }, data: next });
      console.log("    row updated.");
      migrated++;
    } catch (err) {
      failed++;
      console.error(`    FAILED — row left unchanged: ${err.message}`);
    }
  }

  console.log(APPLY ? `\nDone. Migrated ${migrated}, failed ${failed}.` : "\nDry run complete — nothing was changed. Re-run with --apply to migrate.");
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
