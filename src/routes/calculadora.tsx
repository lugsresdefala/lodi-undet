import { createFileRoute, Link } from "@tanstack/react-router";

import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { SectionEyebrow } from "@/components/SiteChrome";
import Simulator from "@/components/Simulator";

export const Route = createFileRoute("/calculadora")({
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
          "Modelo PK do undecilato de testosterona. Página educativa, não dosimétrica.",
      },
    ],
    links: [{ rel: "canonical", href: "https://lodi-undet.lovable.app/calculadora" }],
  }),
  component: CalculadoraPage,
});

function CalculadoraPage() {
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
