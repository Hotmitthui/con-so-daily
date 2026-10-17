import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["mac-hot-mit.local"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.vietqr.io',
      },
    ],
  },
};

// Tự động nhận diện môi trường Cloudflare build vs Vercel/Standard build
const isCloudflareBuild = 
  process.env.CF_PAGES === '1' || 
  process.env.NEXT_ON_CLOUDFLARE === '1' || 
  process.env.OPEN_NEXT === '1' ||
  process.env.OPENNEXT === '1';

const configToExport = isCloudflareBuild
  ? nextConfig
  : require('next-pwa')({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: process.env.NODE_ENV === 'development',
    })(nextConfig);

export default configToExport;

