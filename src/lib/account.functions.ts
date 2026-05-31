import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateApiKey } from "./api-keys.server";

export const listApiKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await (supabase as any)
      .from("api_keys")
      .select("id, name, prefix, created_at, last_used_at, revoked_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ name: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { plain, prefix, hash } = generateApiKey();
    const { data: row, error } = await (supabase as any)
      .from("api_keys")
      .insert({ user_id: userId, name: data.name, prefix, key_hash: hash })
      .select("id, name, prefix, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { ...row, plainKey: plain };
  });

export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await (supabase as any)
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ environment: z.enum(["sandbox", "live"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await (supabase as any)
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end, price_id, environment")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return row ?? null;
  });
