import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lean, self-contained build for the Docker image (only the files the
  // server actually needs get copied into the final image layer).
  output: "standalone",
};

export default nextConfig;
