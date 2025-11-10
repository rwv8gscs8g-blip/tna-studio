// Habilita execução na Edge (obrigatório no Cloudflare Pages)
export const runtime = "edge";

// Evita qualquer cache dessa rota de autenticação
export const dynamic = "force-dynamic";

// (Opcional) se quiser indicar região preferida de execução
// export const preferredRegion = "auto";

import { handlers } from "@/auth";

// Exponha os métodos suportados pelo NextAuth (GET/POST)
export const { GET, POST } = handlers;