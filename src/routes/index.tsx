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
          inLanguage: "pt-BR",
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8">
          <a href="#top" className="flex items-center gap-3">
            <img
              src={lodiLogo}
              alt="L.O.D.I"
              className="h-12 w-auto select-none object-contain"
              draggable={false}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              referência
            </span>
          </a>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#calculadora" className="transition-colors hover:text-foreground">
              Calculadora
            </a>
            <a href="#cronologia" className="transition-colors hover:text-foreground">
              Cronologia
            </a>
            <a href="#efeitos" className="transition-colors hover:text-foreground">
              Efeitos
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="lodi-instrument-field relative overflow-hidden border-b border-border/70">
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Hormonização com testosterona — referência clínica
              </span>
              <h1 className="mt-4 font-serif text-3xl font-medium leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
                Lógica para Dose Individualizada — Notas, cronologia e farmacocinética.
              </h1>
              {/* tick rule — eco do mostrador instrumental do emblema */}
              <div
                aria-hidden
                className="mt-6 h-3 w-40 max-w-full opacity-60"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to right, var(--color-foreground) 0 1px, transparent 1px 8px)",
                  WebkitMaskImage:
                    "linear-gradient(to right, black, black 85%, transparent)",
                  maskImage:
                    "linear-gradient(to right, black, black 85%, transparent)",
                }}
              />
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
                Modelo farmacocinético do undecilato de testosterona para ajuste
                individualizado dos intervalos posológicos. Janelas temporais de efeitos
                descritas na literatura (Endocrine Society 2017, WPATH SOC-8). Página
                educativa, não dosimétrica.
              </p>
            </div>
            <div className="relative mx-auto w-full max-w-lg">
              <img
                src={lodiLogo}
                alt="L.O.D.I — emblema instrumental"
                className="lodi-hero-logo h-auto w-full select-none"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-20 px-4 py-16 md:px-8 md:py-24">
        <MedicalDisclaimer />

        <section id="calculadora" className="scroll-mt-24">
          <Simulator />
        </section>

        <section id="cronologia" className="scroll-mt-24">
          <EffectsTimeline />
        </section>

        <section id="efeitos" className="scroll-mt-24">
          <EffectCards />
        </section>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p>lodi-t · página de referência, sem fim comercial.</p>
          <a
            href="https://diversidadebarrafunda.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            diversidadebarrafunda.org ↗
          </a>
          <p>Tiago José de Oliveira Gomes — CRM 164375</p>
          <p className="font-mono uppercase tracking-[0.18em]">
            WPATH SOC-8 · Endocrine Society 2017
          </p>
        </div>
      </footer>
    </div>
  );
}
