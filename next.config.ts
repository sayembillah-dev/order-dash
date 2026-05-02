import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phone on LAN — change IP if yours differs (see terminal warning).
  allowedDevOrigins: ["192.168.0.116"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
