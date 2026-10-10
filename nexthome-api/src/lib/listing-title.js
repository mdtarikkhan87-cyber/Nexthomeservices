// A listing's title is DERIVED from its structured fields, never typed.
//
// It used to be free text, which let a title say "5 bedroom apartment" while
// the same record said 6 bedrooms. Both write paths in listings.routes.js
// (POST and PATCH) call this and ignore any title the client sends, so the
// title and the fields it describes cannot drift apart.
//
// Deliberately states only bedrooms and property type. Location is already
// shown beside every title (state + LGA), so repeating it here would just be a
// second copy to go stale.

const TYPE_NOUN = {
  apartment: "apartment",
  duplex: "duplex",
  bungalow: "bungalow",
  terrace: "terrace",
  studio: "studio",
  detached: "detached house",
};

/**
 * @param {{ bedrooms: number, propertyType?: string | null, occupancyType?: string | null }} fields
 * @returns {string} e.g. "3 bedroom apartment", "Studio apartment", "4-room shared duplex"
 */
function deriveListingTitle({ bedrooms, propertyType, occupancyType }) {
  // Older rows have no propertyType (it is optional on the model).
  const noun = TYPE_NOUN[propertyType] ?? "home";

  // A shared listing is let room by room, and its bedroom count IS its room
  // count (the create wizard derives one from the other).
  if (occupancyType === "shared") return `${bedrooms}-room shared ${noun}`;

  if (propertyType === "studio" || bedrooms === 0) return "Studio apartment";

  return `${bedrooms} bedroom ${noun}`;
}

module.exports = { deriveListingTitle };
