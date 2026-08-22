"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

// COMPONENT_ARCHITECTURE.md §3: Property Image Gallery — thumbnail strip +
// main image. Motion used only for the main-image crossfade on selection,
// a real state change (orientation/feedback), not decoration.
export function PropertyGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const photos = images.length > 0 ? images : [];

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-dense)] shadow-[var(--elevation-sm)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0"
          >
            <Image
              src={photos[active]}
              alt={alt}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
              priority={active === 0}
            />
          </motion.div>
        </AnimatePresence>
        {photos.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-[var(--color-dark-blue)]/70 px-2.5 py-1 text-xs font-bold text-white">
            {active + 1} / {photos.length}
          </span>
        )}
      </div>

      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1} of ${photos.length}`}
              aria-current={active === i}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-[var(--radius-control)] transition-opacity ${
                active === i ? "opacity-100 ring-2 ring-offset-2 ring-[var(--color-brand-primary)]" : "opacity-60 hover:opacity-90"
              }`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
