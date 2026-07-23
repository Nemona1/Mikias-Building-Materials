// next.config.mjs - Updated for Vercel
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
    ],
  },
  
  turbopack: {
    root: process.cwd(),
  },
  
  poweredByHeader: false,
  
  // Server external packages for Node.js APIs
  serverExternalPackages: ['fs', 'path', 'child_process', 'pg', '@prisma/client', '@prisma/adapter-pg'],
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore warnings for backup route
      config.ignoreWarnings = [
        { module: /backup/ },
        { message: /Critical dependency/ },
        { message: /fs/ },
      ];
    }
    return config;
  },
};

export default nextConfig;