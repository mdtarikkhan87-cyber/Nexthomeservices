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
        <section id="how-it-works" className="bg-[var(--color-surface-raised)] py-6 md:py-6">
      <Container>
        <Reveal>
          <div className="rounded-[var(--radius-feature)] border border-[var(--color-border-hairline)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-light-blue)_24%,var(--color-surface-raised))_0%,var(--color-surface-raised)_70%)] p-6 text-center shadow-[var(--elevation-xs)] sm:p-10 lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-x-16 lg:p-14 lg:text-left">
            <span
              aria-hidden
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full lg:col-start-1 lg:mx-0 bg-[color-mix(in_srgb,var(--color-light-blue)_32%,var(--color-surface-raised))] text-[var(--color-brand-primary)]"
            >
              <IconShieldCheck className="h-6 w-6" />
            </span>
            <h2 className="u-heading mt-4 text-2xl text-[var(--color-text-primary)] sm:text-3xl lg:col-start-1 lg:text-4xl">Your Safety Matters</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-text-body)] sm:text-base lg:col-start-1 lg:mx-0 lg:text-lg">
              We review account information and property listings before publication to help you search with
              greater confidence.
            </p>

            <ul className="mt-7 grid grid-cols-3 gap-2 sm:gap-4 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:mt-0 lg:gap-4">
              {POINTS.map(({ label, Icon }) => (
                <li
                  key={label}
                  className="flex flex-col items-center gap-2.5 rounded-2xl bg-[color-mix(in_srgb,var(--color-light-blue)_16%,var(--color-surface-raised))] px-2 py-4 sm:px-4 lg:gap-4 lg:px-3 lg:py-11 lg:text-center"
                >
                  <Icon className="h-6 w-6 text-[var(--color-brand-primary)] lg:h-10 lg:w-10" />
                  <span className="text-xs font-bold leading-tight text-[var(--color-text-primary)] sm:text-sm lg:text-base">{label}</span>
                </li>
              ))}
            </ul>

            <p className="mx-auto mt-6 max-w-xl text-xs leading-relaxed text-[var(--color-text-body)] lg:col-start-1 lg:mx-0 lg:text-[13px]">
              Review and approval do not guarantee that every listing detail is accurate or that a property has
              been physically inspected.
            </p>

            <Link
              href="/verification"
              className="group mt-6 inline-flex items-center gap-2 lg:col-start-1 lg:justify-self-start rounded-[var(--radius-control)] bg-[var(--color-dark-blue)] px-5 py-3 text-sm font-bold text-white transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-deep-blue)]"
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
