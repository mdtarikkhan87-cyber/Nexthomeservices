import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

// Brand Guidelines p.9: Quicksand Bold (headings) / Quicksand Medium (body).
//
// SELF-HOSTED on purpose. This used to be `next/font/google`, which downloads
// the font from Google at BUILD time — and when that step failed (CI run:
// Turbopack "Can't resolve …/internal/font/google/font"), the whole build
// failed, even though nothing in our code was wrong. Loading the same font
// from our own repo removes the network dependency from the build entirely.
//
// The two files are Google's official Quicksand (variable) font cut at exactly
// Medium 500 and Bold 700 and converted to WOFF2, with no glyph changes — all
// glyphs the site needs, incl. ₦ and the accents in Yoruba/Igbo names.
// License: SIL OFL 1.1 — src/fonts/OFL.txt must stay alongside them.
//
// Deliberately TWO static weights, not one variable font: globals.css relies
// on only 500 and 700 existing, so the browser maps body text (400) to Medium
// and semibold (600) to Bold. A variable font would render true Regular and
// SemiBold and quietly lighten the whole site.
const quicksand = localFont({
  src: [
    { path: "../fonts/Quicksand-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Quicksand-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-quicksand",
  display: "swap",
});

// BRAND COMPLIANCE (Website Revision Spec §3E, 24 Aug 2026): the previous
// pass introduced Inter as a second "UI workhorse" face for dense numeric
// content. That directly contradicts DESIGN_SYSTEM.md §3 ("no third
// typeface is introduced") and the Brand Guidelines' two-weight Quicksand
// system, and it is what the client saw as "headings/body do not use the
// brand typeface." Inter is removed entirely — Quicksand Bold/Medium now
// owns every heading, label, button, form field and card text sitewide.
//
// The semantic classes that pointed at Inter (.u-ui / .u-numeric / .u-label)
// are kept and repointed at Quicksand in globals.css, so the roles they
// encode (dense UI text, tabular figures, tracked-out labels) survive as
// *typographic treatments of the brand face* rather than as a second face.

// Explicit rather than relying on Next's implicit default, so it can't be
// silently lost if this file's metadata export is ever restructured.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "NextHome — Rent, Buy, and Connect With Confidence",
  description:
    "Find verified rental and sale listings, connect with landlords and local service providers, all in one trustworthy place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${quicksand.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Scroll-reveal safety net. Motion serialises its `initial` state as
            an inline opacity:0 during SSR, so with JavaScript unavailable the
            revealed sections would render in the DOM but stay invisible.
            This restores them for those users without affecting anyone else. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
