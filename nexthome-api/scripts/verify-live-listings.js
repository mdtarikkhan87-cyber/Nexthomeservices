// One-off backfill: mark already-approved (live) property and service listings
// as verified. Going forward the admin approve route sets this itself
// (admin.routes.js); this only fixes listings approved before that change.
//
//   node scripts/verify-live-listings.js           # DRY RUN — counts only
//   node scripts/verify-live-listings.js --apply   # performs the update
//
// Only touches rows where status = 'live' AND verified = false.

require("dotenv").config();

const prisma = require("../src/lib/prisma");

const APPLY = process.argv.includes("--apply");

async function main() {
  const dbHost = (process.env.DATABASE_URL || "").replace(/^[a-z]+:\/\/[^@]*@/, "").split("/")[0];
  console.log(`Mode:     ${APPLY ? "APPLY" : "DRY RUN (no writes)"}`);
  console.log(`Database: ${dbHost}\n`);

  const where = { status: "live", verified: false };
  for (const [label, model] of [["property listings", prisma.listing], ["service listings", prisma.serviceListing]]) {
    const n = await model.count({ where });
    if (APPLY && n > 0) {
      const r = await model.updateMany({ where, data: { verified: true } });
      console.log(`${label}: ${n} live & unverified -> updated ${r.count}`);
    } else {
      console.log(`${label}: ${n} live & unverified${APPLY ? "" : " (would update)"}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
