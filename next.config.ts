import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // An admin panel has no business in a search index.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
