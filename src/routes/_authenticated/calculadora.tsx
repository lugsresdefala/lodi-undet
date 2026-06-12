import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { SectionEyebrow } from "@/components/SiteChrome";
import Simulator from "@/components/Simulator";
import { getMyAccess, redeemAsiptToken, type AccessStatus } from "@/lib/access.functions";
import { getStripeEnvironment, hasPaymentsConfigured } from "@/lib/stripe-env";

const ASIPT_AUTHORIZE_URL =
  "https://diversidadebarrafunda.org/lodi/conectar?redirect_uri=https://lodi-undet.lovable.app/calculadora";

export const Route = createFileRoute("/_authenticated/calculadora")({
  head: () => ({
    meta: [
      { title: "Calculadora PK — lodi-t" },
      {
        name: "description",
        content:
          "Simulador farmacocinético do undecilato de testosterona IM para ajuste individualizado dos intervalos posológicos.",
      },
      { property: "og:title", content: "Calculadora PK — lodi-t" },
      {
        property: "og:description",
        content:
          "Modelo PK do undecilato de testosterona. Página educativa para apoio conceitual, sem finalidade prescritiva.",
      },
    ],
    links: [{ rel: "canonical", href: "https://lodi-undet.lovable.app/calculadora" }],
  }),
  component: CalculadoraPage,
});

function CalculadoraPage() {
  const env = hasPaymentsConfigured() ? getStripeEnvironment() : "sandbox";
  const fetchAccess = useServerFn(getMyAccess);
  const redeem = useServerFn(redeemAsiptToken);

  const [access, setAccess] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null);

  async function refresh() {
    const a = await fetchAccess({ data: { environment: env } });
    setAccess(a);
    setLoading(false);
  }

  // Captura o retorno do ASIPT (#asipt_eligible=1&asipt_token=...) e troca por liberação.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const eligible = params.get("asipt_eligible") === "1";
        const token = params.get("asipt_token");
        if (eligible && token) {
          try {
            await redeem({ data: { token } });
            if (!cancelled) setRedeemMsg("Liberação ASIPT registrada.");
          } catch (e: any) {
            if (!cancelled) setRedeemMsg(e?.message ?? "Falha ao validar token ASIPT.");
          } finally {
            history.replaceState(null, "", window.location.pathname);
          }
        }
      }
      if (!cancelled) await refresh();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  }

  if (!access?.source) {
    return <Paywall redeemMsg={redeemMsg} />;
  }

  return (
    <main className="relative mx-auto max-w-6xl space-y-12 px-4 py-14 md:px-8 md:py-20">
      <header>
        <SectionEyebrow n="01" label="Farmacocinética" />
        <h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl">
          Calculadora PK
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Modelo do undecilato de testosterona IM para ajuste individualizado dos
          intervalos posológicos.
        </p>
        <p className="mt-3 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
          acesso:{" "}
          <span className="text-foreground">
            {access.source === "asipt" ? "ASIPT · diversidadebarrafunda.org" : "assinatura"}
          </span>
          {access.expiresAt && (
            <> · até {new Date(access.expiresAt).toLocaleDateString("pt-BR")}</>
          )}
        </p>
      </header>
      <MedicalDisclaimer />
      <Simulator />
      <nav className="flex flex-wrap gap-3 border-t border-border/60 pt-8 font-mono text-[11px] uppercase tracking-[0.22em]">
        <Link to="/cronologia" className="text-muted-foreground hover:text-foreground">
          → cronologia
        </Link>
        <Link to="/efeitos" className="text-muted-foreground hover:text-foreground">
          → efeitos por sistema
        </Link>
      </nav>
    </main>
  );
}

function Paywall({ redeemMsg }: { redeemMsg: string | null }) {
  const navigate = useNavigate();
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 md:px-8">
      <SectionEyebrow n="01" label="Acesso restrito" />
      <h1 className="font-serif text-4xl font-medium tracking-tight">Calculadora PK</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        O simulador farmacocinético requer assinatura. Pacientes do ASIPT (diversidadebarrafunda.org)
        com consultas concluídas têm liberação gratuita.
      </p>

      {redeemMsg && (
        <p className="mt-4 rounded-md border border-border bg-card/40 px-3 py-2 text-sm">
          {redeemMsg}
        </p>
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <a
          href={ASIPT_AUTHORIZE_URL}
          className="rounded-lg border border-border bg-card/40 p-6 hover:bg-accent"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Gratuito
          </p>
          <p className="mt-2 font-serif text-xl">Sou paciente da Diversidade Barra Funda</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Conecte sua conta do ASIPT. Se houver consulta concluída no seu histórico, o
            acesso é liberado automaticamente.
          </p>
        </a>

        <button
          onClick={() => navigate({ to: "/conta" })}
          className="rounded-lg border border-border bg-card/40 p-6 text-left hover:bg-accent"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Assinatura
          </p>
          <p className="mt-2 font-serif text-xl">R$ 13,90 / mês</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Cancelamento a qualquer momento. Pagamento pelo Stripe.
          </p>
        </button>
      </div>
    </main>
  );
}
