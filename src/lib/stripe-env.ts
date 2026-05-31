import type { StripeEnv } from "./stripe.server";

/**
 * Detecta o ambiente Stripe corrente. Em preview/dev usamos sandbox; em
 * produção publicada usamos live.
 */
export function getStripeEnvironment(): StripeEnv {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "production" ? "live" : "sandbox";
  }
  const host = window.location.hostname;
  // *.lovable.app publicado (sem `-dev`) = live
  if (host.endsWith(".lovable.app") && !host.includes("-dev")) return "live";
  return "sandbox";
}
