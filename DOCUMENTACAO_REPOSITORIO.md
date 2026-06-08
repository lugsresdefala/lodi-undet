# Documentação do repositório `lodi-undet`

## 1) Visão geral

O `lodi-undet` é uma aplicação TypeScript focada em simulação farmacocinética (PK) de undecilato de testosterona IM, com frontend em React/TanStack Start e execução em Cloudflare Workers.

A arquitetura atual permanece:

- **TanStack Start + TanStack Router** no frontend/full-stack
- **Cloudflare Workers** como runtime de deploy
- **Supabase** para autenticação e backend de dados

---

## 2) Estrutura principal

- `src/routes/` — rotas file-based do TanStack Router (páginas e rotas API)
- `src/components/` — componentes visuais e blocos reutilizáveis de UI
- `src/lib/` — lógica de domínio e utilitários (inclui o motor PK)
- `supabase/` — migrations/configuração relacionada ao Supabase
- `public/` — arquivos estáticos públicos

---

## 3) Stack e linguagem

- **TypeScript** (linguagem principal)
- **React 19**
- **TanStack Start / Router / Query**
- **Vite**
- **Cloudflare Workers** (Wrangler)
- **Supabase** (PostgreSQL + Auth)
- **Stripe** (pagamentos)
- **Zod** (validação de schema)
- **Recharts** (gráficos)
- **Radix UI / shadcn** (sistema de componentes)

---

## 4) Lógica central de produto (simulador PK)

Arquivo central: `src/lib/pk-engine.ts`.

O motor implementa modelo PK com absorção bifásica do depósito IM (componente rápido + lento), compartimento central e eliminação, integrado por RK4.

Principais capacidades:

- simular curva concentração-tempo (`simularPerfil`)
- calcular métricas clínicas (Cmax, Cmin, Cavg, Tmax, t½ aparente)
- simulação populacional Monte Carlo (`simularMonteCarlo`)
- cronogramas de dose fixos e esquema Schubert (`gerarCronograma`, `gerarCronogramaSchubert`)
- recomendação de intervalo por calibração individual (`recomendarIntervalo`)

Constantes e blocos clínicos relevantes no arquivo:

- `ALVOS_CALIBRACAO`
- `PARAMETROS_POPULACIONAIS`
- `IIV_CV`
- limites eugonadais (`EUGONADAL_MIN_NGDL`, `EUGONADAL_MAX_NGDL`)

---

## 5) Fluxo do frontend

- O roteamento usa **file-based routing** em `src/routes/`.
- A árvore de rotas gerada é mantida em `src/routeTree.gen.ts`.
- As páginas (ex.: `calculadora.tsx`) consomem componentes de `src/components/` e lógica de `src/lib/`.
- Hooks e estados auxiliares ficam em `src/hooks/`.

Fluxo típico da calculadora:

1. Usuário define dose/intervalo/regime
2. UI gera cronograma
3. UI roda simulação PK e métricas
4. UI renderiza curvas e indicadores clínicos

---

## 6) Integrações

- **Supabase Auth/Client**: `src/integrations/supabase/`
- **Stripe (pagamentos)**: `src/lib/stripe.ts`, `src/lib/stripe.server.ts`, `src/lib/stripe-env.ts`
- **API Keys**: `src/lib/api-keys.server.ts`

---

## 7) Variáveis de ambiente

Variáveis encontradas em `.env` e `.env.development`:

- `VITE_PAYMENTS_CLIENT_TOKEN`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

---

## 8) Comandos de referência

- `bun dev`
- `bun build`
- `bun test`
- `wrangler deploy`

(Em ambientes sem Bun, os equivalentes via npm também funcionam para desenvolvimento local.)

---

## 9) Resumo funcional

O coração do `lodi-undet` é o simulador PK em `src/lib/pk-engine.ts`: ele converte um regime de injeções em curvas de concentração, métricas clínicas e análise de variabilidade populacional/individual para apoiar decisões de intervalo terapêutico.
