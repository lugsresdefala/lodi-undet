import { createFileRoute } from "@tanstack/react-router";

import { SectionEyebrow } from "@/components/SiteChrome";

export const Route = createFileRoute("/referencias")({
  head: () => ({
    meta: [
      { title: "Referências — lodi-t" },
      {
        name: "description",
        content:
          "Lista completa de referências usadas no lodi-t: modelo farmacocinético de Schubert e Behre & Nieschlag, Endocrine Society 2017 e WPATH SOC-8, com DOIs e links oficiais.",
      },
      { property: "og:title", content: "Referências — lodi-t" },
      {
        property: "og:description",
        content:
          "Fontes citadas no lodi-t com DOIs e links: PK do undecilato de testosterona, cronologia de efeitos e manejo clínico.",
      },
    ],
    links: [{ rel: "canonical", href: "https://lodi-undet.lovable.app/referencias" }],
  }),
  component: ReferenciasPage,
});

type Ref = {
  id: string;
  group: "PK" | "Clínica";
  authors: string;
  year: string;
  title: string;
  source: string;
  usedFor: string;
  doi?: string;
  url: string;
};

const refs: Ref[] = [
  {
    id: "schubert-2004",
    group: "PK",
    authors: "Schubert M, Minnemann T, Hübler D, et al.",
    year: "2004",
    title:
      "Intramuscular testosterone undecanoate: pharmacokinetic aspects of a novel testosterone formulation during long-term treatment of men with hypogonadism",
    source: "J Clin Endocrinol Metab, 89(11):5429–5434",
    usedFor:
      "Base do modelo farmacocinético populacional do undecilato de testosterona IM (Nebido/Reandron) usado no simulador.",
    doi: "10.1210/jc.2004-0897",
    url: "https://doi.org/10.1210/jc.2004-0897",
  },
  {
    id: "behre-1999",
    group: "PK",
    authors: "Behre HM, Nieschlag E.",
    year: "1999",
    title:
      "Comparative pharmacokinetics of testosterone esters",
    source:
      "In: Nieschlag E, Behre HM (eds). Testosterone: Action, Deficiency, Substitution. 2nd ed. Springer.",
    usedFor:
      "Calibração e comparação entre ésteres de testosterona; parametrização auxiliar do modelo PK.",
    url: "https://link.springer.com/book/10.1007/978-3-642-72185-4",
  },
  {
    id: "endo-2017",
    group: "Clínica",
    authors:
      "Hembree WC, Cohen-Kettenis PT, Gooren L, Hannema SE, Meyer WJ, Murad MH, Rosenthal SM, Safer JD, Tangpricha V, T'Sjoen GG.",
    year: "2017",
    title:
      "Endocrine treatment of gender-dysphoric/gender-incongruent persons: an Endocrine Society clinical practice guideline",
    source: "J Clin Endocrinol Metab, 102(11):3869–3903",
    usedFor:
      "Cronologia esperada de efeitos da hormonização com testosterona e faixas de referência clínica.",
    doi: "10.1210/jc.2017-01658",
    url: "https://academic.oup.com/jcem/article/102/11/3869/4157558",
  },
  {
    id: "wpath-soc8",
    group: "Clínica",
    authors:
      "Coleman E, Radix AE, Bouman WP, et al.",
    year: "2022",
    title:
      "Standards of Care for the Health of Transgender and Gender Diverse People, Version 8 (SOC-8)",
    source: "International Journal of Transgender Health, 23(sup1):S1–S259",
    usedFor:
      "Manejo clínico, princípios de cuidado individualizado e consentimento informado.",
    doi: "10.1080/26895269.2022.2100644",
    url: "https://www.wpath.org/soc8",
  },
];

function RefItem({ r }: { r: Ref }) {
  return (
    <li id={r.id} className="scroll-mt-24 border-t border-border/60 pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {r.group} · {r.year}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {r.id}
        </span>
      </div>
      <p className="mt-2 text-sm text-foreground">{r.authors}</p>
      <p className="mt-1 font-serif text-lg leading-snug text-foreground">{r.title}.</p>
      <p className="mt-1 text-sm text-muted-foreground">{r.source}.</p>
      <p className="mt-3 text-sm text-muted-foreground">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground">
          Uso no lodi-t —{" "}
        </span>
        {r.usedFor}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {r.doi && (
          <a
            href={`https://doi.org/${r.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline-offset-4 hover:underline"
          >
            DOI: {r.doi} ↗
          </a>
        )}
        <a
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Acessar fonte ↗
        </a>
      </div>
    </li>
  );
}

function ReferenciasPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 md:px-8 md:py-24">
      <SectionEyebrow n="00" label="Referências" />
      <h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl">
        Referências
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Fontes que sustentam o modelo farmacocinético, a cronologia de efeitos e o manejo
        clínico apresentados no lodi-t. Quando disponível, o DOI leva ao registro oficial
        da publicação.
      </p>

      <section className="mt-12">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Farmacocinética
        </h2>
        <ul className="mt-6 space-y-6">
          {refs.filter((r) => r.group === "PK").map((r) => (
            <RefItem key={r.id} r={r} />
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Efeitos, cronologia e manejo clínico
        </h2>
        <ul className="mt-6 space-y-6">
          {refs.filter((r) => r.group === "Clínica").map((r) => (
            <RefItem key={r.id} r={r} />
          ))}
        </ul>
      </section>

      <p className="mt-16 border-t border-border/60 pt-6 text-xs text-muted-foreground">
        Esta página tem caráter de referência clínica. Não substitui acompanhamento
        médico individualizado.
      </p>
    </main>
  );
}
