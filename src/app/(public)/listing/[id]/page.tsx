import { notFound } from "next/navigation";
import { ListingDetailGate } from "@/components/property/ListingDetailGate";
import { mockListings } from "@/lib/mock-data";
import { ListingTeaser } from "@/lib/types";

// Next.js 16: params is a Promise — must be awaited (breaking change from
// the training-data-era synchronous API).
//
// REVISION (Website Revision Spec §3B): this page used to render the full
// property detail to anyone. It now resolves the listing, reduces it to its
// PUBLIC TEASER, and hands only that across the client boundary.
//
// Why the reduction happens here, on the server, and not inside the gate:
// props passed to a client component are serialised into the RSC payload
// embedded in the HTML. Passing the whole listing and merely *rendering* less
// of it would have left the description, specification and amenity list
// sitting in the page source of every anonymous request — gated in appearance
// only. Building the teaser here is what makes the gate real.
//
// The route itself still exists and still resolves, so shared links and
// bookmarks land on a real property rather than a 404.
export default async function ListingDetailPage({ params }: PageProps<"/listing/[id]">) {
  const { id } = await params;
  const listing = mockListings.find((l) => l.id === id);

  if (!listing) notFound();

  const teaser: ListingTeaser = {
    id: listing.id,
    type: listing.type,
    title: listing.title,
    price: listing.price,
    currency: listing.currency,
    state: listing.state,
    bedrooms: listing.bedrooms,
    photoUrl: listing.photoUrl,
    verified: listing.verified,
    viewCount: listing.viewCount,
    rentDuration: listing.rentDuration,
    galleryCount: listing.galleryUrls?.length ?? 1,
  };

  return <ListingDetailGate teaser={teaser} />;
}
