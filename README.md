# lodi-t — Referência sobre hormonização com testosterona

> Página de referência clínica e educativa para hormonização masculinizante com testosterona. Motor farmacocinético calibrado para o perfil de testosterona sérica após injecções intramusculares de undecilato de testosterona (TU) 1000 mg (Nebido® / Reandron®).

[![CI](https://github.com/lugsresdefala/lodi-undet/actions/workflows/ci.yml/badge.svg)](https://github.com/lugsresdefala/lodi-undet/actions/workflows/ci.yml)

---

## Acesso rápido

- **Aplicação**: https://lodi-undet.lovable.app/
- **Metodologia**: https://lodi-undet.lovable.app/metodologia
- **Modelo PK**: [`src/lib/pk.ts`](./src/lib/pk.ts)
- **Dados de efeitos**: [`src/data/effects.ts`](./src/data/effects.ts)

---

## O que é o lodi-t?

**lodi-t** (Lógica para Dose Individualizada — testosterona) é uma ferramenta de referência educativa para:

- **Simulação farmacocinética** do undecilato de testosterona IM, com faixa de variação populacional por Monte Carlo.
- **Titulação individual**: calibra o modelo a partir de uma medição sérica para estimar o intervalo óptimo.
- **Cronologia de efeitos** clínicos esperados segundo a _Endocrine Society Clinical Practice Guideline 2017_ e a _WPATH SOC-8_.
- **Referência** sobre efeitos por sistema corporal, com janelas temporais e reversibilidade.
- **Comparação de cenários** posológicos para apoiar a decisão clínica.
- **Exportação** de resultados em JSON e CSV para integração com prontuário.

> ⚠️ **Uso estritamente educativo.** Esta ferramenta não constitui aconselhamento médico, prescrição nem orientação posológica. Qualquer ajuste de dose ou intervalo deve ser feito com acompanhamento clínico e análises séricas.

---

## Pilha tecnológica

| Camada          | Tecnologia                                                    |
| --------------- | ------------------------------------------------------------- |
| Framework       | [TanStack Start](https://tanstack.com/start) (React 19, SSR) |
| Routing         | [TanStack Router](https://tanstack.com/router) (file-based)  |
| UI              | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://radix-ui.com/) |
| Styling         | [Tailwind CSS v4](https://tailwindcss.com/)                  |
| Charts          | [Recharts](https://recharts.org/)                            |
| Build           | [Vite](https://vitejs.dev/) + [Cloudflare Workers](https://workers.cloudflare.com/) |
| Tests           | [Vitest](https://vitest.dev/)                                |
| Qualidade       | ESLint + Prettier                                            |
| Package manager | [Bun](https://bun.sh/)                                       |

---

## Motor farmacocinético

O modelo PK implementado é um **modelo Bateman de um compartimento em modo flip-flop**, expresso na forma de _clearance_. Este modo é o apropriado para formulações de depósito IM lipofílico, em que a etapa limitante de velocidade é a **libertação do fármaco a partir do depot** (e não a eliminação sistémica).

### Equação principal

```
C(t) = (F · D_T · ka · ke) / (Cl · (ka − ke)) · (e^(−ke·t) − e^(−ka·t))
```

**Onde:**

- `D_T = dose_TU × 0,6315` — dose efectiva de testosterona (razão de pesos moleculares T/TU: 288,43 / 456,71)
- `ka` — constante de absorção (libertação do depot IM), derivada de t½_abs ≈ 4 d
- `ke` — constante aparente terminal (cinética flip-flop), derivada de t½_elim ≈ 33 d
- `F` — biodisponibilidade (IM ≈ 1,0)
- `Cl` — clearance metabólica da testosterona (L/dia), calibrada para ~17,5 L/kg/dia em homens trans em TU IM (Defreyne et al., _Andrology_ 2018)

Para documentação técnica completa ver [`docs/MODEL.md`](./docs/MODEL.md).

---

## Instalação e desenvolvimento local

```bash
# Clonar o repositório
git clone https://github.com/lugsresdefala/lodi-undet.git
cd lodi-undet

# Instalar dependências (usar bun)
bun install

# Servidor de desenvolvimento
bun run dev

# Build para produção
bun run build

# Linting
bun run lint

# Testes
bun run test

# Testes com coverage
bun run test:coverage
```

### Requisitos

- [Bun](https://bun.sh/) ≥ 1.2 (package manager e runtime)
- Node.js ≥ 20 (para compatibilidade de ferramentas)

---

## Deploy

A aplicação é servida como um **Cloudflare Worker** via TanStack Start + Vite plugin. O deploy é feito automaticamente pelo fluxo CI ao fazer push para `main`.

```bash
# Deploy manual (requer wrangler configurado)
bun run build
wrangler deploy
```

Configuração: [`wrangler.jsonc`](./wrangler.jsonc).

---

## Estrutura do projecto

```
lodi-undet/
├── src/
│   ├── routes/               # Rotas (TanStack Router, file-based)
│   │   ├── __root.tsx        # Shell HTML + head global
│   │   ├── index.tsx         # Página principal
│   │   └── metodologia.tsx   # Metodologia técnica do modelo PK
│   ├── components/           # Componentes React
│   │   ├── PkCalculator.tsx      # Calculadora interactiva principal
│   │   ├── EffectsTimeline.tsx   # Cronologia de efeitos
│   │   ├── EffectCards.tsx       # Cartões de efeitos por sistema
│   │   ├── ExportButton.tsx      # Exportação JSON/CSV
│   │   └── MedicalDisclaimer.tsx
│   ├── lib/
│   │   ├── pk.ts          # Motor farmacocinético (modelo + simulação + validação)
│   │   ├── export.ts      # Utilitários de exportação
│   │   ├── utils.ts
│   │   └── __tests__/
│   │       └── pk.test.ts # Testes unitários do motor PK
│   └── data/
│       └── effects.ts     # Base de dados de efeitos clínicos (20+ efeitos)
├── docs/
│   └── MODEL.md           # Documentação técnica do modelo PK
├── public/
│   ├── robots.txt
│   └── llms.txt
├── .github/
│   └── workflows/
│       └── ci.yml         # Pipeline CI (lint + build + test)
├── CHANGELOG.md
└── CONTRIBUTING.md
```

---

## Testes

```bash
# Correr todos os testes
bun run test

# Com coverage
bun run test:coverage

# Modo watch
bun run test:watch
```

A suíte de testes cobre:

- Precisão numérica do motor PK (comparação com valores publicados)
- Validação de parâmetros de entrada (`validatePkParams`)
- Cálculo de métricas (Cmax, Ctrough, Cmean)
- Simulação Monte Carlo (determinismo com seed)
- Utilitários de exportação JSON/CSV

---

## Contribuir

Ver [`CONTRIBUTING.md`](./CONTRIBUTING.md) para instruções detalhadas.

Sumário rápido:

1. Fork do repositório
2. Criar branch (`git checkout -b feature/descricao`)
3. Fazer as alterações e adicionar testes
4. Verificar lint e testes (`bun run lint && bun run test`)
5. Abrir Pull Request

---

## Referências bibliográficas principais

| Referência                                           | Papel no modelo                                    |
| ---------------------------------------------------- | -------------------------------------------------- |
| Schubert M et al. _JCEM_ 2004;89(11):5429–34         | Parâmetros PK (Tmax ≈ 7 d, t½ ≈ 33,9 d)          |
| Behre HM, Nieschlag E. _Eur J Endocrinol_ 1999;140(5):414–9 | Cinética flip-flop do TU IM               |
| Wang C et al. _JCEM_ 2004;89(2):534–43               | MCR da testosterona (~21 L/kg/d em homens cis)    |
| Defreyne J et al. _Andrology_ 2018;6(3):441–51       | Calibração Cl = 17,5 L/kg/d (coorte ENIGI)       |
| Pelusi C et al. _Andrology_ 2014;2(4):516–21         | Validação em homens trans                         |
| Hembree WC et al. _JCEM_ 2017;102(11):3869–903       | Endocrine Society CPG 2017                        |
| Travison TG et al. _JCEM_ 2017;102(4):1161–73        | Intervalo de referência 264–916 ng/dL             |
| Coleman E et al. _J Sex Med_ 2022;19(3):S1–S259      | WPATH SOC-8                                       |
| Zitzmann M, Nieschlag E. _Nat Clin Pract Urol_ 2007;4(3):160–70 | Variabilidade inter-individual        |

---

## Licença

MIT — ver [LICENSE](./LICENSE).

---

_lodi-t é um projecto de referência educativa sem fins comerciais. Desenvolvido com apoio de [diversidadebarrafunda.org](https://diversidadebarrafunda.org)._
