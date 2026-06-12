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
    <main className="relative mx-auto max-w-4xl px-4 py-16 md:px-8 md:py-24">
      <SectionEyebrow n="01" label="Acesso restrito" />
      <h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl">
        Calculadora PK
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
        O simulador farmacocinético do undecilato de testosterona requer assinatura.
        Pacientes do ASIPT (diversidadebarrafunda.org) com consultas concluídas
        têm liberação gratuita automática.
      </p>

      {redeemMsg && (
        <div className="mt-6 rounded-lg border border-border bg-card/60 px-4 py-3 text-sm">
          {redeemMsg}
        </div>
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <a
          href={ASIPT_AUTHORIZE_URL}
          className="ring-soft group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm transition-colors hover:border-foreground/40"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Gratuito
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              ASIPT
            </span>
          </div>
          <p className="mt-3 font-serif text-2xl font-medium tracking-tight">
            Sou paciente do ASIPT
          </p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            diversidadebarrafunda.org
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-foreground/85">
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-1.5 inline-block h-1 w-3 shrink-0 bg-foreground/60" />
              Liberação automática via histórico do ASIPT
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-1.5 inline-block h-1 w-3 shrink-0 bg-foreground/60" />
              Sem cartão, sem cobrança
            </li>
          </ul>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            Conectar conta
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">↗</span>
          </span>
        </a>

        <button
          onClick={() => navigate({ to: "/conta" })}
          className="ring-soft group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 text-left backdrop-blur-sm transition-colors hover:border-foreground/40"
        >
          <div className="absolute -inset-8 -z-10 bg-aurora opacity-50 blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Assinatura
            </span>
            <span className="rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Stripe
            </span>
          </div>
          <p className="mt-3 font-serif text-3xl font-medium tracking-tight">
            R$ 13,90
            <span className="ml-1 text-sm font-normal text-muted-foreground">/ mês</span>
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-foreground/85">
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-1.5 inline-block h-1 w-3 shrink-0 bg-foreground/60" />
              Acesso completo à calculadora PK
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-1.5 inline-block h-1 w-3 shrink-0 bg-foreground/60" />
              Monte Carlo e recomendação de intervalo
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-1.5 inline-block h-1 w-3 shrink-0 bg-foreground/60" />
              Cancelamento a qualquer momento
            </li>
          </ul>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            Ir para assinatura
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </button>
      </div>
    </main>
  );
}
