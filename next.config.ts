import type { NextConfig } from "next";
import path from "path";
import { IMAGE_REMOTE_PATTERNS } from "./src/lib/image-hosts";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },

  images: {
    // Local dev only — lets the image optimizer fetch from the local API's
    // /dev-fake-file storage (it refuses localhost/private IPs by default).
    ...(process.env.NODE_ENV !== "production" ? { dangerouslyAllowLocalIP: true } : {}),
    // Defined in src/lib/image-hosts.ts so PhotoCarousel can check the same
    // list before choosing next/image.
    remotePatterns: IMAGE_REMOTE_PATTERNS,
  },
};

export default nextConfig;
