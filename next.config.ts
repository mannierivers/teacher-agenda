import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 👈 Next.js 16 requirement: satisfy the Turbopack check
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