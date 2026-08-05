// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "10.1.20.150",
        port: "8080",
        pathname: "/courses/**",
      },
      {
        protocol: "http",
        hostname: "10.1.20.150",
        port: "8080",
        pathname: "/uploads/certificates/**",
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },
  // Add this to ignore TypeScript errors during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Optionally ignore ESLint errors too
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;