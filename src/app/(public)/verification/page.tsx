import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode, SVGProps } from "react";
import { Eyebrow } from "@/components/home/Eyebrow";
import {
  IconCheck,
  IconClipboardCheck,
  IconClose,
  IconHelp,
  IconInfo,
  IconMessageCircle,
  IconShieldCheck,
  IconUser,
  IconXCircle,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "How Verification Works | NextHome",
  description:
    "How NextHome reviews landlords, service providers and listings before they go live, and what the Verified badge does and does not mean.",
};

// The copy on this page is supplied by the client and is used as given. The
// structure around it (numbered sections, the light-blue "what you need to do"
// boxes, the two-column badge lists) follows the client's mockup.

const BUTTON =
  "inline-flex items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand-primary)] px-5 py-2.5 text-base font-bold text-white shadow-[var(--elevation-xs)] transition-[background-color,box-shadow] duration-[var(--motion-duration-short)] hover:bg-[var(--color-brand-primary-hover)] hover:shadow-[var(--elevation-sm)]";
const BUTTON_OUTLINE =
  "inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-deep-blue)] px-5 py-2.5 text-base font-bold text-[var(--color-deep-blue)] transition-colors duration-[var(--motion-duration-short)] hover:bg-[var(--color-surface-dense)]";

function Section({
  n,
  title,
  Icon,
  children,
}: {
  n: number;
  title: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`step-${n}`}
      className="rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)] sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="u-numeric flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-sm font-bold text-white"
        >
          {n}
        </span>
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-dense)] text-[var(--color-brand-primary-text)]"
        >
          <Icon className="h-5 w-5" />
        </span>
        <h2 id={`step-${n}`} className="u-heading text-xl text-[var(--color-text-primary)] sm:text-2xl">
          {title}
        </h2>
      </div>
      <div className="mt-5 flex flex-col gap-4 text-[var(--color-text-secondary)]">{children}</div>
    </section>
  );
}

type IconType = (props: SVGProps<SVGSVGElement>) => ReactNode;

/** A section heading with its icon in a tile, used below the three numbered cards. */
function IconHeading({ id, Icon, children }: { id: string; Icon: IconType; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-dense)] text-[var(--color-brand-primary-text)]"
      >
        <Icon className="h-5 w-5" />
      </span>
      <h2 id={id} className="u-heading text-2xl text-[var(--color-text-primary)] sm:text-3xl">
        {children}
      </h2>
    </div>
  );
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-2 font-bold text-[var(--color-text-primary)]">{children}</h3>;
}

