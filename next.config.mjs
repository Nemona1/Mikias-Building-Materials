// next.config.mjs - Remove onError
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
  
  serverExternalPackages: ['fs', 'path', 'child_process'],
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [
        { module: /backup/ },
        { message: /Critical dependency/ },
      ];
    }
    return config;
  },
};

export default nextConfig;