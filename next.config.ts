import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Real S3 uploads (listing photos, ad creatives, this homepage ad
      // banner) — next/image refuses any host not explicitly listed here,
      // and this one was missing entirely, so a real S3-hosted image would
      // fail to render wherever next/image is used, not just in AdBanner.
      { protocol: "https", hostname: "nexthomeservicesuploads.s3.eu-west-1.amazonaws.com" },
    ],
  },
};

export default nextConfig;
