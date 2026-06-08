import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { importSPKI, jwtVerify } from "jose";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ASIPT_ISSUER = "asipt";
const ASIPT_AUDIENCE = "lodi";
const ASIPT_PUBLIC_KEY_URL = "https://diversidadebarrafunda.org/api/lodi/public-key";

const envSchema = z.enum(["sandbox", "live"]);

export type AccessSource = "subscription" | "asipt" | null;

export interface AccessStatus {
  source: AccessSource;
  expiresAt: string | null;
  subscriptionStatus?: string | null;
}

// Retorna o status de acesso à calculadora do usuário autenticado.
// Acesso ativo = assinatura Stripe ativa OU liberação ASIPT vigente.
export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ environment: envSchema }).parse(input))
  .handler(async ({ data, context }): Promise<AccessStatus> => {
    const { supabase, userId } = context;

    const { data: sub } = await (supabase as any)
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const subActive =
      sub &&
      ((["active", "trialing", "past_due"].includes(sub.status) &&
        (!sub.current_period_end || new Date(sub.current_period_end) > new Date())) ||
        (sub.status === "canceled" &&
          sub.current_period_end &&
          new Date(sub.current_period_end) > new Date()));

    if (subActive) {
      return {
        source: "subscription",
        expiresAt: sub.current_period_end ?? null,
        subscriptionStatus: sub.status,
      };
    }

    const { data: grant } = await (supabase as any)
      .from("asipt_grants")
      .select("expires_at")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (grant) {
      return {
        source: "asipt",
        expiresAt: grant.expires_at,
        subscriptionStatus: sub?.status ?? null,
      };
    }

    return { source: null, expiresAt: null, subscriptionStatus: sub?.status ?? null };
  });

// Recebe o JWT devolvido pelo ASIPT, valida assinatura, issuer, audience e
// expiração contra a chave pública publicada pela Diversidade Barra Funda,
// e registra a liberação para o usuário autenticado.
export const redeemAsiptToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        token: z.string().min(20).max(8192),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const res = await fetch(ASIPT_PUBLIC_KEY_URL, { headers: { accept: "application/json" } });
    if (!res.ok) {
      throw new Error("Não foi possível obter a chave pública do ASIPT.");
    }
    const body = (await res.json()) as { publicKey?: string };
    if (!body.publicKey) throw new Error("Resposta inválida do ASIPT.");

    const key = await importSPKI(body.publicKey, "RS256");
    const { payload } = await jwtVerify(data.token, key, {
      issuer: ASIPT_ISSUER,
      audience: ASIPT_AUDIENCE,
    });

    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const jti = typeof payload.jti === "string" ? payload.jti : null;
    const exp = typeof payload.exp === "number" ? payload.exp : null;

    if (!sub || !jti || !exp) {
      throw new Error("Token ASIPT sem campos obrigatórios (sub, jti, exp).");
    }

    const expiresAt = new Date(exp * 1000).toISOString();

    const { error } = await (supabase as any).from("asipt_grants").upsert(
      {
        user_id: userId,
        asipt_subject: sub,
        jwt_jti: jti,
        expires_at: expiresAt,
      },
      { onConflict: "jwt_jti" },
    );
    if (error) throw new Error(error.message);

    return { ok: true, expiresAt };
  });
