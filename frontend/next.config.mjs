// next.config.js

// The backend host/port changes between environments (localhost:8080 for
// local dev, a container/server IP or domain in Docker/prod) and is set via
// NEXT_PUBLIC_API_URL (see .env.local for local dev, or the
// NEXT_PUBLIC_API_URL build arg in docker-compose.yml for Docker/prod).
// Deriving the remotePatterns from that same value means this file never
// needs to be hand-edited again when the server address changes.
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

let apiProtocol = "http";
let apiHostname = "localhost";
let apiPort = "8080";

try {
  const parsed = new URL(apiUrl);
  apiProtocol = parsed.protocol.replace(":", "");
  apiHostname = parsed.hostname;
  apiPort = parsed.port || (apiProtocol === "https" ? "443" : "80");
} catch {
  console.warn(
      `[next.config.mjs] Could not parse NEXT_PUBLIC_API_URL="${apiUrl}", falling back to http://localhost:8080 for image remotePatterns.`
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiProtocol,
        hostname: apiHostname,
        port: apiPort,
        pathname: "/courses/**",
      },
      {
        protocol: apiProtocol,
        hostname: apiHostname,
        port: apiPort,
        pathname: "/uploads/certificates/**",
      },
      {
        protocol: apiProtocol,
        hostname: apiHostname,
        port: apiPort,
        pathname: "/profiles/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
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
