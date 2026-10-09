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
 * ENFORCEMENT is server-side: GET /listings/:id returns an anonymous caller a
 * redacted record (redactForAnonymous in nexthome-api/src/routes/listings.routes.js),
 * so the gated fields never reach this page's HTML, RSC payload or DOM — and
 * the teaser built from it carries only the public card fields.
 * Tracked in IMPLEMENTATION_NOTES.md.
 */
export function ListingDetailGate({ teaser }: { teaser: ListingTeaser }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <ListingRegistrationWall teaser={teaser} />;

  return <ListingFullDetail id={teaser.id} />;
}
