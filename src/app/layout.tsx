import type { Metadata } from "next";
import { Inter, Quicksand } from "next/font/google";
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

// EDITORIAL REDESIGN — a second, deliberately neutral face used ONLY as the
// UI workhorse: metadata, prices, labels, filters, table-like rows. Quicksand
// remains the brand voice and owns every display/heading size, so the brand
// identity is unchanged where it is actually read as identity.
//
// The reason this pairing exists: Quicksand is a rounded geometric with
// proportional figures, which makes dense numeric content (₦95,000,000 · 4 bd
// · 214 views) read soft and slightly toy-like at small sizes. Inter is
// metric-neutral and ships true tabular numerals, so prices align in a column
// and carry the authority a marketplace needs. Two faces, two clearly
// separated jobs — never mixed within one line of type.
const inter = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NextHome — Rent, Buy, and Connect With Confidence",
  description:
    "Find verified rental and sale listings, connect with landlords and local service providers, all in one trustworthy place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${quicksand.variable} ${inter.variable} h-full antialiased`}>
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
