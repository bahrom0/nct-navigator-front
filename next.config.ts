import type { NextConfig } from "next";

const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:4010";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.25", "192.168.100.50", "192.168.56.1", "10.183.242.235"],
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${backendOrigin}/api/:path*`,
        },
        {
          source: "/auth/:path*",
          destination: `${backendOrigin}/auth/:path*`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
