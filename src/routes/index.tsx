import { createFileRoute } from "@tanstack/react-router";

import { EffectCards } from "@/components/EffectCards";
import { EffectsTimeline } from "@/components/EffectsTimeline";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { PkCalculator } from "@/components/PkCalculator";

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
    ],
    links: [
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
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8">
          <a href="#top" className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-medium tracking-tight">lodi-t</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              v2 · referência
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
      <section
        id="top"
        className="relative overflow-hidden border-b border-border/70"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, var(--color-trans-pink) 0px, transparent 40%), radial-gradient(circle at 80% 70%, var(--color-trans-blue) 0px, transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
          <div className="max-w-3xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Hormonização com testosterona
            </span>
            <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">
              Notas, cronologia e farmacocinética.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Página de referência. Inclui um modelo farmacocinético da testosterona e
              janelas temporais de efeitos descritas na literatura (Endocrine Society
              2017, WPATH SOC-8).
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-20 px-4 py-16 md:px-8 md:py-24">
        <MedicalDisclaimer />

        <section id="calculadora" className="scroll-mt-24">
          <PkCalculator />
        </section>

        <section id="cronologia" className="scroll-mt-24">
          <EffectsTimeline />
        </section>

        <section id="efeitos" className="scroll-mt-24">
          <EffectCards />
        </section>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p>lodi-t · página de referência, sem fim comercial.</p>
          <p className="font-mono uppercase tracking-[0.18em]">
            WPATH SOC-8 · Endocrine Society 2017
          </p>
        </div>
      </footer>
    </div>
  );
}
