import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Deixe vazio no Next 15 (removemos optimizeCss para não exigir "critters")
  experimental: {
    turbo: { rules: {} },
  },

  // Evita que ESLint interrompa o build no CF Pages
  eslint: { ignoreDuringBuilds: true },

  // Mantenha a checagem de tipos (pode trocar para true se quiser forçar deploy)
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;