// Tipo duplicado intencionalmente para não importar de arquivos .server.ts no bundle do cliente.
export type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function getStripeEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error(
    "Pagamentos não configurados para este build. Conclua o go-live do Stripe no Lovable.",
  );
}

export function hasPaymentsConfigured(): boolean {
  return !!clientToken && (clientToken.startsWith("pk_test_") || clientToken.startsWith("pk_live_"));
}
