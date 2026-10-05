import type { NextConfig } from "next";

// Conservative defaults for every response. A full Content-Security-Policy is
// left to the deployment, since Clerk's hosted domains vary per instance.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
