// A service category is whatever trade the provider types ("Electrician",
// "Swimming coach"), so it needs tidying before it is stored: the directory
// and the homepage "Service type" dropdown group listings by this exact string,
// and "electrician", " Electrician" and "ELECTRICIAN" must not become three
// categories.
//
// normalizeCategory: trims, collapses runs of spaces, and Title Cases the
// words ("swimming  coach" -> "Swimming Coach"; "pre-school tutor" ->
// "Pre-School Tutor"). Short all-capitals words are kept as typed ("AC repair"
// -> "AC Repair", "CCTV installer" -> "CCTV Installer").

const ACRONYM = /^[A-Z0-9]{2,4}$/;

function capitalise(word) {
  return word
    .toLowerCase()
    .replace(/(^|[-/])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
}

function normalizeCategory(raw) {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => (ACRONYM.test(w) && /[A-Z]/.test(w) ? w : capitalise(w)))
    .join(" ");
}

// What a category may contain once normalised: letters, digits, spaces and a
// little punctuation. Keeps markup and control characters out of a value that
// is shown on public pages.
const CATEGORY_PATTERN = /^[\p{L}\p{N} &'’\-/.,()]+$/u;

module.exports = { normalizeCategory, CATEGORY_PATTERN };
