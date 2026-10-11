"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { CONTAINER_CLASS } from "@/components/ui/Container";
import { IconArrowLeft, IconArrowRight, IconExternalLink, IconPause, IconPlay } from "@/components/ui/icons";
import type { Advertisement } from "@/lib/types";

// The homepage's ad slot: every live ad for the placement, one card at a time
// with its neighbours peeking in from either edge.
//
// What an ad stores today is an image, a headline and a link — nothing else
// (see the Advertisement model) — so that is all a card shows. Fields a richer
// ad could carry (price, location, advertiser logo) are deliberately not
// invented here; add them to the model and the submission form first.
//
// Looping: the ads are laid out three times in a row and the carousel sits in
// the middle copy, so "next" from the last ad slides on to a copy of the first.
// Once that slide has finished it jumps back to the middle copy with no
// transition — invisible, because the copies are identical.
//
// Timing: the progress bar IS the timer. It is a CSS animation, and finishing
// it advances the carousel. Pausing (button, hover, keyboard focus, hidden tab)
// pauses the animation, so the bar and the timer can never disagree.

const AUTO_ADVANCE_MS = 5000;
const SLIDE_MS = 500;
const CARD_WIDTH = 84; // % of the track; the remaining 16% is the two peeks
const GAP = 2; // % of the track
const STEP = CARD_WIDTH + GAP;
const PEEK = (100 - CARD_WIDTH) / 2;

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Sponsor";
  }
}

const subscribeReducedMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function AdCard({ ad, active, sole, onSelect }: { ad: Advertisement; active: boolean; sole: boolean; onSelect: () => void }) {
  const host = hostnameOf(ad.linkUrl);
  return (
    <div
      onClick={active ? undefined : onSelect}
      // Only the centre card is readable/interactive; a peeking card is just a
      // click target that brings it to the centre.
      inert={!active || undefined}
      aria-hidden={!active}
      className={`relative flex h-[420px] flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] shadow-[var(--elevation-sm)] transition-[opacity,transform] duration-[var(--motion-duration-rich)] md:block md:h-[360px] ${
        sole ? "" : "shrink-0"
      } ${active ? "" : "scale-[0.96] cursor-pointer opacity-50"}`}
      style={sole ? undefined : { flexBasis: `${CARD_WIDTH}%` }}
    >
      <div className="relative h-48 w-full shrink-0 md:absolute md:inset-y-0 md:right-0 md:h-full md:w-[66%]">
        <Image
          src={ad.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1280px) 1070px, 90vw"
          className="object-cover md:object-center"
        />
      </div>

      {/* Details panel: overlays the left of the image on desktop, sits under it on mobile. */}
      <div className="relative flex flex-1 flex-col justify-center gap-3 bg-[var(--color-surface-raised)] p-5 md:absolute md:inset-y-0 md:left-0 md:w-[44%] md:rounded-r-[2.5rem] md:p-8 md:pr-10">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-deep-blue)] text-sm font-bold uppercase text-white"
          >
            {host.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--color-deep-blue)]">{host}</p>
            <p className="u-label text-[10px] text-[var(--color-text-secondary)]">Advertisement</p>
          </div>
        </div>

        <h3 className="line-clamp-3 text-xl font-bold leading-snug text-[var(--color-text-primary)] md:text-2xl">
          {ad.headline}
        </h3>

        <div>
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-blue)] px-6 py-2.5 text-sm font-bold text-white transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-deep-blue)]"
          >
            Visit {host}
            <IconExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function AdCarousel({ ads }: { ads: Advertisement[] }) {
  if (ads.length === 0) return null;
  return ads.length === 1 ? <SingleAd ad={ads[0]} /> : <Carousel ads={ads} />;
}

// One ad: no controls, no rotation — there is nothing to rotate to.
function SingleAd({ ad }: { ad: Advertisement }) {
  return (
    <section className={CONTAINER_CLASS} aria-label="Sponsored">
      <AdCard ad={ad} active sole onSelect={() => {}} />
    </section>
  );
}

