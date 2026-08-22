import { IconHome, IconLock, IconMessageCircle, IconShield } from "@/components/ui/icons";

// TASK 4 — dark four-column feature bar, sitting directly below the search
// section.
//
// No such component existed (checked: none of these four strings appeared
// anywhere in src), so this is new rather than a restyle. It deliberately
// reuses what is already established rather than inventing a parallel
// system: the existing icon set, the `u-label`/`u-ui` type roles, the
// inverted-surface tokens used by TrustEditorial, and the same
// `--color-brand-accent` icon treatment those sections already use.
//
// Background is --color-surface-inverted, which resolves to Dark Blue
// #172A3A — the requested colour via the existing token rather than a
// hard-coded hex, so it stays in step with the rest of the palette.
const FEATURES = [
  {
    Icon: IconShield,
    title: "Verified Listings",
    body: "Every listing is reviewed for quality and authenticity.",
  },
  {
    Icon: IconHome,
    title: "Real Landlords",
    body: "Connect directly with real landlords, not middlemen.",
  },
  {
    Icon: IconMessageCircle,
    title: "All in One Place",
    body: "Message, follow up, and save listings in one dashboard.",
  },
  {
    Icon: IconLock,
    title: "Secure & Private",
    body: "Your data is safe with us. Always.",
  },
];

export function FeatureBar() {
  return (
    <section className="px-4 pb-4 pt-10 sm:px-6 sm:pt-12">
      <div className="mx-auto max-w-6xl rounded-[var(--radius-feature)] bg-[var(--color-surface-inverted)] px-6 py-8 sm:px-10 sm:py-9">
        {/* 2-up on phones rather than a single column: these are short,
            scannable claims, and stacking four of them vertically turns a
            reassurance strip into a long scroll. Dividers appear only from
            `sm`, where there is actually a column edge to divide. */}
        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-[var(--color-border-inverted)]">
          {FEATURES.map(({ Icon, title, body }) => (
            <li key={title} className="lg:px-7 lg:first:pl-0 lg:last:pr-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <Icon className="h-[18px] w-[18px] text-[var(--color-brand-accent)]" />
              </span>
              <p className="mt-4 font-bold text-white">{title}</p>
              <p className="u-ui mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-inverted-secondary)]">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
