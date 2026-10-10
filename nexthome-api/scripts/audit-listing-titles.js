// One-off audit + backfill: find listings whose stored title disagrees with
// the structured fields beside it (bedrooms, property type, state), and
// rewrite titles to the derived form that lib/listing-title.js now writes for
// every new or edited listing.
//
//   node scripts/audit-listing-titles.js                    # DRY RUN — reads only, writes nothing
//   node scripts/audit-listing-titles.js --apply            # rewrites every title that differs from the derived one
//   node scripts/audit-listing-titles.js --apply --mismatched-only
//                                                           # rewrites only titles with a detected contradiction
//
// Covers ALL listings (rent and sale, any status or availability — pending,
// rejected, unpublished and rented/sold rows included, not just what the
// public site shows).
//
// What counts as a contradiction (the "Problem" column):
//   - bedrooms: the title states a bedroom count ("5 bedroom", "3 bhk",
//     "2br", "two bed") different from the `bedrooms` field.
//   - type:     the title names property types (apartment/flat, duplex,
//     bungalow, terrace, studio, detached) and none match `propertyType`.
//     Skipped when `propertyType` is null (older rows), as there is nothing
//     to compare against.
//   - state:    the title names a Nigerian state other than the listing's.
//     State level only — LGA and street names in titles are not checked.
// A title with no contradiction but different wording from the derived one
// is listed as "reworded".
//
// Before writing, the original rows' ids and titles are saved to
// scripts/backups/ (git-ignored). Restoring is: for each saved row,
// UPDATE listings SET title = <old title> WHERE id = <id>.
//
// Reads DATABASE_URL from the environment / .env.

require("dotenv").config();

const fs = require("fs");
const path = require("path");

const prisma = require("../src/lib/prisma");
const { deriveListingTitle } = require("../src/lib/listing-title");

const APPLY = process.argv.includes("--apply");
const MISMATCHED_ONLY = process.argv.includes("--mismatched-only");
const BACKUP_DIR = path.join(__dirname, "backups");

// Same 37 names as src/lib/nigeria-locations.ts (FCT is "Abuja (FCT)" there).
const STATES = [
  "Abia", "Abuja (FCT)", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe",
  "Zamfara",
];

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

// type word in a title -> the propertyType value it implies
const TYPE_WORDS = [
  [/\b(apartment|flat)s?\b/i, "apartment"],
  [/\bduplex(es)?\b/i, "duplex"],
  [/\bbungalows?\b/i, "bungalow"],
  [/\bterrace[sd]?\b/i, "terrace"],
  [/\bstudio\b/i, "studio"],
  [/\bdetached\b/i, "detached"],
];

/** Bedroom counts a title states, e.g. "5 bedroom", "3-bhk", "2br", "two bed". */
function statedBedrooms(title) {
  const found = [];
  const re = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*[- ]?\s*(?:bed(?:room)?s?|bhk|br|bd)\b/gi;
  for (const m of title.matchAll(re)) {
    const raw = m[1].toLowerCase();
    found.push(/^\d+$/.test(raw) ? Number(raw) : NUMBER_WORDS[raw]);
  }
  return found;
}

function problemsFor(l) {
  const problems = [];

  const beds = statedBedrooms(l.title);
  if (beds.length > 0 && !beds.includes(l.bedrooms)) {
    problems.push(`title says ${beds.join("/")} bedroom, field is ${l.bedrooms}`);
  }

  if (l.propertyType) {
    const named = TYPE_WORDS.filter(([re]) => re.test(l.title)).map(([, t]) => t);
    if (named.length > 0 && !named.includes(l.propertyType)) {
      problems.push(`title says ${named.join("/")}, field is ${l.propertyType}`);
    }
  }

  const wrongStates = STATES.filter(
    (s) => s !== l.state && new RegExp(`\\b${s.replace(/[()]/g, "\\$&")}\\b`, "i").test(l.title),
  );
  if (wrongStates.length > 0) {
    problems.push(`title names ${wrongStates.join("/")}, field is ${l.state}`);
  }

  return problems;
}

async function main() {
  const dbHost = (process.env.DATABASE_URL || "").replace(/^[a-z]+:\/\/[^@]*@/, "").split("/")[0];
  console.log(`Mode:     ${APPLY ? `APPLY${MISMATCHED_ONLY ? " (mismatched only)" : ""}` : "DRY RUN (no writes)"}`);
  console.log(`Database: ${dbHost}\n`);

  const listings = await prisma.listing.findMany({
    select: {
      id: true, title: true, type: true, bedrooms: true, propertyType: true,
      occupancyType: true, state: true, lga: true, status: true, availability: true, isPublished: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = listings.map((l) => {
    const next = deriveListingTitle(l);
    const problems = problemsFor(l);
    return { l, next, problems, changes: next !== l.title };
  });

  const mismatched = rows.filter((r) => r.problems.length > 0);
  const toChange = rows.filter((r) => r.changes && (!MISMATCHED_ONLY || r.problems.length > 0));

  console.log(`Listings: ${rows.length} total, ${mismatched.length} with a contradiction, ${toChange.length} ${APPLY ? "to rewrite" : "would be rewritten"}\n`);

  if (toChange.length > 0) {
    console.table(
      toChange.map(({ l, next, problems }) => ({
        id: l.id,
        type: l.type,
        status: `${l.status}${l.isPublished ? "" : "/unpublished"}`,
        "old title": l.title,
        "new title": next,
        bedrooms: l.bedrooms,
        location: `${l.lga ? `${l.lga}, ` : ""}${l.state}`,
        problem: problems.length > 0 ? problems.join("; ") : "reworded",
      })),
    );
  }

  if (!APPLY) {
    console.log("\nDry run — nothing written. Re-run with --apply to rewrite these titles.");
    return;
  }
  if (toChange.length === 0) {
    console.log("Nothing to rewrite.");
    return;
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backupFile = path.join(BACKUP_DIR, `listing-titles-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(toChange.map(({ l }) => ({ id: l.id, title: l.title })), null, 2));
  console.log(`\nOriginal titles saved to ${backupFile}`);

  for (const { l, next } of toChange) {
    await prisma.listing.update({ where: { id: l.id }, data: { title: next } });
  }
  console.log(`Rewrote ${toChange.length} title(s).`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
