import type { NextConfig } from "next";

const backendInternal =
  process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ?? "";

/** Set in docker-compose so webpack uses polling on bind-mounted volumes (esp. Windows). */
const isDockerDev = process.env.DOCKER_DEV === "true";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  webpack: (config, { dev }) => {
    if (dev && isDockerDev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  /**
   * When BACKEND_INTERNAL_URL is set (e.g. Docker Compose), proxy /svc/api/*
   * to the FastAPI service so the browser can keep same-origin paths as on Vercel.
   */
  async rewrites() {
    if (!backendInternal) {
      return [];
    }
    return [
      {
        source: "/svc/api/:path*",
        destination: `${backendInternal}/:path*`,
      },
    ];
  },
};

export default nextConfig;
