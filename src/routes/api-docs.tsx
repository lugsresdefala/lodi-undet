import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api-docs")({
  component: ApiDocs,
  head: () => ({
    meta: [
      { title: "API — lodi-t" },
      { name: "description", content: "Documentação da API pública do motor farmacocinético lodi-t." },
    ],
  }),
});

function Endpoint({ method, path, body, returns }: {
  method: string; path: string; body?: string; returns: string;
}) {
  return (
    <section className="mt-8 rounded-lg border border-border bg-card/40 p-5">
      <p className="font-mono text-sm">
        <span className="rounded bg-foreground px-1.5 py-0.5 text-xs text-background">{method}</span>{" "}
        <span className="text-foreground">{path}</span>
      </p>
      {body && (
        <>
          <p className="mt-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Body</p>
          <pre className="mt-1 overflow-x-auto rounded bg-background/60 p-3 text-xs">{body}</pre>
        </>
      )}
      <p className="mt-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Retorna</p>
      <p className="mt-1 text-sm text-muted-foreground">{returns}</p>
    </section>
  );
}

function ApiDocs() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:px-8">
      <h1 className="font-serif text-3xl tracking-tight">API lodi-t</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Acesso programático ao motor farmacocinético (simulação, métricas, Monte Carlo e recomendação de
        intervalo). Requer assinatura ativa e chave criada em <code>/conta</code>.
      </p>

      <h2 className="mt-10 font-serif text-xl">Autenticação</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Envie sua chave no cabeçalho:
      </p>
      <pre className="mt-2 rounded bg-card/60 p-3 font-mono text-xs">Authorization: Bearer lodi_xxxxxxxxxxxx</pre>
      <p className="mt-2 text-xs text-muted-foreground">
        Limite: 60 requisições por minuto, por chave. Respostas: <code>200</code> ok, <code>401</code> chave
        inválida, <code>402</code> sem assinatura, <code>429</code> limite, <code>400</code> erro de entrada.
      </p>

      <h2 className="mt-10 font-serif text-xl">Endpoints</h2>

      <Endpoint
        method="GET" path="/api/public/v1/health"
        returns="status do serviço (não requer chave)."
      />

      <Endpoint
        method="POST" path="/api/public/v1/simulate"
        body={`{
  "doses": [{ "diaDose": 0, "doseMg": 1000 }, { "diaDose": 42, "doseMg": 1000 }],
  "params": { ... } | undefined,
  "config": { "passoDias": 0.5, "horizonteDias": 730 } | undefined
}`}
        returns="{ perfil: PontoCurva[], metricas: MetricasPK, metricasSS }"
      />

      <Endpoint
        method="POST" path="/api/public/v1/montecarlo"
        body={`{
  "doses": [...],
  "nSimulacoes": 200,
  "config": { ... } | undefined
}`}
        returns="ResultadoMonteCarlo com percentis (p5/p25/mediana/p75/p95) e métricas populacionais."
      />

      <Endpoint
        method="POST" path="/api/public/v1/recommend-interval"
        body={`{
  "doseMg": 1000,
  "intervaloDias": 84,
  "cmaxObsNgdl": 900,
  "cminObsNgdl": 350,
  "cavgAlvoNgdl": 600
}`}
        returns="RecomendacaoIntervalo (intervalo ótimo entre 6 e 16 sem, justificativa, sensibilidade individual)."
      />

      <h2 className="mt-10 font-serif text-xl">Exemplo (curl)</h2>
      <pre className="mt-2 overflow-x-auto rounded bg-card/60 p-3 font-mono text-xs">{`curl -X POST https://lodi-undet.lovable.app/api/public/v1/simulate \\
  -H "Authorization: Bearer lodi_XXXXX" \\
  -H "Content-Type: application/json" \\
  -d '{"doses":[{"diaDose":0,"doseMg":1000},{"diaDose":42,"doseMg":1000}]}'`}</pre>
    </main>
  );
}
