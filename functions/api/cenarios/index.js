// GET /api/cenarios  →  lista os cenários salvos (só o resumo, sem as fontes).
import { json } from "../../../lib/resposta.js";

export async function onRequestGet({ env }) {
  const cenarios = [];
  let cursor;
  do {
    const page = await env.CENARIOS.list({ prefix: "cenario:", cursor });
    for (const k of page.keys) {
      cenarios.push({ id: k.name.slice("cenario:".length), ...(k.metadata || {}) });
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  cenarios.sort((a, b) => String(b.atualizadoEm || "").localeCompare(String(a.atualizadoEm || "")));
  return json({ cenarios });
}
