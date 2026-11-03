import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/home/Eyebrow";
import { IconArrowRight, IconCheck, IconClose } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "How verification works | NextHome",
  description:
    "How NextHome checks landlords, service providers and listings by hand before anything goes live, and what the Verified badge does and doesn't mean.",
};

// Every statement below describes what the product does today (admin review of
// trust documents and listings, listing-scoped messaging, the report form), and
// deliberately promises nothing the code does not do: no turnaround time, no
// written rejection reason, no guarantee about a listing's contents.
const STEPS = [
  {
    title: "Identity checked",
    body: [
      "Before a landlord or service provider can list anything, they confirm their phone number and email, then upload a verification document for our team to review by hand. The upload form asks for an ID or a utility bill, as a photo or scan (JPG, PNG, WebP or GIF) or a PDF up to 10 MB.",
      "Nothing is approved automatically. A person on our team opens each document and decides. Documents are stored privately and only our team can open them.",
    ],
  },
  {
    title: "Every listing reviewed",
    body: [
      "Our team checks each listing before it is first published. Nothing goes live automatically. The reviewer reads the description, looks through the photos and can see whether the landlord's account is verified, then approves or rejects the listing.",
      "Approved listings are published with a Verified badge. Rejected listings are not shown to anyone. Service listings and adverts go through the same approve-or-reject step.",
    ],
  },
  {
    title: "Messages stay on the record",
    body: [
      "Conversations about a listing stay attached to that listing, so there is a clear record if something needs sorting out later.",
    ],
    after: (
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-text-inverted-secondary)]">
        If something does go wrong, use{" "}
        <Link href="/complaints" className="font-bold text-[var(--color-brand-accent)] hover:underline">
          Report a concern
        </Link>{" "}
        and it goes to our team.
      </p>
    ),
  },
];

const MEANS = [
  "A person on our team reviewed the listing and approved it.",
  "Landlords have to be verified before they can submit a listing, and the reviewer can see whether the account is.",
];

const DOES_NOT_MEAN = [
  "That every detail in the listing is accurate.",
  "That we have visited the property.",
  "That the home is still available. Landlords update that themselves.",
];

export default function VerificationPage() {
  return (
    <div className="mx-auto w-full max-w-[var(--width-page)] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Eyebrow>Verification</Eyebrow>
        <h1 className="u-display mt-3 text-[2.25rem] text-[var(--color-text-primary)] sm:text-5xl">
          How verification works
        </h1>
        <p className="mt-4 max-w-xl text-[var(--color-text-secondary)]">
          NextHome reviews landlords, service providers and every listing before anything goes live. Here is
          what that involves.
        </p>

        <section
          aria-label="The three checks"
          className="mt-10 rounded-[var(--radius-feature)] bg-[var(--color-surface-inverted)] p-6 sm:p-10"
        >
          <ol>
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-[var(--color-border-inverted)] py-7 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[3.5rem_1fr]"
              >
                <span className="u-numeric text-sm font-bold text-[var(--color-brand-accent)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="text-xl font-bold text-white">{step.title}</h2>
                  {step.body.map((p) => (
                    <p key={p} className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-text-inverted-secondary)]">
                      {p}
                    </p>
                  ))}
                  {step.after}
                </div>
              </li>
            ))}
          </ol>
        </section>
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          Document and listing reviews happen as quickly as our team can get to them.
        </p>

        <section className="mt-14">
          <h2 className="u-heading text-2xl text-[var(--color-text-primary)] sm:text-3xl">
            What the Verified badge means (and doesn&apos;t)
          </h2>
          <p className="mt-3 max-w-xl text-[var(--color-text-secondary)]">
            The badge is a check by a person, not a guarantee. Treat it as one piece of information when you
            decide, and look at the property and agree terms in writing before you pay anyone.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)]">
              <h3 className="font-bold text-[var(--color-text-primary)]">It means</h3>
              <ul className="mt-3 flex flex-col gap-3">
                {MEANS.map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
                    <IconCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-status-verified)]" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)]">
              <h3 className="font-bold text-[var(--color-text-primary)]">It doesn&apos;t mean</h3>
              <ul className="mt-3 flex flex-col gap-3">
                {DOES_NOT_MEAN.map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
                    <IconClose aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="u-heading text-2xl text-[var(--color-text-primary)] sm:text-3xl">
            If verification is turned down
          </h2>
          <p className="mt-3 max-w-xl text-[var(--color-text-secondary)]">
            If a document isn&apos;t approved, the role goes back to &ldquo;Setup incomplete&rdquo; and the
            document is removed from your submission. Open your{" "}
            <Link href="/account" className="font-bold text-[var(--color-brand-primary)] hover:underline">
              Account page
            </Link>{" "}
            and choose Finish verification to upload a new one.
          </p>
          <p className="mt-3 max-w-xl text-[var(--color-text-secondary)]">
            At the moment a decision does not come with a written reason. If you are unsure what was wrong,{" "}
            <Link href="/feedback" className="font-bold text-[var(--color-brand-primary)] hover:underline">
              send us feedback
            </Link>
            .
          </p>
        </section>

        <div className="mt-14 border-t border-[var(--color-border-hairline)] pt-6">
          <Link
            href="/help"
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-brand-primary)] hover:underline"
          >
            Anything else is in Help &amp; FAQ
            <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-[var(--motion-duration-short)] group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
