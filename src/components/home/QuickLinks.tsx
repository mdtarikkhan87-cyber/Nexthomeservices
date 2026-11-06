import Link from "next/link";
import { IconArrowRight, IconHome, IconWrench } from "@/components/ui/icons";

// The two ways into the site that are not "search for a home": hiring a
// tradesperson, and listing a property. They sit directly under the search card.
//
// "List Your Property" points at the dashboard's new-listing page for everyone,
// because that route already handles each case: a signed-out visitor gets the
// login/register gate and comes back to it, a signed-in user without the
// Landlord role is offered "Add the Landlord role", and a landlord gets the form.
const LINKS = [
  {
    href: "/services",
    title: "Find Home Services",
    body: "Find local plumbers, electricians and other professionals",
    Icon: IconWrench,
  },
  {
    href: "/dashboard/listings/new",
    title: "List Your Property",
    body: "Advertise to buyers and renters",
    Icon: IconHome,
  },
] as const;

export function QuickLinks() {
  return (
    <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:mt-5">
      {LINKS.map(({ href, title, body, Icon }) => (
        <li key={href} className="min-w-0">
          <Link
            href={href}
            className="group flex h-full items-center gap-4 rounded-2xl border border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--elevation-xs)] transition-[border-color,box-shadow] duration-[var(--motion-duration-short)] hover:border-[var(--color-brand-primary)] hover:shadow-[var(--elevation-sm)] sm:p-5"
          >
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-dense)] text-[var(--color-brand-primary-text)]"
            >
              <Icon className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-[var(--color-text-primary)]">{title}</span>
              <span className="mt-0.5 block text-sm text-[var(--color-text-secondary)]">{body}</span>
            </span>
            <IconArrowRight className="h-4 w-4 shrink-0 text-[var(--color-brand-primary-text)] transition-transform duration-[var(--motion-duration-short)] group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
