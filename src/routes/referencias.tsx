import { createFileRoute } from "@tanstack/react-router";

import { SectionEyebrow } from "@/components/SiteChrome";

export const Route = createFileRoute("/referencias")({
  head: () => ({
    meta: [
      { title: "Referências — lodi-t" },
      {
        name: "description",
        content:
          "Lista completa de referências em formato ABNT usadas no lodi-t: Schubert (2004), Behre e Nieschlag (1999), Endocrine Society (2017) e WPATH SOC-8 (2022), com DOIs e links oficiais.",
      },
      { property: "og:title", content: "Referências — lodi-t" },
      {
        property: "og:description",
        content:
          "Fontes citadas no lodi-t em formato ABNT, com DOIs e links: PK do undecilato de testosterona, cronologia de efeitos e manejo clínico.",
      },
    ],
    links: [{ rel: "canonical", href: "https://lodi-undet.lovable.app/referencias" }],
  }),
  component: ReferenciasPage,
});

type Ref = {
  id: string;
  group: "PK" | "Clínica";
  authors: string; // ABNT: SOBRENOME, Iniciais.
  year: string;
  title: string; // título principal sem ponto final
  publication: React.ReactNode; // restante da referência ABNT após o título
  usedFor: string;
  doi?: string;
  url: string;
};

const refs: Ref[] = [
  {
    id: "schubert-2004",
    group: "PK",
    authors: "SCHUBERT, M.; MINNEMANN, T.; HÜBLER, D. et al.",
    year: "2004",
    title:
      "Intramuscular testosterone undecanoate: pharmacokinetic aspects of a novel testosterone formulation during long-term treatment of men with hypogonadism",
    publication: (
      <>
        <em>The Journal of Clinical Endocrinology &amp; Metabolism</em>, [s. l.], v. 89,
        n. 11, p. 5429-5434, nov. 2004.
      </>
    ),
    usedFor:
      "Base do modelo farmacocinético populacional do undecilato de testosterona IM (Nebido/Reandron) usado no simulador.",
    doi: "10.1210/jc.2004-0897",
    url: "https://doi.org/10.1210/jc.2004-0897",
  },
  {
    id: "behre-1999",
    group: "PK",
    authors: "BEHRE, H. M.; NIESCHLAG, E.",
    year: "1999",
    title: "Comparative pharmacokinetics of testosterone esters",
    publication: (
      <>
        In: NIESCHLAG, E.; BEHRE, H. M. (ed.).{" "}
        <em>Testosterone: action, deficiency, substitution</em>. 2. ed. Berlin: Springer,
        1999.
      </>
    ),
    usedFor:
      "Calibração e comparação entre ésteres de testosterona; parametrização auxiliar do modelo PK.",
    url: "https://link.springer.com/book/10.1007/978-3-642-72185-4",
  },
  {
    id: "endo-2017",
    group: "Clínica",
    authors:
      "HEMBREE, W. C.; COHEN-KETTENIS, P. T.; GOOREN, L.; HANNEMA, S. E.; MEYER, W. J.; MURAD, M. H.; ROSENTHAL, S. M.; SAFER, J. D.; TANGPRICHA, V.; T'SJOEN, G. G.",
    year: "2017",
    title:
      "Endocrine treatment of gender-dysphoric/gender-incongruent persons: an Endocrine Society clinical practice guideline",
    publication: (
      <>
        <em>The Journal of Clinical Endocrinology &amp; Metabolism</em>, [s. l.], v. 102,
        n. 11, p. 3869-3903, nov. 2017.
      </>
    ),
    usedFor:
      "Cronologia esperada de efeitos da hormonização com testosterona e faixas de referência clínica.",
    doi: "10.1210/jc.2017-01658",
    url: "https://academic.oup.com/jcem/article/102/11/3869/4157558",
  },
  {
    id: "wpath-soc8",
    group: "Clínica",
    authors: "COLEMAN, E.; RADIX, A. E.; BOUMAN, W. P. et al.",
    year: "2022",
    title:
      "Standards of care for the health of transgender and gender diverse people, version 8",
    publication: (
      <>
        <em>International Journal of Transgender Health</em>, [s. l.], v. 23, sup. 1, p.
        S1-S259, 2022.
      </>
    ),
    usedFor:
      "Manejo clínico, princípios de cuidado individualizado e consentimento informado.",
    doi: "10.1080/26895269.2022.2100644",
    url: "https://www.wpath.org/soc8",
  },
];

function RefItem({ r }: { r: Ref }) {
  return (
    <li
      id={r.id}
      className="scroll-mt-24 border-t border-border/60 pt-6 first:border-t-0 first:pt-0"
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {r.group} · {r.year}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {r.id}
        </span>
      </div>

      <p className="mt-3 text-[15px] leading-relaxed text-foreground">
        <span className="font-medium">{r.authors}</span> {r.title}.{" "}
        <span className="text-muted-foreground">{r.publication}</span>
        {r.doi && (
          <>
            {" "}
            <span className="text-muted-foreground">
              DOI:{" "}
              <a
                href={`https://doi.org/${r.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline-offset-4 hover:underline"
              >
                {r.doi}
              </a>
              .
            </span>
          </>
        )}{" "}
        <a
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Acessar fonte ↗
        </a>
      </p>

      <p className="mt-3 text-sm text-muted-foreground">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground">
          Uso no lodi-t —{" "}
        </span>
        {r.usedFor}
      </p>
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
        clínico apresentados no lodi-t. Citações no formato ABNT (NBR 6023). Quando
        disponível, o DOI leva ao registro oficial da publicação.
      </p>

      <section className="mt-12">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Farmacocinética
        </h2>
        <ul className="mt-6 space-y-6">
          {refs
            .filter((r) => r.group === "PK")
            .map((r) => (
              <RefItem key={r.id} r={r} />
            ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Efeitos, cronologia e manejo clínico
        </h2>
        <ul className="mt-6 space-y-6">
          {refs
            .filter((r) => r.group === "Clínica")
            .map((r) => (
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
