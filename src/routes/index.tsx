import { createFileRoute, Link } from "@tanstack/react-router";

import lodiLogo from "@/assets/lodi-logo.png";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "lodi-t — Referência sobre hormonização com testosterona" },
      {
        name: "description",
        content:
          "Modelo farmacocinético da testosterona e cronologia de efeitos descritos na literatura (Endocrine Society 2017, WPATH SOC-8).",
      },
      {
        property: "og:title",
        content: "lodi-t — Referência sobre hormonização com testosterona",
      },
      {
        property: "og:description",
        content:
          "Calculadora PK de testosterona e cronologia de efeitos. Página educativa para apoio conceitual, sem finalidade prescritiva.",
      },
      { property: "og:url", content: "https://lodi-undet.lovable.app/" },
    ],
    links: [
      { rel: "canonical", href: "https://lodi-undet.lovable.app/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: "lodi-t — Referência sobre hormonização com testosterona",
          description:
            "Modelo farmacocinético do undecilato de testosterona e cronologia de efeitos descritos pela Endocrine Society 2017 e WPATH SOC-8.",
          url: "https://lodi-undet.lovable.app/",
          inLanguage: "pt-BR",
        }),
      },
    ],
  }),
  component: Index,
});

const cards = [
  {
    to: "/calculadora" as const,
    n: "01",
    eyebrow: "Farmacocinética",
    title: "Calculadora PK",
    desc: "Modelo do undecilato IM para ajuste individualizado dos intervalos posológicos.",
  },
  {
    to: "/cronologia" as const,
    n: "02",
    eyebrow: "Cronologia",
    title: "Janelas temporais",
    desc: "Início, pico e estabilização dos efeitos descritos na literatura.",
  },
  {
    to: "/efeitos" as const,
    n: "03",
    eyebrow: "Efeitos por sistema",
    title: "Mapa por sistema",
    desc: "Efeitos esperados, reversíveis e permanentes, organizados por sistema.",
  },
  {
    to: "/sobre" as const,
    n: "04",
    eyebrow: "Projeto de pesquisa",
    title: "Sobre o estudo",
    desc: "Racional, hipótese e métodos: satisfação e qualidade de vida após ajuste de intervalo por meta de Cmin.",
  },
];

function Index() {
  return (
    <>
      {/* Hero */}
      <section id="top" className="relative">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-14 md:px-8 md:pb-28 md:pt-20">
          <div className="animate-rise flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-foreground/40" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground" />
              </span>
              referência clínica
            </span>
            <span className="hidden h-px w-10 bg-border sm:inline-block" />
            <span>Schubert 2004</span>
            <span className="opacity-40">·</span>
            <span>Endocrine Society 2017</span>
            <span className="opacity-40">·</span>
            <span>WPATH SOC-8</span>
          </div>

          <div className="mt-10 grid items-end gap-12 md:grid-cols-[1.15fr_1fr]">
            <div>
              <h1 className="animate-rise delay-100 font-serif text-balance text-[2.4rem] font-medium leading-[1.02] tracking-tight sm:text-5xl md:text-[3.6rem]">
                <span className="block">Lógica para</span>
                <span className="block italic text-foreground/70">Dose Individualizada</span>
                <span className="mt-2 block text-foreground">
                  da{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10">testosterona</span>
                    <span
                      aria-hidden
                      className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded-sm"
                      style={{
                        background:
                          "linear-gradient(90deg, color-mix(in oklab, var(--trans-pink) 70%, transparent), color-mix(in oklab, var(--trans-blue) 70%, transparent))",
                      }}
                    />
                  </span>
                  .
                </span>
              </h1>

              <p className="animate-rise delay-200 mt-7 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                Modelo farmacocinético do undecilato de testosterona para ajuste
                individualizado dos intervalos posológicos, com cronologia de efeitos
                 descrita na literatura. Página educativa para apoio conceitual, sem finalidade prescritiva.
              </p>

              <div className="animate-rise delay-300 mt-9 flex flex-wrap items-center gap-3">
                <Link
                  to="/calculadora"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform hover:-translate-y-px"
                >
                  Abrir calculadora
                  <span aria-hidden>→</span>
                </Link>
                <Link
                  to="/cronologia"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-foreground/40"
                >
                  Ver cronologia
                </Link>
              </div>

              <dl className="animate-rise delay-400 mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-border/70 pt-6 font-mono text-xs">
                {[
                  { k: "1000 mg", v: "Undecilato IM" },
                  { k: "6–16 sem", v: "Intervalo ajustável" },
                  { k: "6 sistemas", v: "Efeitos descritos" },
                ].map((s) => (
                  <div key={s.k}>
                    <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {s.v}
                    </dt>
                    <dd className="mt-1 font-serif text-xl font-medium tracking-tight text-foreground">
                      {s.k}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="animate-rise delay-200 relative mx-auto w-full max-w-md">
              <div className="absolute -inset-8 -z-10 rounded-[2rem] bg-aurora opacity-80 blur-2xl" />
              <div className="ring-soft relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/70 p-8 backdrop-blur-sm">
                <div className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
                  L.O.D.I · emblema
                </div>
                <img
                  src={lodiLogo}
                  alt="L.O.D.I — emblema instrumental"
                  className="animate-float-slow mx-auto h-auto w-full max-w-[320px] select-none"
                  draggable={false}
                />
                <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  <span>Lógica · Dose · Individualizada</span>
                  <span className="text-foreground/70">— T</span>
                </div>
              </div>
              <span className="animate-drift glass absolute -left-4 top-10 hidden rounded-full border border-border/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/80 md:inline-block">
                PK · IM
              </span>
              <span className="animate-drift glass absolute -right-3 bottom-10 hidden rounded-full border border-border/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/80 md:inline-block">
                SOC-8
              </span>
            </div>
          </div>
        </div>

        <div className="relative border-y border-border/60 bg-card/40 py-3 backdrop-blur-sm">
          <div className="flex overflow-hidden">
            <div className="animate-marquee flex shrink-0 items-center gap-10 whitespace-nowrap pr-10 font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              {Array.from({ length: 2 }).map((_, i) => (
                <span key={i} className="flex items-center gap-10">
                  <span>● hormonização ≠ patologia</span>
                  <span>○ janelas temporais aproximadas</span>
                  <span>● variação individual relevante</span>
                  <span>○ não substitui acompanhamento clínico</span>
                  <span>● Endocrine Society 2017</span>
                  <span>○ WPATH SOC-8</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="relative mx-auto max-w-6xl space-y-16 px-4 py-16 md:px-8 md:py-24">
        <MedicalDisclaimer />

        <section>
          <div className="mb-8 flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <span className="text-foreground">índice</span>
            <span className="h-px w-8 bg-border" />
            <span>conteúdos</span>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {cards.map((c) => (
              <Link
                key={c.to}
                to={c.to}
                className="group ring-soft relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm transition-colors hover:border-foreground/30"
              >
                <div className="flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  <span className="text-foreground">{c.n}</span>
                  <span className="h-px w-8 bg-border" />
                  <span>{c.eyebrow}</span>
                </div>
                <h2 className="mt-5 font-serif text-2xl font-medium tracking-tight text-foreground">
                  {c.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  Abrir
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
