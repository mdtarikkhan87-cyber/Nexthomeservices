"use client";

import { useAuth } from "@/lib/auth-context";
import { ListingFullDetail } from "@/components/property/ListingFullDetail";
import { ListingRegistrationWall } from "@/components/property/ListingRegistrationWall";
import { ListingTeaser } from "@/lib/types";

/**
 * Decides which of the two property detail experiences a visitor gets.
 *
 * Website Revision Spec §3B: anonymous visitors "cannot open a full property
 * detail page". This is where that rule is enforced, in exactly one place, so
 * the two views cannot drift apart and no route can accidentally bypass it.
 *
 * It receives ONLY the public teaser (see lib/types.ts `ListingTeaser`). The
 * full record is looked up by id inside ListingFullDetail, which is rendered
 * exclusively for a signed-in user — so the gated fields never reach an
 * anonymous visitor's HTML, RSC payload, or DOM.
 *
 * HONEST LIMIT: with no backend, the mock catalog is bundled into the client
 * JS that every visitor downloads (lib/mock-data is already imported by the
 * public listings browser, so this changes nothing about that). A real
 * implementation enforces this server-side by not returning gated fields to an
 * unauthenticated request at all. This component boundary is the correct shape
 * for that swap — the wall consumes a teaser, the full view consumes an id —
 * but the enforcement is client-side until there is a server to enforce it.
 * Tracked in IMPLEMENTATION_NOTES.md.
 */
export function ListingDetailGate({ teaser }: { teaser: ListingTeaser }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <ListingRegistrationWall teaser={teaser} />;

  return <ListingFullDetail id={teaser.id} />;
}
