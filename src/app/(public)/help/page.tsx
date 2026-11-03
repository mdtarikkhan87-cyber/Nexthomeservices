import type { ReactNode } from "react";
import Link from "next/link";

// Every answer here describes what the product does today. Where a feature
// does not exist yet (online payment, account deletion, deleting a listing),
// the answer says so rather than implying it does.

const LINK = "font-bold text-[var(--color-brand-primary)] hover:underline";

type Section = { id: string; title: string; items: { q: string; a: ReactNode }[] };

const SECTIONS: Section[] = [
  {
    id: "getting-started",
    title: "Getting started",
    items: [
      {
        q: "How do I register?",
        a: "Choose your role (Landlord, Renter / Buyer, Service Provider or Advertiser) and follow the short verification steps for that role.",
      },
      {
        q: "Can I have more than one role?",
        a: "Yes. One account can be a renter and a landlord at the same time, and you can add more roles later from your Account page. Once you hold more than one, use Switch role in the account menu to move between them.",
      },
    ],
  },
  {
    id: "verification",
    title: "Verification and trust",
    items: [
      {
        q: "How do I verify my account?",
        a: "Landlords and service providers confirm their phone and email, and upload a verification document for review. Tenants, buyers and advertisers only confirm phone and email.",
      },
      {
        q: "What does the Verified badge mean?",
        a: (
          <>
            On a listing, the Verified badge means a person on our team reviewed it and approved it. It is not a
            guarantee about the property itself.{" "}
            <Link href="/verification" className={LINK}>
              How verification works
            </Link>{" "}
            explains the full process.
          </>
        ),
      },
    ],
  },
  {
    id: "browsing",
    title: "Browsing and saving homes",
    items: [
      {
        q: "How do I search for a home?",
        a: "Use the Rent/Buy toggle and filter by state, price and bedrooms. You don't need an account to browse.",
      },
      {
        q: "Can I save homes to look at later?",
        a: "Yes. Use the save button on a listing and it is added to Saved Homes in your account. You need to be logged in to save. If a landlord marks a home as rented or sold, it stays in your list with that status shown. If a landlord unpublishes a listing, it disappears from your list while it is hidden and comes back if they publish it again.",
      },
    ],
  },
  {
    id: "messaging",
    title: "Messaging",
    items: [
      {
        q: "How do I contact a landlord or service provider?",
        a: "Once you are registered, message them from their listing or service page. Messages stay attached to that listing, so there is a clear record if anything needs sorting out later.",
      },
      {
        q: "Why can't I see full contact details before registering?",
        a: "Anyone can browse. Full details and messaging are for registered members, so every message is tied to an account and stays attached to the listing it is about.",
      },
    ],
  },
  {
    id: "listing",
    title: "Listing a property",
    items: [
      {
        q: "How do I post a listing?",
        a: "Complete verification, subscribe (landlords), then fill in your property details for admin review.",
      },
      {
        q: "Can I edit or take a listing down after it's posted?",
        a: "Open the listing from your Landlord dashboard. You can edit the description, price and number of bedrooms, mark it as rented or sold (and back to available), or unpublish it to hide it from search. You can publish it again at any time. For shared properties you can also mark individual rooms as occupied or available. There is no option to delete a listing yet.",
      },
    ],
  },
  {
    id: "advertising",
    title: "Advertising",
    items: [
      {
        q: "How do I advertise on NextHome?",
        a: "Submit your ad from your Advertiser dashboard. Our team reviews every ad and decides where it appears, and the ad goes live once it is approved. Online payment isn't available yet.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    items: [
      {
        q: "How do I subscribe?",
        a: "Online payment isn't available yet. Landlord subscriptions are currently activated by our team.",
      },
    ],
  },
  {
    id: "safety",
    title: "Staying safe",
    items: [
      {
        q: "What should I watch out for when renting or buying?",
        a: (
          <>
            Always view a property in person before paying anything. Never send money before signing an
            agreement. Keep conversations in NextHome messaging rather than moving to a personal number straight
            away, so there is a record if something goes wrong. If anything feels off, use{" "}
            <Link href="/complaints" className={LINK}>
              Report a concern
            </Link>
            .
          </>
        ),
      },
    ],
  },
  {
    id: "account",
    title: "Your account",
    items: [
      {
        q: "Can I delete my account?",
        a: (
          <>
            There is no self-serve account deletion yet.{" "}
            <Link href="/feedback" className={LINK}>
              Send feedback
            </Link>{" "}
            and we will help.
          </>
        ),
      },
    ],
  },
  {
    id: "reporting",
    title: "Problems and reporting",
    items: [
      {
        q: "Something's wrong with a listing or a user. What do I do?",
        a: (
          <>
            Use{" "}
            <Link href="/complaints" className={LINK}>
              Report a concern
            </Link>{" "}
            with the listing title or the user&apos;s name, and our team will look into it.
          </>
        ),
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">Help &amp; FAQ</h1>

      <nav aria-label="Help topics" className="mt-6 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-3.5 py-1.5 text-sm font-bold text-[var(--color-text-secondary)] transition-colors duration-200 hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]"
          >
            {s.title}
          </a>
        ))}
      </nav>

      <div className="mt-10 flex flex-col gap-10">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-h`} className="scroll-mt-24">
            <h2 id={`${section.id}-h`} className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {section.title}
            </h2>
            <div className="mt-4 divide-y divide-[var(--color-border-hairline)] rounded-[var(--radius-card)] border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] shadow-[var(--elevation-xs)]">
              {section.items.map((item) => (
                <div key={item.q} className="p-5">
                  <h3 className="font-bold text-[var(--color-text-primary)]">{item.q}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm text-[var(--color-text-secondary)]">
        Still stuck?{" "}
        <Link href="/feedback" className={LINK}>
          Send feedback
        </Link>{" "}
        or{" "}
        <Link href="/complaints" className={LINK}>
          report a concern
        </Link>
        .
      </p>
    </div>
  );
}
