import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // =============================================================
  // CORS Configuration for Chrome Extension
  // Allows cross-origin requests from runcomfy.com and extensions
  // =============================================================
  async headers() {
    return [
      {
        // Apply CORS headers to all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-API-Key",
          },
        ],
      },
    ];
  },

  // Experimental features
  experimental: {
    // Enable server actions for form handling
    serverActions: {
      bodySizeLimit: "10mb", // Allow larger payloads for workflow JSON
    },
  },

  // Temporarily ignore ESLint during builds (some rules conflict with comfylink-extension)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignore TypeScript errors from comfylink-extension (separate project)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Output for Docker standalone builds
  // Note: Commented out for Windows dev builds (symlink permission issues)
  // Enable in Dockerfile or CI/CD environment
  // output: "standalone",
};

export default nextConfig;
