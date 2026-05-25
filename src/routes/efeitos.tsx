import { createFileRoute, Link } from "@tanstack/react-router";

import { EffectCards } from "@/components/EffectCards";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { SectionEyebrow } from "@/components/SiteChrome";

export const Route = createFileRoute("/efeitos")({
  head: () => ({
    meta: [
      { title: "Efeitos por sistema — lodi-t" },
      {
        name: "description",
        content:
          "Efeitos da hormonização com testosterona organizados por sistema, com distinção entre reversíveis e permanentes.",
      },
      { property: "og:title", content: "Efeitos por sistema — lodi-t" },
      {
        property: "og:description",
        content:
          "Mapa por sistema dos efeitos descritos na literatura clínica.",
      },
    ],
    links: [{ rel: "canonical", href: "https://lodi-undet.lovable.app/efeitos" }],
  }),
  component: EfeitosPage,
});

function EfeitosPage() {
  return (
    <main className="relative mx-auto max-w-6xl space-y-12 px-4 py-14 md:px-8 md:py-20">
      <header>
        <SectionEyebrow n="03" label="Efeitos por sistema" />
        <h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl">
          Mapa por sistema
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Efeitos esperados, reversíveis e permanentes, organizados por sistema.
        </p>
      </header>
      <MedicalDisclaimer />
      <EffectCards />
      <nav className="flex flex-wrap gap-3 border-t border-border/60 pt-8 font-mono text-[11px] uppercase tracking-[0.22em]">
        <Link to="/calculadora" className="text-muted-foreground hover:text-foreground">
          → calculadora
        </Link>
        <Link to="/cronologia" className="text-muted-foreground hover:text-foreground">
          → cronologia
        </Link>
      </nav>
    </main>
  );
}
