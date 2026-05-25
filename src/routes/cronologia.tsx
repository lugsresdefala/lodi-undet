import { createFileRoute, Link } from "@tanstack/react-router";

import { EffectsTimeline } from "@/components/EffectsTimeline";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { SectionEyebrow } from "@/components/SiteChrome";

export const Route = createFileRoute("/cronologia")({
  head: () => ({
    meta: [
      { title: "Cronologia dos efeitos — lodi-t" },
      {
        name: "description",
        content:
          "Janelas temporais de início, pico e estabilização dos efeitos da hormonização com testosterona.",
      },
      { property: "og:title", content: "Cronologia dos efeitos — lodi-t" },
      {
        property: "og:description",
        content:
          "Cronologia descrita na literatura (Endocrine Society 2017, WPATH SOC-8).",
      },
    ],
    links: [{ rel: "canonical", href: "https://lodi-undet.lovable.app/cronologia" }],
  }),
  component: CronologiaPage,
});

function CronologiaPage() {
  return (
    <main className="relative mx-auto max-w-6xl space-y-12 px-4 py-14 md:px-8 md:py-20">
      <header>
        <SectionEyebrow n="02" label="Cronologia" />
        <h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl">
          Janelas temporais
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Início, pico e estabilização dos efeitos descritos na literatura.
        </p>
      </header>
      <MedicalDisclaimer />
      <EffectsTimeline />
      <nav className="flex flex-wrap gap-3 border-t border-border/60 pt-8 font-mono text-[11px] uppercase tracking-[0.22em]">
        <Link to="/calculadora" className="text-muted-foreground hover:text-foreground">
          → calculadora
        </Link>
        <Link to="/efeitos" className="text-muted-foreground hover:text-foreground">
          → efeitos por sistema
        </Link>
      </nav>
    </main>
  );
}
