import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  },
  serverExternalPackages: ["typeorm",  "mysql2", "reflect-metadata"]
};

export default nextConfig;
