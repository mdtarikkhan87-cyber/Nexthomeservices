import Image from "next/image";
import Link from "next/link";
import { IconArrowRight, IconClock, IconShield } from "@/components/ui/icons";
import { Container } from "@/components/ui/Container";
import { browseFacets } from "@/lib/browse-facets";
import type { PropertyListing } from "@/lib/types";
import { Eyebrow } from "./Eyebrow";
import { Reveal } from "./Reveal";

// "Browse by": the states that actually have rentals, as photo cards, plus the
// two stay-length facets as quiet pills. The facets are computed by lib/browse-facets from
// the homepage's single server-side fetch (see page.tsx): every listing passed
// in is already "live".
export function FacetGrid({ listings }: { listings: PropertyListing[] }) {
  const { states, durations } = browseFacets(listings);

  return (
    <section id="browse-by" className="bg-[var(--color-surface-base)] pb-20 pt-14 md:pb-24 md:pt-16 lg:pb-28 lg:pt-20">
      <Container>
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Browse by</Eyebrow>
              <h2 className="u-heading mt-3 text-3xl text-[var(--color-text-primary)] sm:text-4xl">
                Where you&rsquo;re looking
              </h2>
            </div>
            <Link
              href="/listings?mode=rent"
              className="group u-ui inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-[var(--color-brand-primary-text)] hover:underline"
            >
              All rentals
              <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* 2-up on phones, 4-up from `lg`. The photo is decorative (the
              card's text is its name), hence the empty alt. */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {states.map(({ key, label, count, photoUrl, href }) => (
              <Link
                key={key}
                href={href}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-[var(--color-surface-dense)] shadow-[var(--elevation-card)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[var(--elevation-card-hover)]"
              >
                {photoUrl && (
                  <Image
                    src={photoUrl}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, color-mix(in srgb, var(--color-dark-blue) 80%, transparent) 0%, color-mix(in srgb, var(--color-dark-blue) 25%, transparent) 45%, transparent 70%)",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <p className="text-lg font-bold leading-tight text-white sm:text-xl">{label}</p>
                  <p className="u-numeric mt-1 text-sm text-white/85">
                    {count} home{count !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Stay length and the buy route: quiet pills rather than a second
              card grid, so the band stays one idea. */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {durations.map(({ key, label, count, href }) => (
              <Link
                key={key}
                href={href}
                className="u-ui inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--color-surface-raised)] px-5 text-sm font-bold text-[var(--color-text-primary)] shadow-[var(--elevation-card)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--elevation-card-hover)]"
              >
                <IconClock className="h-4 w-4 text-[var(--color-brand-primary)]" />
                {label}
                <span className="u-numeric font-medium text-[var(--color-text-body)]">
                  {count} home{count !== 1 ? "s" : ""}
                </span>
              </Link>
            ))}
            <Link
              href="/listings?mode=sale"
              className="u-ui inline-flex min-h-11 items-center px-2 text-sm font-bold text-[var(--color-brand-primary-text)] hover:underline"
            >
              Looking to buy instead?
            </Link>
          </div>

          <p className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--color-text-body)]">
            <IconShield className="h-4 w-4 text-[var(--color-brand-primary)]" />
            Every listing reviewed before it goes live
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
