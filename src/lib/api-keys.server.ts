/**
 * Helpers de servidor para gerenciar chaves de API. Server-only.
 */
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

let _admin: any = null;
function admin(): any {
  if (!_admin) {
    _admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _admin;
}

export function hashKey(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

export function generateApiKey(): { plain: string; prefix: string; hash: string } {
  const random = crypto.randomBytes(32).toString("base64url");
  const plain = `lodi_${random}`;
  const prefix = plain.slice(0, 12);
  const hash = hashKey(plain);
  return { plain, prefix, hash };
}

export type ApiAuthResult =
  | { ok: true; userId: string; apiKeyId: string }
  | { ok: false; status: number; error: string };

/**
 * Valida chave de API e checa assinatura ativa.
 */
export async function authenticateApiRequest(req: Request, env: "sandbox" | "live"): Promise<ApiAuthResult> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Cabeçalho Authorization ausente ou inválido." };
  }
  const token = header.slice(7).trim();
  if (!token.startsWith("lodi_")) {
    return { ok: false, status: 401, error: "Formato de chave inválido." };
  }
  const hash = hashKey(token);

  const { data: key } = await admin()
    .from("api_keys")
    .select("id, user_id, revoked_at")
    .eq("key_hash", hash)
    .maybeSingle();

  if (!key || key.revoked_at) {
    return { ok: false, status: 401, error: "Chave inválida ou revogada." };
  }

  const userId = key.user_id as string;
  const apiKeyId = key.id as string;

  const { data: hasSub } = await admin().rpc("has_active_subscription", {
    user_uuid: userId,
    check_env: env,
  });

  if (!hasSub) {
    return { ok: false, status: 402, error: "Assinatura inativa. Renove em /conta." };
  }

  // Rate limit simples: 60 chamadas / minuto por chave
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await admin()
    .from("api_usage")
    .select("id", { count: "exact", head: true })
    .eq("api_key_id", apiKeyId)
    .gte("created_at", since);

  if ((count ?? 0) >= 60) {
    return { ok: false, status: 429, error: "Limite de 60 req/min excedido." };
  }

  return { ok: true, userId, apiKeyId };
}

export async function recordApiUsage(params: {
  apiKeyId: string;
  userId: string;
  endpoint: string;
  status: number;
  ms: number;
}) {
  try {
    await admin().from("api_usage").insert({
      api_key_id: params.apiKeyId,
      user_id: params.userId,
      endpoint: params.endpoint,
      status: params.status,
      ms: params.ms,
    });
    await admin()
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", params.apiKeyId);
  } catch (e) {
    console.error("recordApiUsage failed", e);
  }
}
