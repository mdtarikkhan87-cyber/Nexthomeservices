import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Brand Guidelines p.9: Quicksand Bold (headings) / Quicksand Medium (body).
// next/font only exposes numeric weights — 500 (Medium) and 700 (Bold) map
// directly to the two brand weights, no other weights are loaded.
const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["500", "700"],
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
