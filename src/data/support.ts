// Curated Portuguese-speaking support resources for trans people.
// All listed organisations are publicly known; verify contacts before use.

export interface SupportOrg {
  name: string;
  region: string;
  category: "Apoio comunitário" | "Linha de escuta" | "Saúde" | "Jurídico" | "Família";
  description: string;
  url: string;
}

export const SUPPORT_ORGS: SupportOrg[] = [
  {
    name: "ILGA Portugal",
    region: "Portugal",
    category: "Apoio comunitário",
    description: "Linha LGBTI+, atendimento psicológico e jurídico, grupos de apoio.",
    url: "https://ilga-portugal.pt",
  },
  {
    name: "rede ex aequo",
    region: "Portugal",
    category: "Apoio comunitário",
    description: "Associação de jovens LGBTI+ e apoiantes; grupos locais e formação.",
    url: "https://www.rea.pt",
  },
  {
    name: "AMPLOS",
    region: "Portugal",
    category: "Família",
    description: "Associação de mães e pais pela liberdade de orientação sexual e identidade de género.",
    url: "https://amplos.pt",
  },
  {
    name: "Casa T",
    region: "Lisboa",
    category: "Apoio comunitário",
    description: "Casa de acolhimento e centro comunitário para pessoas trans.",
    url: "https://casa-t.org",
  },
  {
    name: "Linha SOS Saúde Mental",
    region: "Portugal",
    category: "Linha de escuta",
    description: "Apoio em crise emocional — 808 24 24 24 (24h).",
    url: "tel:+351808242424",
  },
  {
    name: "GAT — Grupo de Ativistas em Tratamentos",
    region: "Portugal",
    category: "Saúde",
    description: "Saúde sexual, rastreio de IST e acompanhamento comunitário.",
    url: "https://www.gatportugal.org",
  },
];
