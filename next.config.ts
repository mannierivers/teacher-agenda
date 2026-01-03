import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

/**
 * PWA CONFIGURATION
 * Logic updated for @ducanh2912/next-pwa strict typing.
 */
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // 👈 Fix: skipWaiting must live inside workboxOptions
  workboxOptions: {
    skipWaiting: true,   // Forces the new service worker to take over immediately
    clientsClaim: true,  // Ensures the app updates across all open tabs/windows
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next.js 15/16 requirement: satisfy the Turbopack check while using Webpack plugins
  experimental: {
    // @ts-ignore
    turbopack: {}, 
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.salpointe.org",
      },
    ],
  },
};

export default withPWA(nextConfig);