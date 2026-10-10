import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },

  images: {
    // Local dev only — lets the image optimizer fetch from the local API's
    // /dev-fake-file storage (it refuses localhost/private IPs by default).
    ...(process.env.NODE_ENV !== "production" ? { dangerouslyAllowLocalIP: true } : {}),
    remotePatterns: [
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
    ],
  },
};

export default nextConfig;
