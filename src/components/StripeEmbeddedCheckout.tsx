import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { getStripe } from "@/lib/stripe";
import { getStripeEnvironment } from "@/lib/stripe-env";
import { createCheckoutSession } from "@/lib/payments.functions";

interface Props {
  priceId: string;
  returnUrl: string;
}

export function StripeEmbeddedCheckout({ priceId, returnUrl }: Props) {
  const checkout = useServerFn(createCheckoutSession);

  const fetchClientSecret = async (): Promise<string> => {
    const r = await checkout({
      data: { priceId, returnUrl, environment: getStripeEnvironment() },
    });
    if ("error" in r) throw new Error(r.error);
    if (!r.clientSecret) throw new Error("Stripe não retornou client_secret.");
    return r.clientSecret;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
