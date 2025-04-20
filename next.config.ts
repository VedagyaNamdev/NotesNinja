import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Handling 'canvas' module not found error for pdfjs-dist
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,  // Disable canvas module requirement
    };
    return config;
  },
};

export default nextConfig;
