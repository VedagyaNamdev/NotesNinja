import type { NextConfig } from "next";
import path from "path";
import os from "os";

// Check if we should ignore Windows system directories
const ignoreWindowsDirs = process.env.NEXT_IGNORE_WINDOWS_DIRS !== 'false';

// Get user's home directory
const userHome = os.homedir();

// Check if running in Vercel
const isVercel = process.env.VERCEL === '1';

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during builds to avoid Windows path issues
  typescript: {
    ignoreBuildErrors: true,
  },
  // Set output mode to ensure proper artifacts on Vercel
  output: isVercel ? 'standalone' : undefined,
  // Set production dist directory - don't change on Vercel environments
  distDir: isVercel ? '.next' : 'build',
  webpack: (config) => {
    // Handling modules not found errors for client-side usage
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,  // Disable canvas module requirement
      fs: false,      // Disable fs module requirement
      path: false,    // Disable path module requirement
      os: false,      // Disable os module requirement
      crypto: false,  // Disable crypto module requirement
      stream: false,  // Disable stream module requirement
      process: false, // Disable process module requirement
      zlib: false,    // Disable zlib module requirement
      util: false,    // Disable util module requirement
    };
    
    // Add watchOptions to handle Windows EPERM issues if needed
    if (process.platform === 'win32' && ignoreWindowsDirs) {
      console.log('📢 Ignoring Windows system directories during build');
      
      // Absolute paths to all problematic Windows directories
      const systemDirs = [
        path.join(userHome, 'AppData'),
        path.join(userHome, 'Application Data'),
        path.join(userHome, 'Local Settings'),
        path.join(userHome, 'Cookies'),
        path.join(userHome, 'Recent'),
        path.join(userHome, 'Temp'),
        'C:\\Windows',
        'C:\\Program Files',
        'C:\\Program Files (x86)',
        'C:\\$Recycle.Bin',
        'C:\\System Volume Information'
      ];
      
      // Set watchOptions to ignore problematic directories
      config.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/Application Data/**', 
          '**/AppData/**',
          '**/.git/**',
          '**/Temp/**',
          ...systemDirs.map(dir => dir + '/**')
        ],
        poll: 1000, // Use polling strategy
        aggregateTimeout: 600
      };
    }
    
    return config;
  },
  reactStrictMode: true
};

export default nextConfig;
