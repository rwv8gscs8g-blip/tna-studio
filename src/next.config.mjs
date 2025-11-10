/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Proteção de enquadramento
          { key: "X-Frame-Options", value: "DENY" },
          // MIME sniff
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // HSTS (só deixe em prod com HTTPS de verdade!)
          // max-age 6 meses; includeSubDomains; preload (opcional)
          { key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains; preload" },
          // Permissões do browser (ajuste ao que você usa)
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // CSP básica (ajuste domínios de imagens/scripts quando for subir assets/CDN)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'", // depois podemos trocar por nonce
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join("; ")
          }
        ],
      },
    ];
  },
  // desabilite mapas de source em prod se quiser
  productionBrowserSourceMaps: false,
};

export default nextConfig;