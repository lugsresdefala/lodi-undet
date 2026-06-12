import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, hasPaymentsConfigured } from "@/lib/stripe-env";
import {
  createApiKey,
  getMySubscription,
  listApiKeys,
  revokeApiKey,
} from "@/lib/account.functions";
import { createPortalSession } from "@/lib/payments.functions";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { SectionEyebrow } from "@/components/SiteChrome";

export const Route = createFileRoute("/_authenticated/conta")({
  component: ContaPage,
  head: () => ({ meta: [{ title: "Minha conta — lodi-t" }] }),
});

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at?: string;
};

type Subscription = {
  status: string;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
} | null;

const STATUS_META: Record<string, { label: string; tone: string }> = {
  active: { label: "Ativa", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  trialing: { label: "Em período de teste", tone: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30" },
  past_due: { label: "Pagamento pendente", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  canceled: { label: "Cancelada", tone: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30" },
  unpaid: { label: "Não paga", tone: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30" },
  incomplete: { label: "Incompleta", tone: "bg-muted text-muted-foreground border-border" },
  paused: { label: "Pausada", tone: "bg-muted text-muted-foreground border-border" },
};

function StatusBadge({ status }: { status: string | null | undefined }) {
  const meta = (status && STATUS_META[status]) || {
    label: "Sem assinatura",
    tone: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${meta.tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {meta.label}
    </span>
  );
}

const PLAN_FEATURES = [
  "Acesso completo à calculadora PK do undecilato de testosterona",
  "Simulação Monte Carlo com bandas de variabilidade interindividual",
  "Recomendação individualizada de intervalo por meta de Cmédia",
  "Chaves de API para integração programática",
  "Cancelamento a qualquer momento",
];

function ContaPage() {
  const env = hasPaymentsConfigured() ? getStripeEnvironment() : "sandbox";
  const fetchKeys = useServerFn(listApiKeys);
  const fetchSub = useServerFn(getMySubscription);
  const createKey = useServerFn(createApiKey);
  const revoke = useServerFn(revokeApiKey);
  const portal = useServerFn(createPortalSession);

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [sub, setSub] = useState<Subscription>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  async function refresh() {
    const [k, s] = await Promise.all([fetchKeys(), fetchSub({ data: { environment: env } })]);
    setKeys(k as ApiKey[]);
    setSub(s as Subscription);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    refresh();

    const params = new URLSearchParams(window.location.search);
    if (params.get("session_id")) {
      setCheckoutOpen(false);
      let tries = 0;
      const iv = setInterval(async () => {
        tries += 1;
        const s = (await fetchSub({ data: { environment: env } })) as Subscription;
        if (s && ["active", "trialing"].includes(s.status)) {
          setSub(s);
          clearInterval(iv);
          history.replaceState(null, "", window.location.pathname);
        } else if (tries >= 10) {
          clearInterval(iv);
          history.replaceState(null, "", window.location.pathname);
        }
      }, 2000);
      return () => clearInterval(iv);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isActive = !!sub && ["active", "trialing"].includes(sub.status);
  const willCancel = !!sub?.cancel_at_period_end && !!sub?.current_period_end;

  function onSubscribe() {
    setError(null);
    if (!hasPaymentsConfigured()) {
      setError("Pagamentos não configurados neste ambiente.");
      return;
    }
    setCheckoutOpen(true);
  }

  async function onManage() {
    setBusy(true);
    setError(null);
    const r = await portal({ data: { returnUrl: window.location.origin + "/conta", environment: env } });
    setBusy(false);
    if ("error" in r) {
      setError(r.error);
      return;
    }
    window.open(r.url, "_blank");
  }

  async function onCreateKey() {
    if (!newKeyName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await createKey({ data: { name: newKeyName.trim() } });
      setCreatedKey((r as { plainKey: string }).plainKey);
      setNewKeyName("");
      setCopied(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar chave.");
    } finally {
      setBusy(false);
    }
  }

  async function onCopyKey() {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignora falha de clipboard
    }
  }

  async function onRevoke(id: string) {
    if (!confirm("Revogar esta chave? A ação é irreversível.")) return;
    await revoke({ data: { id } });
    await refresh();
  }

  async function onLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="relative mx-auto max-w-5xl px-4 py-14 md:px-8 md:py-20">
      <SectionEyebrow n="00" label="Minha conta" />

      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-8">
        <div className="min-w-0">
          <h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl">
            Minha conta
          </h1>
          <p className="mt-2 truncate font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {email || "—"}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          Sair
        </button>
      </header>

      {error && (
        <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Assinatura */}
      <section className="mt-10">
        <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          <span className="text-foreground">01</span>
          <span>Assinatura</span>
        </div>

        {isActive ? (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 bg-muted/30 px-6 py-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-2xl font-medium tracking-tight">
                    Plano lodi-t
                  </h2>
                  <StatusBadge status={sub?.status} />
                </div>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  R$ 13,90 / mês
                  {sub?.current_period_end && (
                    <>
                      {" · "}
                      {willCancel ? "encerra em " : "renova em "}
                      {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={onManage}
                disabled={busy}
                className="rounded-full border border-foreground/30 bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
              >
                Gerenciar no Stripe ↗
              </button>
            </div>
            {willCancel && (
              <p className="border-b border-border/60 bg-amber-500/10 px-6 py-3 text-xs text-amber-700 dark:text-amber-300">
                Assinatura programada para encerrar — acesso mantido até o fim do período pago.
              </p>
            )}
            <ul className="grid gap-3 px-6 py-5 text-sm sm:grid-cols-2">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-foreground/85">
                  <span aria-hidden className="mt-1.5 inline-block h-1 w-3 shrink-0 bg-foreground/60" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <div className="ring-soft relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-6 backdrop-blur-sm">
              <div className="absolute -inset-8 -z-10 bg-aurora opacity-60 blur-2xl" />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Plano recomendado
                </span>
                <StatusBadge status={sub?.status} />
              </div>
              <h2 className="mt-4 font-serif text-3xl font-medium tracking-tight">
                lodi-t
                <span className="ml-2 text-base text-muted-foreground">— calculadora PK</span>
              </h2>
              <p className="mt-2 font-serif text-4xl font-medium tracking-tight">
                R$ 13,90
                <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">/ mês</span>
              </p>
              <ul className="mt-5 space-y-2 text-sm text-foreground/85">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span aria-hidden className="mt-1.5 inline-block h-1 w-3 shrink-0 bg-foreground/60" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onSubscribe}
                disabled={busy}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform hover:-translate-y-px disabled:opacity-50"
              >
                Assinar agora <span aria-hidden>→</span>
              </button>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/40 p-6 backdrop-blur-sm">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Gratuito
              </span>
              <h3 className="mt-3 font-serif text-xl font-medium tracking-tight">
                Sou paciente do ASIPT
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pacientes com consulta concluída em diversidadebarrafunda.org
                têm liberação automática ao conectar a conta do ASIPT.
              </p>
              <a
                href="https://diversidadebarrafunda.org/lodi/conectar?redirect_uri=https://lodi-undet.lovable.app/calculadora"
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-foreground/40 hover:bg-accent"
              >
                Conectar ASIPT ↗
              </a>
            </div>
          </div>
        )}

        {checkoutOpen && !isActive && (
          <div className="mt-6 rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Pagamento seguro · Stripe
              </span>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                cancelar
              </button>
            </div>
            <StripeEmbeddedCheckout
              priceId="lodi_calc_monthly"
              returnUrl={window.location.origin + "/conta?session_id={CHECKOUT_SESSION_ID}"}
            />
          </div>
        )}
      </section>

      {/* Chaves de API */}
      <section className="mt-14">
        <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          <span className="text-foreground">02</span>
          <span>Chaves de API</span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-2xl font-medium tracking-tight">
              Acesso programático
            </h2>
            <Link
              to="/api-docs"
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Documentação ↗
            </Link>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Envie no header{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground">
              Authorization: Bearer SUA_CHAVE
            </code>
            . Disponível para assinantes ativos.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Nome da chave (ex: produção)"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-foreground/40 focus:outline-none"
            />
            <button
              onClick={onCreateKey}
              disabled={busy || !isActive || !newKeyName.trim()}
              className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              title={!isActive ? "Assine para criar chaves" : ""}
            >
              Criar chave
            </button>
          </div>
          {!isActive && (
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Assinatura ativa necessária
            </p>
          )}

          {createdKey && (
            <div className="mt-5 rounded-xl border border-foreground/30 bg-foreground/[0.04] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Copie agora — não será exibida novamente
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded bg-background px-3 py-2 font-mono text-[12.5px] text-foreground">
                  {createdKey}
                </code>
                <button
                  onClick={onCopyKey}
                  className="shrink-0 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium transition-colors hover:border-foreground/40 hover:bg-accent"
                >
                  {copied ? "Copiado ✓" : "Copiar"}
                </button>
              </div>
              <button
                onClick={() => setCreatedKey(null)}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground"
              >
                ok, guardei
              </button>
            </div>
          )}

          <ul className="mt-6 divide-y divide-border/60">
            {keys.length === 0 && (
              <li className="py-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Nenhuma chave criada ainda
              </li>
            )}
            {keys.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{k.name}</span>
                    {k.revoked_at && (
                      <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-destructive">
                        revogada
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
                    <span>{k.prefix}…</span>
                    {k.last_used_at && (
                      <span>
                        último uso: {new Date(k.last_used_at).toLocaleString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>
                {!k.revoked_at && (
                  <button
                    onClick={() => onRevoke(k.id)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                  >
                    revogar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
