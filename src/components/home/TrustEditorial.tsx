import Image from "next/image";
import Link from "next/link";
import { IconArrowRight } from "@/components/ui/icons";

// EDITORIAL REDESIGN — the trust story, previously three identical icon
// cards in a row, is now an asymmetric split: a tall image held to one side
// against a numbered editorial list.
//
// Three equal cards give three items equal weight and no reading order,
// which is exactly wrong for a *process* — these steps happen in sequence.
// A numbered list on hairline rules states that sequence, reads denser, and
// gives the page a third distinct section shape (after the hero split and
// the tile grid).
const STEPS = [
  {
    title: "Identity checked",
    body: "Landlords and service providers confirm phone, email and a document before they can list — surfaced as a Verified badge on every listing.",
  },
  {
    title: "Admin reviewed",
    body: "Every listing is checked by our team before it goes live. Nothing publishes automatically.",
  },
  {
    title: "On-platform record",
    body: "Messages stay tied to the listing they're about, so there's a clear record if something needs resolving.",
  },
];

export function TrustEditorial() {
  return (
    <section className="bg-[var(--color-surface-inverted)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          {/* Image is intentionally the SMALLER half here — the inverse of
              the hero, where it was the larger one. Alternating which side
              carries the weight is what keeps successive sections from
              feeling like the same layout redressed. */}
          <div className="u-clip-blade relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-feature)] bg-[var(--color-surface-inverted-raised)] sm:aspect-[16/10] lg:aspect-[4/5]">
            <Image
              src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&q=70"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover transition-transform duration-[var(--motion-duration-rich)] ease-[var(--motion-easing-warm)] hover:scale-[1.03]"
            />
          </div>

          <div>
            <p className="u-label text-[var(--color-brand-accent)]">How NextHome earns trust</p>
            <h2 className="u-heading mt-3 max-w-lg text-3xl text-white sm:text-[2.75rem]">
              Not a promise — a process, on every listing.
            </h2>

            <ol className="mt-10">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-[var(--color-border-inverted)] py-6 first:border-t-0 first:pt-0 sm:grid-cols-[3.5rem_1fr]"
                >
                  <span className="u-numeric text-sm font-bold text-[var(--color-brand-accent)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-bold text-white">{step.title}</p>
                    <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[var(--color-text-inverted-secondary)]">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <Link
              href="/help"
              className="group mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-brand-accent)] hover:underline"
            >
              How verification works
              <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-[var(--motion-duration-short)] group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
