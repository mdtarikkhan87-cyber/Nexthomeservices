"use client";

import Image from "next/image";
import { KeyboardEvent, useState } from "react";
import { IconArrowLeft, IconArrowRight } from "@/components/ui/icons";

export interface CarouselPhoto {
  url: string;
  /** A dead dev-mode URL (e.g. "/dev-fake-file/…") — shown as an
      "Image unavailable" tile without ever being requested. */
  isPlaceholder?: boolean;
}

// One photo at a time, with previous/next arrows — shared by the admin review
// dialog and the tenant listing page so both behave the same.
//
// A plain <img> by default: it can't crash on an unconfigured host the way
// next/image can, and a failed load is catchable with onError. `optimized`
// switches to next/image (resized by Next) for the public page, where the
// originals can be several MB each — callers must filter out placeholder URLs
// first, since next/image refuses hosts missing from next.config.ts.
//
// No animation on purpose: the photo simply swaps, so reduced-motion
// preferences are respected without any extra code.

const ARROW_BUTTON =
  "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[var(--color-deep-blue)] shadow-[var(--elevation-sm)] transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-deep-blue)] hover:text-white";

const FRAME =
  "relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-dense)] shadow-[var(--elevation-sm)]";

const NOT_FAILED: ReadonlySet<string> = new Set();

export function PhotoCarousel({
  photos,
  alt,
  fit = "contain",
  optimized = false,
  sizes = "(max-width: 1024px) 100vw, 66vw",
}: {
  photos: CarouselPhoto[];
  /** What the photos show, e.g. the listing title. Each slide's own alt
      becomes "<alt> — photo 2 of 5". */
  alt: string;
  /** "contain" shows the whole photo (admin review); "cover" fills the frame
      and may crop (public page, matching how photos were shown before). */
  fit?: "contain" | "cover";
  optimized?: boolean;
  /** next/image `sizes` hint — only used when `optimized`. */
  sizes?: string;
}) {
  // Drop empty URLs (an anonymous gallery has blanked entries) and repeats —
  // the same picture twice in a row would look like a stuck button.
  const slides = photos.filter((p, i) => p.url && photos.findIndex((q) => q.url === p.url) === i);
  const total = slides.length;

  // Resets to the first photo (and forgets which ones failed) whenever a
  // different set of photos is passed in, i.e. a different property is opened.
  // Done as a render-time state adjustment, the pattern React documents for
  // "reset state when a prop changes".
  const signature = slides.map((p) => p.url).join("|");
  const [state, setState] = useState<{ signature: string; index: number; failed: ReadonlySet<string> }>({
    signature,
    index: 0,
    failed: NOT_FAILED,
  });
  if (state.signature !== signature) {
    setState({ signature, index: 0, failed: NOT_FAILED });
  }
  const current = state.signature === signature ? state : { signature, index: 0, failed: NOT_FAILED };

  if (total === 0) {
    return (
      <div
        className={`${FRAME} flex items-center justify-center text-sm font-semibold text-[var(--color-text-secondary)]`}
        role="img"
        aria-label={`No photo available for ${alt}`}
      >
        No photo available
      </div>
    );
  }

  const go = (delta: number) =>
    setState({ ...current, index: (current.index + delta + total) % total });

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    }
    // Everything else (notably Escape, which closes the admin dialog) is left
    // alone so it keeps bubbling.
  };

  const photo = slides[current.index];
  const unavailable = photo.isPlaceholder || current.failed.has(photo.url);
  const next = total > 1 ? slides[(current.index + 1) % total] : null;
  const preloadNext = next !== null && !next.isPlaceholder && !current.failed.has(next.url);
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";
  const slideAlt = total > 1 ? `${alt} — photo ${current.index + 1} of ${total}` : alt;

  const markFailed = (url: string) =>
    setState({ ...current, failed: new Set(current.failed).add(url) });

  const renderImage = (p: CarouselPhoto, props: { alt: string; hidden?: boolean }) =>
    optimized ? (
      <Image
        src={p.url}
        alt={props.alt}
        fill
        sizes={sizes}
        loading="eager"
        className={props.hidden ? "hidden" : fitClass}
        onError={props.hidden ? undefined : () => markFailed(p.url)}
        aria-hidden={props.hidden || undefined}
      />
    ) : (
      // Admin photos come from public S3 URLs and may be dead dev-mode ones —
      // not something next/image can optimize or safely load.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={p.url}
        alt={props.alt}
        loading="eager"
        decoding="async"
        draggable={false}
        className={props.hidden ? "hidden" : `absolute inset-0 h-full w-full ${fitClass}`}
        onError={props.hidden ? undefined : () => markFailed(p.url)}
        aria-hidden={props.hidden || undefined}
      />
    );

  return (
    <div
      className={FRAME}
      role="group"
      aria-roledescription={total > 1 ? "carousel" : undefined}
      aria-label={total > 1 ? `${alt} photos` : undefined}
      onKeyDown={total > 1 ? onKeyDown : undefined}
    >
      {unavailable ? (
        <div
          className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-[var(--color-text-secondary)]"
          role="img"
          aria-label={`Image unavailable — ${slideAlt}`}
        >
          Image unavailable
        </div>
      ) : (
        // Keyed by URL so moving to another photo never reuses the previous
        // <img> element (and its already-loaded bitmap) for a new source.
        <div key={photo.url} className="absolute inset-0">
          {renderImage(photo, { alt: slideAlt })}
        </div>
      )}

      {/* Only the NEXT photo is fetched ahead, hidden; every other slide is
          not in the page at all until it is reached. */}
      {preloadNext && next && (
        <div key={`preload-${next.url}`} aria-hidden className="hidden">
          {renderImage(next, { alt: "", hidden: true })}
        </div>
      )}

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className={`${ARROW_BUTTON} left-3`}
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className={`${ARROW_BUTTON} right-3`}
          >
            <IconArrowRight className="h-5 w-5" />
          </button>

          {/* The visible badge is hidden from screen readers; the polite live
              region below announces the change once instead. */}
          <span
            aria-hidden
            className="absolute bottom-3 right-3 rounded-full bg-[var(--color-dark-blue)]/70 px-2.5 py-1 text-xs font-bold text-white"
          >
            {current.index + 1} / {total}
          </span>
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            Photo {current.index + 1} of {total}
          </span>
        </>
      )}
    </div>
  );
}
