import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The Arcade became the Grounds: links to the old address still land in the right place.
  redirects() {
    return [
      { source: "/play", destination: "/events", permanent: true },
      { source: "/play/:project", destination: "/events", permanent: true },
    ];
  },
};

export default nextConfig;
