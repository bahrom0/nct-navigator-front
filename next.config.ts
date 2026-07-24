import type { NextConfig } from "next";

const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:4010";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      { pathname: "/photos/**", search: "?v=20260724-2" },
      { pathname: "/presentation/**" },
    ],
  },
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
  async headers() {
    return [
      {
        source: "/photos/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