/** The light-blue box: a short lead-in and numbered steps. */
function StepsBox({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-2xl bg-[color-mix(in_srgb,var(--color-light-blue)_16%,var(--color-surface-raised))] p-4 sm:p-5">
      <p className="font-bold text-[var(--color-text-primary)]">{title}</p>
      <ol className="mt-3 flex flex-col gap-2.5">
        {steps.map((step, i) => (
          <li key={step} className="flex items-start gap-3 text-[var(--color-text-secondary)]">
            <span
              aria-hidden
              className="u-numeric mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-xs font-bold text-[var(--color-brand-primary-text)]"
            >
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ListCard({ title, items, tone }: { title: string; items: string[]; tone: "yes" | "no" }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--elevation-xs)]">
      <h3 className="font-bold text-[var(--color-text-primary)]">{title}</h3>
      <ul className="mt-3 flex flex-col gap-3">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
            {tone === "yes" ? (
              <IconCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-status-verified)]" />
            ) : (
              <IconClose aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
            )}
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <div className="mx-auto w-full max-w-[var(--width-page)] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Eyebrow>Verification</Eyebrow>
        <h1 className="u-display mt-3 text-[2.25rem] text-[var(--color-text-primary)] sm:text-5xl">
          How Verification Works
        </h1>
        <p className="mt-4 max-w-xl text-lg text-[var(--color-text-primary)]">
          At NextHome, we review landlords, service providers and listings before they go live.
        </p>
        <p className="mt-3 max-w-xl text-[var(--color-text-secondary)]">
          Our verification process helps users make more informed decisions when searching for properties or
          local services.
        </p>

        <div className="mt-10 flex flex-col gap-6">
          <Section n={1} title="Identity Checks" Icon={IconUser}>
            <p>
              Before landlords and service providers can publish listings, they must verify their contact details
              and submit a document for review.
            </p>
            <StepsBox
              title="Here's what you need to do:"
              steps={[
                "Confirm your phone number and email address.",
                "Upload an identification document or utility bill.",
                "Wait for our team to review your submission.",
              ]}
            />
            <H3>Accepted document formats</H3>
            <p>
              You can upload a clear photo or scanned copy in JPG, PNG, WebP or GIF format, or a PDF file. The
              maximum file size is 10 MB.
            </p>
            <H3>How we review your documents</H3>
            <p>
              Every document is reviewed by a member of our team. Verification is not approved automatically.
            </p>
            <p>
              Your submitted documents are stored privately and can only be accessed by authorised NextHome team
              members.
            </p>
          </Section>

          <Section n={2} title="Listing Reviews" Icon={IconClipboardCheck}>
            <p>Every listing is reviewed by our team before it is published.</p>
            <p>
              We check the listing description and photographs and confirm the relevant account&apos;s
              verification status before deciding whether to approve or reject the listing.
            </p>
            <H3>What happens next?</H3>
            <ul className="flex flex-col gap-2">
              <li className="flex items-start gap-2.5">
                <IconCheck aria-hidden className="mt-1 h-4 w-4 shrink-0 text-[var(--color-status-verified)]" />
                <span>
                  <strong className="text-[var(--color-text-primary)]">Approved:</strong> Your listing is published
                  on NextHome with a Verified badge.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <IconClose aria-hidden className="mt-1 h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
                <span>
                  <strong className="text-[var(--color-text-primary)]">Rejected:</strong> Your listing will not be
                  published or displayed to visitors.
                </span>
              </li>
            </ul>
            <p>Property listings, service listings and advertisements all go through this approval process.</p>
          </Section>

          <Section n={3} title="Message Records" Icon={IconMessageCircle}>
            <p>Messages about a property or service listing are kept together with that listing.</p>
            <p>
              This helps maintain a record of conversations in case a concern or disagreement arises later.
            </p>
            <H3>Need to report a problem?</H3>
            <p>Use Report a Concern to notify the NextHome team.</p>
            <div>
              <Link href="/complaints" className={BUTTON}>
                Report a Concern
              </Link>
            </div>
          </Section>
        </div>

        <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
          Our team reviews verification documents and listings as quickly as possible. Review times may vary.
        </p>

        <section className="mt-14" aria-labelledby="badge">
          <IconHeading id="badge" Icon={IconShieldCheck}>
            What Does the Verified Badge Mean?
          </IconHeading>
          <p className="mt-3 max-w-xl text-[var(--color-text-primary)]">
            A Verified badge means that a listing has been reviewed and approved by the NextHome team.
          </p>
          <p className="mt-2 max-w-xl text-[var(--color-text-secondary)]">
            However, verification does not guarantee that every detail in a listing is correct.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <ListCard
              title="What the badge confirms"
              tone="yes"
              items={[
                "A member of our team has reviewed and approved the listing.",
                "Landlords must complete account verification before submitting property listings.",
                "Our reviewers can check the landlord's verification status during the listing review.",
              ]}
            />
            <ListCard
              title="What the badge does not guarantee"
              tone="no"
              items={[
                "That every detail provided in the listing is accurate.",
                "That a NextHome representative has physically inspected the property.",
                "That the property is still available. Landlords are responsible for updating availability.",
              ]}
            />
          </div>

          <div className="mt-6 rounded-2xl bg-[color-mix(in_srgb,var(--color-light-blue)_16%,var(--color-surface-raised))] p-4 sm:p-5">
            <h3 className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]">
              <IconInfo aria-hidden className="h-5 w-5 shrink-0 text-[var(--color-brand-primary-text)]" />
              Before making any payment
            </h3>
            <p className="mt-1.5 text-[var(--color-text-secondary)]">
              We recommend viewing the property and ensuring that all agreed terms are confirmed in writing before
              making any payment.
            </p>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="rejected">
          <IconHeading id="rejected" Icon={IconXCircle}>
            What Happens if Your Verification Is Rejected?
          </IconHeading>
          <p className="mt-3 max-w-xl text-[var(--color-text-secondary)]">
            If your verification document is not approved, your account status will return to Setup Incomplete,
            and the rejected document will be removed from your submission.
          </p>
          <div className="mt-5 max-w-xl">
            <StepsBox
              title="To submit a new document:"
              steps={["Go to your Account page.", "Select Finish Verification.", "Upload a new document for review."]}
            />
          </div>
          <p className="mt-5 max-w-xl text-[var(--color-text-secondary)]">
            Please note that verification decisions do not currently include a written explanation.
          </p>
          <p className="mt-2 max-w-xl text-[var(--color-text-secondary)]">
            If you need clarification or assistance, you can contact our team using Send Feedback.
          </p>
          <div className="mt-4">
            <Link href="/feedback" className={BUTTON_OUTLINE}>
              Send Feedback
            </Link>
          </div>
        </section>

        <section className="mt-14 border-t border-[var(--color-border-hairline)] pt-8" aria-labelledby="more-help">
          <IconHeading id="more-help" Icon={IconHelp}>
            Need More Help?
          </IconHeading>
          <p className="mt-3 max-w-xl text-[var(--color-text-secondary)]">
            Visit our Help &amp; FAQ page for answers to other questions about using NextHome.
          </p>
          <div className="mt-4">
            <Link href="/help" className={BUTTON_OUTLINE}>
              Help &amp; FAQ
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
