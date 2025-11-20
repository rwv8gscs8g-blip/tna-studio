import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Evita que ESLint interrompa o build
  eslint: { ignoreDuringBuilds: true },

  // Mantenha a checagem de tipos (pode trocar para true se quiser forçar deploy)
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;