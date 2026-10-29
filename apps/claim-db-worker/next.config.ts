import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Left to OpenNext's bundler, which picks postgres.js's workerd build
  // (TCP through cloudflare:sockets) instead of its Node.js one.
  serverExternalPackages: ["postgres"],
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
