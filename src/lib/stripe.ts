import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { hasPaymentsConfigured } from "./stripe-env";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!hasPaymentsConfigured()) {
    throw new Error("Pagamentos não configurados.");
  }
  if (!stripePromise) {
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}
