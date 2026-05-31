import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "/conta",
  }),
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Entrar — lodi-t" }],
  }),
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: search.redirect, replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate, search.redirect]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/login" },
        });
        if (error) throw error;
        setInfo("Cadastro feito. Verifique seu email para confirmar a conta.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err?.message ?? "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/login",
    });
    if (result.error) setError((result.error as any)?.message ?? "Erro Google.");
  }

  return (
    <main className="mx-auto max-w-md px-4 pb-20 pt-16 md:px-8">
      <h1 className="font-serif text-3xl tracking-tight">
        {mode === "signin" ? "Entrar" : "Criar conta"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Acesso à conta e às chaves da API lodi-t.
      </p>

      <button
        onClick={onGoogle}
        className="mt-8 w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent"
      >
        Continuar com Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email</label>
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Senha</label>
          <input
            type="password" required minLength={8} value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {info && <p className="text-sm text-foreground/80">{info}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-50"
        >
          {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Cadastrar"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-4 text-sm text-muted-foreground hover:text-foreground"
      >
        {mode === "signin" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entre"}
      </button>
    </main>
  );
}

void redirect;
