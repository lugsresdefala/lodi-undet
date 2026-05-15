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
      "Ocorre na presença de predisposição genética (polimorfismos do receptor de androgénio). Curso e intensidade variáveis; para alguns é desejado, para outros não. (Endocrine Society 2017; WPATH SOC-8, Coleman et al., J Sex Med 2022;19(3):S1–S259)",
  },
  {
    id: "muscle-mass",
    title: "Aumento de massa muscular e força",
    system: "body",
    onsetMonths: [6, 12],
    maxMonths: [24, 60],
    reversible: false,
    notes:
      "Potenciado por treino de resistência e nutrição adequada. Classificado como não totalmente reversível pela Endocrine Society 2017 (Tabela 13): alguma redução pode ocorrer com a descontinuação, mas tipicamente não há retorno completo ao estado pré-hormonização. (Endocrine Society 2017; Hembree WC et al., JCEM 2017;102(11):3869–903)",
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
      "Pode haver ressecamento e maior fragilidade da mucosa. Quando incômodo, hidratantes ou estrogénio tópico em baixa dose aliviam sem comprometer a masculinização.",
  },
  {
    id: "voice",
    title: "Engrossamento da voz",
    system: "voice",
    onsetMonths: [6, 12],
    maxMonths: [12, 24],
    reversible: false,
    notes:
      "Início típico aos 6–12 meses. Mudança permanente das pregas vocais. Acompanhamento fonoaudiológico pode otimizar projeção e ressonância. (Endocrine Society 2017)",
  },
  {
    id: "libido",
    title: "Alteração da libido",
    system: "mind",
    onsetMonths: [1, 3],
    maxMonths: [3, 6],
    reversible: true,
    notes:
      "Início típico ao 1.º–3.º mês segundo a Endocrine Society 2017 (Tabela 13). Magnitude variável entre indivíduos; tende a estabilizar ao longo do tempo. (Endocrine Society 2017; Hembree WC et al., JCEM 2017;102(11):3869–903)",
  },
  {
    id: "mood",
    title: "Alterações de humor e bem-estar",
    system: "mind",
    onsetMonths: [0.5, 3],
    maxMonths: [3, 12],
    reversible: true,
    notes:
      "Muitas pessoas relatam melhora do bem-estar e redução da disforia de género com a hormonização masculinizante. Oscilações iniciais são comuns e tendem a estabilizar. A evidência disponível não suporta uma associação causal entre testosterona terapêutica e o surgimento de nova patologia psiquiátrica (Colizzi M et al., J Endocrinol Invest 2014;37(12):1205–13; Costa R & Colizzi M, Ther Adv Psychopharmacol 2016;6(3):187–97). (Endocrine Society 2017)",
  },
  {
    id: "fertility",
    title: "Redução da fertilidade",
    system: "repro",
    onsetMonths: [1, 6],
    maxMonths: [3, 12],
    reversible: true,
    notes:
      "A fertilidade pode recuperar após a interrupção da testosterona, mas a reversibilidade é incerta e variável entre indivíduos — não é garantida. A testosterona não é contraceptivo: gestação é possível mesmo sem menstruação, pois a ovulação pode persistir. Para quem deseja gestação biológica futura, a criopreservação de oócitos antes do início da hormonização é a opção de maior segurança. (WPATH SOC-8; Coleman et al., J Sex Med 2022;19(3):S1–S259; Hembree WC et al., JCEM 2017;102(11):3869–903)",
  },
];
