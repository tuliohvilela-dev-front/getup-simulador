// Roda antes de qualquer rota em /api.
// 1) Garante que o armazenamento (KV) está ligado ao projeto.
// 2) Em produção (EXIGIR_ACCESS = "1"), só aceita pedidos que passaram pelo Cloudflare Access.
// 3) Transforma erros inesperados em resposta JSON legível.

import { json } from "../../lib/resposta.js";

export async function onRequest({ request, env, next }) {
  if (!env.CENARIOS) {
    return json({ erro: "Armazenamento não configurado: ligue o KV com o nome CENARIOS no projeto do Cloudflare Pages." }, 500);
  }

  if (env.EXIGIR_ACCESS === "1" && !request.headers.get("Cf-Access-Jwt-Assertion")) {
    return json({ erro: "Acesso restrito à operação Getup." }, 401);
  }

  try {
    return await next();
  } catch (e) {
    return json({ erro: "Erro inesperado no servidor.", detalhe: String(e && e.message || e) }, 500);
  }
}
