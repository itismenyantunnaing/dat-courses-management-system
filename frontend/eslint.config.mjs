;/ @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/",
      },
      {
        protocol: "http",
        hostname: "10.254.92.235",
        pathname: "/uploads/",
      },
      // If your backend serves images directly
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080", // Backend port
        pathname: "/uploads/",
      },
      {
        protocol: "http",
        hostname: "10.254.92.235",
        pathname: "/uploads/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
