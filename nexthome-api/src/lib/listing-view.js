// Shapes a Listing for LIST responses (search, "my listings", saved).
//
// A card only ever shows the cover photo (`photoUrl`), so the full
// `galleryUrls` array is replaced by a count. The complete gallery is still
// returned by GET /listings/:id, which is where it's actually displayed.
// When galleries were inline base64 this was the difference between a 9 MB
// and a few-KB list response; with S3 URLs it's still the right shape.
function toListItem(listing) {
  const { galleryUrls, ...rest } = listing;
  return { ...rest, galleryCount: Math.max(galleryUrls ? galleryUrls.length : 0, 1) };
}

module.exports = { toListItem };
