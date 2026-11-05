// GET    /api/cenarios/:id  →  abre um cenário completo
// PUT    /api/cenarios/:id  →  cria ou atualiza (guarda a versão anterior como backup)
// DELETE /api/cenarios/:id  →  remove o cenário (o backup continua por 90 dias)
import { json } from "../../../lib/resposta.js";

const ID_VALIDO = /^[a-z0-9-]{1,60}$/;
const TAMANHO_MAX = 200 * 1024; // 200 KB por cenário
const BACKUP_DIAS = 90;

const chave = (id) => "cenario:" + id;
const autorDe = (request) =>
  request.headers.get("Cf-Access-Authenticated-User-Email") || "equipe";

function idValido(params) {
  const id = String(params.id || "");
  return ID_VALIDO.test(id) ? id : null;
}

export async function onRequestGet({ params, env }) {
  const id = idValido(params);
  if (!id) return json({ erro: "Identificador inválido." }, 400);
  const valor = await env.CENARIOS.get(chave(id), "json");
  if (!valor) return json({ erro: "Cenário não encontrado." }, 404);
  return json(valor);
}

export async function onRequestPut({ params, env, request }) {
  const id = idValido(params);
  if (!id) return json({ erro: "Identificador inválido." }, 400);

  const texto = await request.text();
  if (texto.length > TAMANHO_MAX) return json({ erro: "Cenário grande demais." }, 413);

  let c;
  try { c = JSON.parse(texto); } catch { return json({ erro: "Conteúdo inválido." }, 400); }
  if (!c || typeof c !== "object" || !Array.isArray(c.fontes)) {
    return json({ erro: "O cenário precisa ter a lista de fontes." }, 400);
  }

  const agora = new Date().toISOString();
  const autor = autorDe(request);
  const cenario = { ...c, atualizadoEm: agora, atualizadoPor: autor };

  // guarda a versão anterior antes de sobrescrever
  const anterior = await env.CENARIOS.get(chave(id));
  if (anterior) {
    await env.CENARIOS.put("backup:" + id + ":" + agora, anterior, { expirationTtl: BACKUP_DIAS * 86400 });
  }

  await env.CENARIOS.put(chave(id), JSON.stringify(cenario), {
    metadata: {
      unidade: String(c.unidade || "").slice(0, 80),
      mes: String(c.mes || "").slice(0, 40),
      meta: Number(c.meta) || 0,
      atualizadoEm: agora,
      autor,
    },
  });

  return json({ ok: true, id, atualizadoEm: agora });
}

export async function onRequestDelete({ params, env, request }) {
  const id = idValido(params);
  if (!id) return json({ erro: "Identificador inválido." }, 400);
  const anterior = await env.CENARIOS.get(chave(id));
  if (anterior) {
    await env.CENARIOS.put("backup:" + id + ":excluido:" + new Date().toISOString(), anterior, { expirationTtl: BACKUP_DIAS * 86400 });
    await env.CENARIOS.delete(chave(id));
  }
  return new Response(null, { status: 204 });
}
