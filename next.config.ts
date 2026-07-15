import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.0.0.90'],
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  },
  serverExternalPackages: ["typeorm", "mysql2", "reflect-metadata", "bcryptjs"],
};

export default nextConfig;
