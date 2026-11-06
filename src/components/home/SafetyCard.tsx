import Link from "next/link";
import {
  IconArrowRight,
  IconClipboardCheck,
  IconIdCard,
  IconMessageCircle,
  IconShieldCheck,
} from "@/components/ui/icons";
import { Container } from "@/components/ui/Container";
import { Reveal } from "./Reveal";

// The homepage's verification section, kept deliberately small: what is
// checked in three words each, one honest disclaimer, and the way to the full
// explanation (/verification). The long version used to live here and now
// lives only on that page, so the two cannot drift apart.
const POINTS = [
  { label: "Identity checks", Icon: IconIdCard },
  { label: "Listing reviews", Icon: IconClipboardCheck },
  { label: "Message records", Icon: IconMessageCircle },
] as const;

export function SafetyCard() {
  return (
    <section id="how-it-works" className="bg-[var(--color-surface-raised)] py-12 md:py-16">
      <Container>
        <Reveal>
          <div className="mx-auto max-w-3xl rounded-[var(--radius-feature)] bg-[var(--color-surface-inverted)] p-6 text-center sm:p-10">
            <span
              aria-hidden
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-inverted-raised)] text-[var(--color-brand-accent)]"
            >
              <IconShieldCheck className="h-6 w-6" />
            </span>
            <h2 className="u-heading mt-4 text-2xl text-white sm:text-3xl">Your Safety Matters</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-text-inverted-secondary)] sm:text-base">
              We review account information and property listings before publication to help you search with
              greater confidence.
            </p>

            <ul className="mt-7 grid grid-cols-3 gap-2 sm:gap-4">
              {POINTS.map(({ label, Icon }) => (
                <li
                  key={label}
                  className="flex flex-col items-center gap-2.5 rounded-2xl border border-[var(--color-border-inverted)] px-2 py-4 sm:px-4"
                >
                  <Icon className="h-6 w-6 text-[var(--color-brand-accent)]" />
                  <span className="text-xs font-bold leading-tight text-white sm:text-sm">{label}</span>
                </li>
              ))}
            </ul>

            <p className="mx-auto mt-6 max-w-xl text-xs leading-relaxed text-[var(--color-text-inverted-secondary)]">
              Review and approval do not guarantee that every listing detail is accurate or that a property has
              been physically inspected.
            </p>

            <Link
              href="/verification"
              className="group mt-6 inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-off-white)] px-5 py-3 text-sm font-bold text-[var(--color-dark-blue)] transition-colors duration-[var(--motion-duration-short)] hover:bg-white"
            >
              How Verification Works
              <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-[var(--motion-duration-short)] group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
