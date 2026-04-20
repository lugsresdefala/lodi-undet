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
  skin: { label: "Pele e pelo", tokenVar: "var(--color-system-skin)" },
  body: { label: "Corpo", tokenVar: "var(--color-system-body)" },
  mind: { label: "Mente", tokenVar: "var(--color-system-mind)" },
  repro: { label: "Reprodutor", tokenVar: "var(--color-system-repro)" },
  voice: { label: "Voz", tokenVar: "var(--color-system-voice)" },
};

export const EFFECTS: EffectEntry[] = [
  {
    id: "skin-oil",
    title: "Pele mais oleosa, possível acne",
    system: "skin",
    onsetMonths: [1, 6],
    maxMonths: [12, 24],
    reversible: true,
    notes:
      "Mais marcado no primeiro ano; tende a estabilizar. (Endocrine Society 2017)",
  },
  {
    id: "facial-body-hair",
    title: "Pelo facial e corporal",
    system: "skin",
    onsetMonths: [6, 12],
    maxMonths: [48, 60],
    reversible: false,
    notes:
      "Início típico 6–12 meses; densidade máxima pode levar 4–5 anos. Distribuição depende fortemente da genética. (Endocrine Society 2017)",
  },
  {
    id: "scalp-loss",
    title: "Calvície de padrão masculino",
    system: "skin",
    onsetMonths: [12, 24],
    maxMonths: [60, 120],
    reversible: false,
    notes:
      "Surge apenas com predisposição genética. Variável; pode iniciar-se mais cedo nalguns indivíduos.",
  },
  {
    id: "muscle-mass",
    title: "Aumento de massa muscular e força",
    system: "body",
    onsetMonths: [6, 12],
    maxMonths: [24, 60],
    reversible: false,
    notes:
      "Potenciado por treino de resistência e nutrição adequada. Reverte parcialmente se a terapia for interrompida.",
  },
  {
    id: "fat-redist",
    title: "Redistribuição de gordura",
    system: "body",
    onsetMonths: [1, 6],
    maxMonths: [24, 60],
    reversible: true,
    notes:
      "Diminuição em ancas/coxas, aumento abdominal. Reversível com interrupção da terapia. (Endocrine Society 2017)",
  },
  {
    id: "menses-stop",
    title: "Cessação da menstruação",
    system: "repro",
    onsetMonths: [1, 6],
    maxMonths: [1, 6],
    reversible: true,
    notes:
      "Habitualmente nos primeiros 6 meses. Pode haver spotting; ausência de menstruação NÃO indica infertilidade.",
  },
  {
    id: "clitoral",
    title: "Crescimento clitoriano",
    system: "repro",
    onsetMonths: [1, 6],
    maxMonths: [12, 24],
    reversible: false,
    notes:
      "Crescimento típico de 1–3 cm, com variação individual. Considerado irreversível. (Endocrine Society 2017)",
  },
  {
    id: "vaginal-atrophy",
    title: "Atrofia vaginal",
    system: "repro",
    onsetMonths: [1, 6],
    maxMonths: [12, 24],
    reversible: true,
    notes:
      "Pode causar secura, desconforto e maior fragilidade da mucosa. Hidratantes ou estrogénio tópico em baixa dose aliviam sem comprometer a masculinização.",
  },
  {
    id: "voice",
    title: "Mudança de voz (gravamento)",
    system: "voice",
    onsetMonths: [6, 12],
    maxMonths: [12, 24],
    reversible: false,
    notes:
      "Início típico aos 6–12 meses, não nos primeiros meses. Mudança permanente das pregas vocais. Terapia da fala pode otimizar projeção e ressonância. (Endocrine Society 2017)",
  },
  {
    id: "libido",
    title: "Aumento da libido",
    system: "mind",
    onsetMonths: [0.25, 3],
    maxMonths: [3, 6],
    reversible: true,
    notes:
      "Frequentemente nas primeiras semanas. Pode acompanhar-se de oscilações de humor iniciais que tendem a estabilizar.",
  },
  {
    id: "mood",
    title: "Alterações de humor e bem-estar",
    system: "mind",
    onsetMonths: [0.5, 3],
    maxMonths: [3, 12],
    reversible: true,
    notes:
      "Muitas pessoas relatam melhoria do bem-estar e redução da disforia. Oscilações possíveis nos primeiros meses; acompanhamento psicológico recomendado. Não há evidência de que a testosterona cause patologia psiquiátrica.",
  },
  {
    id: "fertility",
    title: "Supressão da fertilidade",
    system: "repro",
    onsetMonths: [1, 6],
    maxMonths: [3, 12],
    reversible: false,
    notes:
      "Reversibilidade incerta e variável após interrupção; pode haver perda permanente de fertilidade. A testosterona NÃO é contraceptivo — gravidez é possível mesmo sem menstruação. Preservação de oócitos antes do início é fortemente recomendada. (WPATH SOC-8)",
  },
];
