// Expected masculinizing effects of testosterone therapy.
// Onset/maximum windows derived from the Endocrine Society 2017 Clinical
// Practice Guideline (Hembree et al., JCEM 2017, Table 13) and WPATH SOC-8.
// Individual variation is large; not all changes are reversible.

export type System = "endocrine" | "skin" | "body" | "mind" | "repro" | "voice";

export interface EffectEntry {
  id: string;
  title: string;
  system: System;
  /** Onset window, in months from start of therapy */
  onsetMonths: [number, number];
  /** Window in which the effect typically reaches its plateau */
  maxMonths: [number, number];
  reversible: boolean;
  notes: string;
}

export const SYSTEMS: Record<System, { label: string; tokenVar: string }> = {
  endocrine: { label: "Endócrino", tokenVar: "var(--color-system-endocrine)" },
  skin: { label: "Pele e pelos", tokenVar: "var(--color-system-skin)" },
  body: { label: "Corpo", tokenVar: "var(--color-system-body)" },
  mind: { label: "Mente", tokenVar: "var(--color-system-mind)" },
  repro: { label: "Reprodutor", tokenVar: "var(--color-system-repro)" },
  voice: { label: "Voz", tokenVar: "var(--color-system-voice)" },
};

export const EFFECTS: EffectEntry[] = [
  {
    id: "skin-oil",
    title: "Aumento da oleosidade da pele",
    system: "skin",
    onsetMonths: [1, 6],
    maxMonths: [12, 24],
    reversible: true,
    notes:
      "Mais perceptível no primeiro ano e tende a estabilizar. Pode ou não cursar com acne. (Endocrine Society 2017)",
  },
  {
    id: "facial-body-hair",
    title: "Pelos faciais e corporais",
    system: "skin",
    onsetMonths: [6, 12],
    maxMonths: [48, 60],
    reversible: false,
    notes:
      "Início típico em 6–12 meses; densidade máxima pode levar 4–5 anos. Distribuição e densidade dependem fortemente da genética. (Endocrine Society 2017)",
  },
  {
    id: "scalp-loss",
    title: "Rarefação capilar de padrão androgénico",
    system: "skin",
    onsetMonths: [12, 24],
    maxMonths: [60, 120],
    reversible: false,
    notes:
      "Ocorre na presença de predisposição genética. Curso e intensidade variáveis; para alguns é desejado, para outros não.",
  },
  {
    id: "muscle-mass",
    title: "Aumento de massa muscular e força",
    system: "body",
    onsetMonths: [6, 12],
    maxMonths: [24, 60],
    reversible: false,
    notes:
      "Potenciado por treino de resistência e nutrição adequada. Reverte parcialmente se a hormonização for interrompida.",
  },
  {
    id: "fat-redist",
    title: "Redistribuição de gordura",
    system: "body",
    onsetMonths: [1, 6],
    maxMonths: [24, 60],
    reversible: true,
    notes:
      "Redução na região de quadris/coxas e aumento na região abdominal. Reversível com a interrupção da hormonização. (Endocrine Society 2017)",
  },
  {
    id: "menses-stop",
    title: "Cessação da menstruação",
    system: "repro",
    onsetMonths: [1, 6],
    maxMonths: [1, 6],
    reversible: true,
    notes:
      "Geralmente nos primeiros 6 meses. Pode haver spotting intermitente. A ausência de menstruação não equivale a infertilidade.",
  },
  {
    id: "clitoral",
    title: "Crescimento clitoriano",
    system: "repro",
    onsetMonths: [1, 6],
    maxMonths: [12, 24],
    reversible: false,
    notes:
      "Crescimento típico de 1–3 cm, com variação individual. Permanente. (Endocrine Society 2017)",
  },
  {
    id: "vaginal-atrophy",
    title: "Alterações da mucosa vaginal",
    system: "repro",
    onsetMonths: [1, 6],
    maxMonths: [12, 24],
    reversible: true,
    notes:
      "Pode haver ressecamento e maior fragilidade da mucosa. Quando incómodo, hidratantes ou estrogénio tópico em baixa dose aliviam sem comprometer a masculinização.",
  },
  {
    id: "voice",
    title: "Engrossamento da voz",
    system: "voice",
    onsetMonths: [6, 12],
    maxMonths: [12, 24],
    reversible: false,
    notes:
      "Início típico aos 6–12 meses. Mudança permanente das pregas vocais. Acompanhamento fonoaudiológico pode optimizar projecção e ressonância. (Endocrine Society 2017)",
  },
  {
    id: "libido",
    title: "Alteração da libido",
    system: "mind",
    onsetMonths: [0.25, 3],
    maxMonths: [3, 6],
    reversible: true,
    notes:
      "Frequentemente perceptível nas primeiras semanas; magnitude variável. Tende a estabilizar com o tempo.",
  },
  {
    id: "mood",
    title: "Alterações de humor e bem-estar",
    system: "mind",
    onsetMonths: [0.5, 3],
    maxMonths: [3, 12],
    reversible: true,
    notes:
      "Muitas pessoas relatam melhora do bem-estar e redução da disforia. Oscilações iniciais são comuns e tendem a estabilizar. Não há evidência de que a testosterona cause patologia psiquiátrica.",
  },
  {
    id: "fertility",
    title: "Redução da fertilidade",
    system: "repro",
    onsetMonths: [1, 6],
    maxMonths: [3, 12],
    reversible: false,
    notes:
      "Reversibilidade incerta e variável após a interrupção. A testosterona não é contraceptivo: gestação é possível mesmo sem menstruação. Para quem deseja gestação biológica futura, a preservação de oócitos antes do início é uma opção a considerar. (WPATH SOC-8)",
  },
];
