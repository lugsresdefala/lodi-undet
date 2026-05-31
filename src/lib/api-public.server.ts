/**
 * Wrapper compartilhado para endpoints públicos /api/public/v1/*.
 * Aplica CORS, autenticação por chave de API e contabiliza uso.
 */
import { authenticateApiRequest, recordApiUsage } from "./api-keys.server";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
} as const;

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function detectEnv(req: Request): "sandbox" | "live" {
  const host = new URL(req.url).hostname;
  if (host.endsWith(".lovable.app") && !host.includes("-dev")) return "live";
  return "sandbox";
}

export async function withApiAuth(
  request: Request,
  endpoint: string,
  handler: (parsed: any) => Promise<unknown>,
): Promise<Response> {
  const t0 = Date.now();
  const env = detectEnv(request);
  const auth = await authenticateApiRequest(request, env);
  if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    void recordApiUsage({ ...auth, endpoint, status: 400, ms: Date.now() - t0 });
    return jsonResponse({ error: "Corpo JSON inválido." }, 400);
  }

  try {
    const result = await handler(body);
    const ms = Date.now() - t0;
    void recordApiUsage({ ...auth, endpoint, status: 200, ms });
    return jsonResponse(result, 200);
  } catch (err: any) {
    const ms = Date.now() - t0;
    const msg = err?.message ?? "Erro interno.";
    const status = err?.status && Number.isInteger(err.status) ? err.status : 400;
    void recordApiUsage({ ...auth, endpoint, status, ms });
    return jsonResponse({ error: msg }, status);
  }
}
