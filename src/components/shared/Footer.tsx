"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState, useSyncExternalStore } from "react";
import { CONTAINER_CLASS } from "@/components/ui/Container";
import { IconChevronDown } from "@/components/ui/icons";
import { FOCUS_RING } from "@/components/ui/SelectField";

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

// Below `sm` the three link groups collapse into accordions; from `sm` up the
// footer is exactly the multi-column layout it always was. Decided in JS rather
// than CSS so the markup is honest at each size: a button that toggles nothing
// (aria-expanded on a desktop heading) would be worse than no button.
//
// The server snapshot is `false`, so the server-rendered HTML — and anyone
// without JavaScript — gets the full, expanded footer with every link present.
//
// The query is the exact complement of Tailwind's `sm` (min-width: 640px), not
// "max-width: 639px": at a fractional width (browser zoom, some emulators) that
// one matches neither side and leaves the footer in the wrong layout.
const MOBILE_QUERY = "not all and (min-width: 640px)";
function subscribeMobile(onChange: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const getMobile = () => window.matchMedia(MOBILE_QUERY).matches;
const getServerMobile = () => false;

type LinkGroup = (typeof LINK_GROUPS)[number];

const LINK_CLASS = "text-sm font-bold text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)]";

function FooterGroup({ group, collapsible }: { group: LinkGroup; collapsible: boolean }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (!collapsible) {
    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{group.title}</p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {group.links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={LINK_CLASS}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--color-border-hairline)]">
      {/* The whole row is the button (min 44px tall), so the title and the
          chevron are one tap target. Enter and Space come with <button>. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg text-left text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)] ${FOCUS_RING}`}
      >
        {group.title}
        <IconChevronDown
          aria-hidden
          className={`h-4 w-4 shrink-0 transition-transform duration-[var(--motion-duration-short)] ${open ? "rotate-180" : ""}`}
        />
      </button>
      {/* `hidden` on a plain wrapper (no display class on it), so a closed
          panel is display:none — out of the tab order and the accessibility
          tree — instead of merely collapsed. */}
      <div id={panelId} hidden={!open}>
        <ul className="flex flex-col pb-2">
          {group.links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={`flex min-h-11 items-center ${LINK_CLASS}`}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Footer() {
  // Same rule as the header: the landing page uses the shared 1280px container,
  // every other route keeps its own 6xl.
  const isHome = usePathname() === "/";
  const compact = useSyncExternalStore(subscribeMobile, getMobile, getServerMobile);
  return (
    <footer className="border-t border-[var(--color-border-hairline)] bg-[var(--color-surface-raised)]">
      <div className={`${compact ? "py-8" : "py-12"} ${isHome ? CONTAINER_CLASS : "mx-auto max-w-6xl px-4 sm:px-6"}`}>
        <div className={`grid grid-cols-1 ${compact ? "gap-0" : "gap-10"} sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(3,1fr)]`}>
          <div className={compact ? "pb-5" : undefined}>
            <Image src="/brand/nexthome-logo-primary.png" alt="NextHome" width={2267} height={2958} className="h-10 w-auto" />
            <p className={`${compact ? "mt-3" : "mt-4"} max-w-xs text-sm text-[var(--color-text-secondary)]`}>
              Verified listings, reviewed before they go live — replacing scattered groups and unreliable agents
              with one trustworthy platform.
            </p>
          </div>
          {LINK_GROUPS.map((group) => (
            <FooterGroup key={group.title} group={group} collapsible={compact} />
          ))}
        </div>
        <div className={`${compact ? "mt-0" : "mt-10"} border-t border-[var(--color-border-hairline)] ${compact ? "pt-4" : "pt-6"} text-sm text-[var(--color-text-secondary)]`}>
          © {new Date().getFullYear()} NextHome. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
