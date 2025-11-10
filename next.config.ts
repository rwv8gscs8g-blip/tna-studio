import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Configurações compatíveis e recomendadas */
  reactStrictMode: true,
  swcMinify: true,

  // Permite uso seguro em Cloudflare Pages
  experimental: {
    optimizeCss: true,
    turbo: {
      rules: {},
    },
  },

  // Ignora warnings de eslint no deploy (opcional)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ajusta checagem de tipos durante o build
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;