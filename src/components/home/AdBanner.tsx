import Image from "next/image";
import { CONTAINER_CLASS } from "@/components/ui/Container";
import { Advertisement } from "@/lib/types";

// The homepage's one ad slot — the "advertiser" role has always been able
// to submit a creative and have an admin approve it (dashboard/ads/new,
// admin.routes.js), but nothing on the site ever actually displayed an
// approved ad to a visitor: no placement was ever assigned on approval, and
// no component anywhere called apiSearchAds. This is that missing half —
// deliberately just one slot for one placement ("homepage-banner", assigned
// automatically on approval — see admin.routes.js), not a general ad-slot
// system, since that is the only placement that exists today.
//
// Renders nothing at all if there is no live ad for this placement, rather
// than an empty card — an ad slot with nothing in it is dead space, not a
// feature.
export function AdBanner({ ad }: { ad: Advertisement | null }) {
  if (!ad) return null;

  return (
    <div className={CONTAINER_CLASS}>
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group relative flex overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] shadow-[var(--elevation-xs)] transition-shadow duration-[var(--motion-duration-short)] hover:shadow-[var(--elevation-sm)]"
      >
        {/* `sponsored` above, plus this label — an ad that isn't legible as
            an ad erodes the same trust the rest of the site is built on. */}
        <span className="u-label absolute left-3 top-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[10px] text-white backdrop-blur-sm">
          Advertisement
        </span>
        <div className="relative aspect-[21/9] w-full sm:aspect-[3/1]">
          <Image
            src={ad.imageUrl}
            alt={ad.headline}
            fill
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="object-cover transition-transform duration-[var(--motion-duration-short)] group-hover:scale-[1.02]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 sm:px-6 sm:py-4">
            <p className="font-bold text-white sm:text-lg">{ad.headline}</p>
          </div>
        </div>
      </a>
    </div>
  );
}
