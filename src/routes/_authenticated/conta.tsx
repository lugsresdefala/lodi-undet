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

export const Route = createFileRoute("/_authenticated/conta")({
  component: ContaPage,
  head: () => ({ meta: [{ title: "Minha conta — lodi-t" }] }),
});

function ContaPage() {
  const env = hasPaymentsConfigured() ? getStripeEnvironment() : "sandbox";
  const fetchKeys = useServerFn(listApiKeys);
  const fetchSub = useServerFn(getMySubscription);
  const createKey = useServerFn(createApiKey);
  const revoke = useServerFn(revokeApiKey);
  const portal = useServerFn(createPortalSession);

  const [keys, setKeys] = useState<any[]>([]);
  const [sub, setSub] = useState<any>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  async function refresh() {
    const [k, s] = await Promise.all([fetchKeys(), fetchSub({ data: { environment: env } })]);
    setKeys(k as any[]);
    setSub(s);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    refresh();

    // Após retorno do Stripe (?session_id=...), aguarda o webhook ativar a
    // assinatura: faz polling curto de até ~20s até o status virar active/trialing.
    const params = new URLSearchParams(window.location.search);
    if (params.get("session_id")) {
      setCheckoutOpen(false);
      let tries = 0;
      const iv = setInterval(async () => {
        tries += 1;
        const s: any = await fetchSub({ data: { environment: env } });
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

  const isActive = sub && ["active", "trialing"].includes(sub.status);

  function onSubscribe() {
    setError(null);
    if (!hasPaymentsConfigured()) {
      setError("Pagamentos não configurados neste ambiente.");
      return;
    }
    setCheckoutOpen(true);
  }

  async function onManage() {
    setBusy(true); setError(null);
    const r = await portal({ data: { returnUrl: window.location.origin + "/conta", environment: env } });
    setBusy(false);
    if ("error" in r) { setError(r.error); return; }
    window.open(r.url, "_blank");
  }

  async function onCreateKey() {
    if (!newKeyName.trim()) return;
    setBusy(true); setError(null);
    try {
      const r = await createKey({ data: { name: newKeyName.trim() } });
      setCreatedKey((r as any).plainKey);
      setNewKeyName("");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Erro ao criar chave.");
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(id: string) {
    if (!confirm("Revogar esta chave?")) return;
    await revoke({ data: { id } });
    await refresh();
  }

  async function onLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 md:px-8">
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-3xl tracking-tight">Minha conta</h1>
        <button onClick={onLogout} className="text-xs text-muted-foreground hover:text-foreground">
          Sair
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{email}</p>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <section className="mt-10 rounded-lg border border-border bg-card/40 p-6">
        <h2 className="font-serif text-xl">Assinatura</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Status: <span className="text-foreground">{sub?.status ?? "sem assinatura"}</span>
          {sub?.current_period_end && (
            <> · até {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}</>
          )}
        </p>
        <div className="mt-4">
          {isActive ? (
            <button onClick={onManage} disabled={busy}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50">
              Gerenciar assinatura
            </button>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button onClick={onSubscribe} disabled={busy}
                className="rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50">
                Assinar (R$ 13,90/mês)
              </button>
              <a
                href="https://diversidadebarrafunda.org/lodi/conectar?redirect_uri=https://lodi-undet.lovable.app/calculadora"
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
              >
                Sou paciente da Diversidade Barra Funda
              </a>
            </div>
          )}
        </div>
        {checkoutOpen && !isActive && (
          <div className="mt-6">
            <StripeEmbeddedCheckout
              priceId="lodi_calc_monthly"
              returnUrl={window.location.origin + "/conta"}
            />
            <button
              onClick={() => setCheckoutOpen(false)}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground"
            >
              cancelar
            </button>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-lg border border-border bg-card/40 p-6">
        <h2 className="font-serif text-xl">Chaves de API</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Use no header <code className="font-mono">Authorization: Bearer SUA_CHAVE</code>. Veja a{" "}
          <Link to="/api-docs" className="underline">documentação</Link>.
        </p>

        <div className="mt-4 flex gap-2">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Nome da chave (ex: produção)"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={onCreateKey} disabled={busy || !isActive}
            className="rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
            title={!isActive ? "Assine para criar chaves" : ""}
          >
            Criar chave
          </button>
        </div>

        {createdKey && (
          <div className="mt-4 rounded-md border border-foreground/30 bg-foreground/5 p-3">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Copie agora — não será exibida novamente
            </p>
            <code className="mt-1 block break-all font-mono text-sm">{createdKey}</code>
            <button onClick={() => setCreatedKey(null)} className="mt-2 text-xs text-muted-foreground hover:text-foreground">
              ok, copiei
            </button>
          </div>
        )}

        <ul className="mt-4 divide-y divide-border">
          {keys.length === 0 && (
            <li className="py-3 text-sm text-muted-foreground">Nenhuma chave ainda.</li>
          )}
          {keys.map((k) => (
            <li key={k.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <span className="font-medium">{k.name}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">{k.prefix}…</span>
                {k.revoked_at && <span className="ml-2 text-xs text-destructive">revogada</span>}
                {k.last_used_at && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    último uso: {new Date(k.last_used_at).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
              {!k.revoked_at && (
                <button onClick={() => onRevoke(k.id)}
                  className="text-xs text-destructive hover:underline">
                  revogar
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
