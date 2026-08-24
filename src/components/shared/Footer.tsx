import Image from "next/image";
import Link from "next/link";

// REDESIGN PASS: a single centered row read as an afterthought on a
// premium marketplace. Structured as logo+promise / link groups / legal
// bar — still the exact same links, nothing invented — using the primary
// logo (the only variant verified to hold contrast on a light surface;
// the secondary mark's Deep Blue strokes aren't legible on a dark chapter
// background, so it's intentionally not used here).
// NAV RELOCATION (Website Revision Spec §3A): "Services and Help content is
// not deleted — it is relocated (e.g. footer or account/help menu; exact
// placement pending)". Both already lived here alongside their top-nav
// entries, so the footer becoming their primary home is a promotion of an
// existing location rather than a new one invented for them — and it is the
// destination the spec names first.
//
// Services is lifted out of "Discover" into its own group so it reads as a
// destination in its own right now that the top nav no longer carries it,
// rather than as a third bullet under two property links.
// ⚠ Spec §4 item 1 (exact destination) is still open — this is the interim.
const LINK_GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Discover",
    links: [
      { href: "/listings?mode=rent", label: "Homes to rent" },
      { href: "/listings?mode=sale", label: "Homes to buy" },
    ],
  },
  {
    title: "Services",
    links: [
      { href: "/services", label: "Find a service provider" },
      { href: "/advertise", label: "Advertise on NextHome" },
    ],
  },
  {
    // Help joins the existing support links rather than becoming a group of
    // one — they are the same errand from the reader's side, and a lone
    // column reads as an oversight next to two full ones.
    title: "Help & support",
    links: [
      { href: "/help", label: "Help & FAQ" },
      { href: "/feedback", label: "Send Feedback" },
      { href: "/complaints", label: "Report a Concern" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div>
            <Image src="/brand/nexthome-logo-primary.png" alt="NextHome" width={2267} height={2958} className="h-10 w-auto" />
            <p className="mt-4 max-w-xs text-sm text-[var(--color-text-secondary)]">
              Verified listings, reviewed before they go live — replacing scattered groups and unreliable agents
              with one trustworthy platform.
            </p>
          </div>
          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{group.title}</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm font-bold text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-[var(--color-border-hairline)] pt-6 text-sm text-[var(--color-text-secondary)]">
          © {new Date().getFullYear()} NextHome. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
