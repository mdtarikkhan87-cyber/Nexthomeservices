import Image from "next/image";
import Link from "next/link";
import { IconArrowRight } from "@/components/ui/icons";
import { mockServices } from "@/lib/mock-data";

// EDITORIAL REDESIGN — the widest, most immersive block on the page.
//
// Section scale is a design tool: hero (contained split) → tiles (dense) →
// listings (contained grid) → trust (inverted split) → this (near full
// bleed). Ending the sequence on the widest element gives the page a clear
// crescendo instead of eight equally-sized slabs.
//
// Category chips are the real ServiceListing categories from the catalog and
// each links into the live /services directory, so nothing here is a
// decorative label.
export function ServicesBand() {
  const categories = Array.from(new Set(mockServices.map((s) => s.category)));

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="u-clip-corner relative mx-auto max-w-[88rem] overflow-hidden rounded-[var(--radius-feature)]">
        <div className="relative min-h-[26rem] w-full sm:min-h-[30rem]">
          <Image
            src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1800&q=70"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          {/* Horizontal scrim — the text sits left, so the gradient runs
              left-to-right rather than bottom-up. Dark Blue only. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(94deg, color-mix(in srgb, var(--color-dark-blue) 93%, transparent) 0%, color-mix(in srgb, var(--color-dark-blue) 72%, transparent) 46%, color-mix(in srgb, var(--color-dark-blue) 22%, transparent) 78%, transparent 100%)",
            }}
          />

          <div className="relative flex min-h-[26rem] flex-col justify-center p-7 sm:min-h-[30rem] sm:p-12 lg:p-16">
            <div className="max-w-lg">
              <p className="u-label text-[var(--color-brand-accent)]">Services</p>
              <h2 className="u-heading mt-3 text-3xl text-white sm:text-[2.75rem]">
                A home is more than the keys.
              </h2>
              <p className="mt-4 max-w-md text-[var(--color-off-white)]/85">
                Verified electricians, plumbers and other trades — the people you need once you&rsquo;ve
                moved in, checked the same way our landlords are.
              </p>

              <ul className="mt-7 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <li key={c}>
                    <Link
                      href="/services"
                      className="u-ui inline-block rounded-full border border-white/25 px-3.5 py-1.5 text-[13px] font-semibold text-white transition-colors duration-[var(--motion-duration-short)] hover:border-white/60 hover:bg-white/10"
                    >
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                href="/services"
                className="group mt-8 inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-off-white)] px-5 py-3 text-sm font-bold text-[var(--color-dark-blue)] transition-colors duration-[var(--motion-duration-short)] hover:bg-white"
              >
                Browse all services
                <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-[var(--motion-duration-short)] group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
