// Expected masculinizing effects of testosterone therapy.
// Onset/maximum windows are approximate, derived from WPATH SOC-8 and
// Endocrine Society 2017 clinical practice guidelines. Individual variation
// is large. Not all changes are reversible.

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
    maxMonths: [1, 24],
    reversible: true,
    notes: "Mais marcado nos primeiros meses; tende a estabilizar.",
  },
  {
    id: "facial-body-hair",
    title: "Pelo facial e corporal",
    system: "skin",
    onsetMonths: [3, 6],
    maxMonths: [36, 60],
    reversible: false,
    notes: "Distribuição e densidade dependem fortemente da genética.",
  },
  {
    id: "scalp-loss",
    title: "Calvície de padrão masculino",
    system: "skin",
    onsetMonths: [12, 60],
    maxMonths: [60, 120],
    reversible: false,
    notes: "Surge se houver predisposição genética.",
  },
  {
    id: "muscle-mass",
    title: "Aumento de massa muscular e força",
    system: "body",
    onsetMonths: [6, 12],
    maxMonths: [24, 60],
    reversible: false,
    notes: "Potenciado por treino de resistência e nutrição adequada.",
  },
  {
    id: "fat-redist",
    title: "Redistribuição de gordura",
    system: "body",
    onsetMonths: [3, 6],
    maxMonths: [24, 60],
    reversible: true,
    notes: "Diminuição em ancas/coxas, aumento abdominal.",
  },
  {
    id: "menses-stop",
    title: "Cessação da menstruação",
    system: "repro",
    onsetMonths: [1, 6],
    maxMonths: [2, 6],
    reversible: true,
    notes: "Pode haver spotting nos primeiros meses.",
  },
  {
    id: "clitoral",
    title: "Crescimento clitoriano",
    system: "repro",
    onsetMonths: [3, 6],
    maxMonths: [12, 24],
    reversible: false,
    notes: "Crescimento típico de 1–3 cm, com variação individual.",
  },
  {
    id: "vaginal-atrophy",
    title: "Atrofia vaginal",
    system: "repro",
    onsetMonths: [3, 6],
    maxMonths: [12, 24],
    reversible: true,
    notes: "Hidratantes/estrogénio tópico podem aliviar desconforto.",
  },
  {
    id: "voice",
    title: "Mudança de voz",
    system: "voice",
    onsetMonths: [3, 12],
    maxMonths: [12, 24],
    reversible: false,
    notes: "Trabalho com fonoaudiologia pode otimizar projeção.",
  },
  {
    id: "libido",
    title: "Aumento da libido",
    system: "mind",
    onsetMonths: [0.25, 3],
    maxMonths: [3, 6],
    reversible: true,
    notes: "Variações de humor frequentes nas primeiras semanas.",
  },
  {
    id: "mood",
    title: "Estabilização emocional",
    system: "mind",
    onsetMonths: [0.5, 6],
    maxMonths: [6, 24],
    reversible: true,
    notes: "Acompanhamento psicológico recomendado nos primeiros meses.",
  },
  {
    id: "fertility",
    title: "Supressão da fertilidade",
    system: "repro",
    onsetMonths: [1, 6],
    maxMonths: [3, 12],
    reversible: false,
    notes:
      "Reversibilidade incerta e variável após interrupção; pode haver perda permanente de fertilidade. A testosterona NÃO é contraceptivo — gravidez é possível mesmo sem menstruação. Preservação de oócitos antes do início é fortemente recomendada.",
  },
];