function Carousel({ ads }: { ads: Advertisement[] }) {
  const n = ads.length;
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);

  const [v, setV] = useState(n); // position in the tripled list; n = first ad of the middle copy
  const [animate, setAnimate] = useState(true);
  const [tick, setTick] = useState(0); // bumps on every move: restarts the progress bar
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const active = ((v % n) + n) % n;
  const playing = !userPaused && !reducedMotion; // reduced motion: never auto-advance
  const running = playing && !hovered && !focused;

  // Moves are ignored in the short moment the carousel sits outside the middle
  // copy (before it jumps back), so v can never run off the tripled list.
  const move = useCallback(
    (to: number) => {
      if (v < n || v >= 2 * n) return;
      setAnimate(true);
      setV(to);
      setTick((t) => t + 1);
    },
    [v, n],
  );

  useEffect(() => {
    if (v >= n && v < 2 * n) return;
    const t = setTimeout(() => {
      setAnimate(false);
      setV(v >= 2 * n ? v - n : v + n);
    }, SLIDE_MS + 40);
    return () => clearTimeout(t);
  }, [v, n]);

  const items = [...ads, ...ads, ...ads];

  return (
    <section
      className={CONTAINER_CLASS}
      aria-roledescription="carousel"
      aria-label="Sponsored"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Keyboard focus pauses (so a keyboard user isn't carried away mid-read);
      // a mouse click leaves focus on the button and must not freeze rotation.
      onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
      onBlur={() => setFocused(false)}
    >
      <div className="relative">
        <div className="overflow-hidden py-2">
          <div
            className="flex"
            style={{
              gap: `${GAP}%`,
              transform: `translateX(${PEEK - v * STEP}%)`,
              transition: animate ? `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)` : "none",
            }}
          >
            {items.map((ad, i) => (
              <AdCard key={`${i}-${ad.id}`} ad={ad} active={i === v} sole={false} onSelect={() => move(i)} />
            ))}
          </div>
        </div>

        {/* Overlay pinned to the centre card: progress bar along its top edge,
            pause/play in its top-right corner. Hidden under reduced motion,
            where nothing auto-advances. */}
        {!reducedMotion && (
          <div
            className="pointer-events-none absolute inset-y-2 overflow-hidden rounded-t-[var(--radius-card)]"
            style={{ left: `${PEEK}%`, width: `${CARD_WIDTH}%` }}
          >
            <div className="absolute inset-x-0 top-0 z-10 h-1 bg-white/50">
              {playing && (
                <div
                  key={tick}
                  className="h-full origin-left bg-[var(--color-blue)]"
                  style={{
                    animation: `ad-progress ${AUTO_ADVANCE_MS}ms linear forwards`,
                    animationPlayState: running ? "running" : "paused",
                  }}
                  onAnimationEnd={() => move(v + 1)}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? "Resume automatic rotation" : "Pause automatic rotation"}
              className="pointer-events-auto absolute right-3 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--color-deep-blue)] shadow-[var(--elevation-sm)] transition-colors duration-[var(--motion-duration-short)] hover:bg-white"
            >
              {userPaused ? <IconPlay className="h-4 w-4" /> : <IconPause className="h-4 w-4" />}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => move(v - 1)}
          aria-label="Previous ad"
          className="absolute left-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[var(--color-deep-blue)] shadow-[var(--elevation-sm)] transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-deep-blue)] hover:text-white md:left-0"
        >
          <IconArrowLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => move(v + 1)}
          aria-label="Next ad"
          className="absolute right-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[var(--color-deep-blue)] shadow-[var(--elevation-sm)] transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-deep-blue)] hover:text-white md:right-0"
        >
          <IconArrowRight className="h-5 w-5" />
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        Ad {active + 1} of {n}
      </p>
    </section>
  );
}
