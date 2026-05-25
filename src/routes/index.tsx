import { createFileRoute } from "@tanstack/react-router";

import lodiLogo from "@/assets/lodi-logo.png";
import { EffectCards } from "@/components/EffectCards";
import { EffectsTimeline } from "@/components/EffectsTimeline";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import Simulator from "@/components/Simulator";

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
          "Calculadora PK de testosterona e cronologia de efeitos. Página educativa, não dosimétrica.",
      },
      { property: "og:url", content: "https://lodi-undet.lovable.app/" },
    ],
    links: [
      { rel: "canonical", href: "https://lodi-undet.lovable.app/" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
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
          inLanguage: "pt-PT",
          about: {
            "@type": "MedicalCondition",
            name: "Hormonização masculinizante com testosterona",
          },
          citation: [
            {
              "@type": "CreativeWork",
              name: "Endocrine Society Clinical Practice Guideline 2017 — Endocrine Treatment of Gender-Dysphoric/Gender-Incongruent Persons",
              url: "https://academic.oup.com/jcem/article/102/11/3869/4157558",
            },
            {
              "@type": "CreativeWork",
              name: "WPATH Standards of Care, version 8 (SOC-8)",
              url: "https://www.wpath.org/soc8",
            },
          ],
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      {/* Ambient aurora + grid + grain backdrop */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-aurora opacity-70" />
        <div className="absolute inset-0 bg-grid-fine opacity-60" />
        <div className="absolute inset-0 bg-noise opacity-[0.18] mix-blend-multiply" />
      </div>

      {/* Top bar — glass */}
      <header className="sticky top-0 z-40 border-b border-border/60 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <a href="#top" className="group flex items-baseline gap-3">
            <span className="font-serif text-xl font-medium tracking-tight">lodi-t</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:inline">
              v2 · referência clínica
            </span>
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            {[
              ["#calculadora", "Calculadora"],
              ["#cronologia", "Cronologia"],
              ["#efeitos", "Efeitos"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {label}
              </a>
            ))}
            <span className="mx-2 h-4 w-px bg-border" />
            <a
              href="#calculadora"
              className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-transform hover:-translate-y-px"
            >
              Abrir simulador
              <span aria-hidden>→</span>
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-14 md:px-8 md:pb-28 md:pt-20">
          {/* Eyebrow row */}
          <div className="animate-rise flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-foreground/40" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground" />
              </span>
              referência viva
            </span>
            <span className="hidden h-px w-10 bg-border sm:inline-block" />
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
                descrita na literatura. Página educativa, não dosimétrica.
              </p>

              <div className="animate-rise delay-300 mt-9 flex flex-wrap items-center gap-3">
                <a
                  href="#calculadora"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform hover:-translate-y-px"
                >
                  Abrir calculadora
                  <span aria-hidden>→</span>
                </a>
                <a
                  href="#cronologia"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-foreground/40"
                >
                  Ver cronologia
                </a>
              </div>

              {/* Stat row */}
              <dl className="animate-rise delay-400 mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-border/70 pt-6 font-mono text-xs">
                {[
                  { k: "1000 mg", v: "Undecilato IM" },
                  { k: "10–14 sem", v: "Intervalo típico" },
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

            {/* Logo plate */}
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

              {/* Decorative floating tags */}
              <span className="animate-drift glass absolute -left-4 top-10 hidden rounded-full border border-border/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/80 md:inline-block">
                PK · IM
              </span>
              <span className="animate-drift glass absolute -right-3 bottom-10 hidden rounded-full border border-border/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/80 md:inline-block">
                SOC-8
              </span>
            </div>
          </div>
        </div>

        {/* Marquee strip */}
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

      <main className="relative mx-auto max-w-6xl space-y-24 px-4 py-20 md:px-8 md:py-28">
        <MedicalDisclaimer />

        <section id="calculadora" className="scroll-mt-24">
          <div className="mb-6 flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <span className="text-foreground">01</span>
            <span className="h-px w-8 bg-border" />
            <span>Farmacocinética</span>
          </div>
          <Simulator />
        </section>

        <section id="cronologia" className="scroll-mt-24">
          <div className="mb-6 flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <span className="text-foreground">02</span>
            <span className="h-px w-8 bg-border" />
            <span>Cronologia</span>
          </div>
          <EffectsTimeline />
        </section>

        <section id="efeitos" className="scroll-mt-24">
          <div className="mb-6 flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <span className="text-foreground">03</span>
            <span className="h-px w-8 bg-border" />
            <span>Efeitos por sistema</span>
          </div>
          <EffectCards />
        </section>
      </main>

      <footer className="relative border-t border-border/70 bg-card/40 backdrop-blur-sm">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-lg font-medium tracking-tight">lodi-t</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                referência
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Página de referência educativa sobre hormonização com testosterona. Sem fim
              comercial.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Responsável
            </p>
            <p className="mt-2 text-foreground">Tiago José de Oliveira Gomes</p>
            <p className="text-muted-foreground">CRM 164375</p>
          </div>
          <div className="text-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Fontes
            </p>
            <p className="mt-2 text-foreground">WPATH SOC-8</p>
            <p className="text-foreground">Endocrine Society 2017</p>
            <a
              href="https://diversidadebarrafunda.org"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              diversidadebarrafunda.org ↗
            </a>
          </div>
        </div>
        <div className="border-t border-border/60">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground md:px-8">
            <span>© lodi-t · {new Date().getFullYear()}</span>
            <span>feito com cuidado clínico</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

