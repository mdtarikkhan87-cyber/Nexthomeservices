// The one list of remote image hosts next/image may load — imported by
// next.config.ts (so Next enforces it) and by PhotoCarousel (so it can tell,
// before rendering, whether next/image would accept a URL). Keeping a single
// copy means the two can never disagree.
//
// Dependency-free on purpose: next.config.ts is loaded by Node at build time,
// before the app's path aliases or React exist, so this file must not import
// anything.

export interface ImageHostPattern {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
}

export const IMAGE_REMOTE_PATTERNS: ImageHostPattern[] = [
  { protocol: "https", hostname: "images.unsplash.com" },
  // Real S3 uploads (listing photos, ad creatives, this homepage ad
  // banner) — next/image refuses any host not explicitly listed here,
  // and this one was missing entirely, so a real S3-hosted image would
  // fail to render wherever next/image is used, not just in AdBanner.
  { protocol: "https", hostname: "nexthomeservicesuploads.s3.eu-west-1.amazonaws.com" },
  // Local dev only: with no AWS keys the API stores uploads on its own
  // disk and serves them from /dev-fake-file (never enabled in production).
  ...(process.env.NODE_ENV !== "production"
    ? [{ protocol: "http" as const, hostname: "localhost", port: "4000" }]
    : []),
];

// True only if next/image would accept this URL, mirroring Next's own
// remotePatterns match (exact protocol, hostname and port; none of the
// patterns above use wildcards). Anything else — another host, a relative
// path, a data: URL, an unparseable string — is false, meaning "don't hand
// this to next/image".
export function isAllowedImageHost(url: string): boolean {
  try {
    const u = new URL(url);
    const protocol = u.protocol.replace(/:$/, "");
    return IMAGE_REMOTE_PATTERNS.some(
      (p) => p.protocol === protocol && p.hostname === u.hostname && (p.port ?? "") === u.port,
    );
  } catch {
    return false;
  }
}
