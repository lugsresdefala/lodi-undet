# API externa do motor PK com acesso por assinatura

Expor o motor farmacocinético (`src/lib/pk-engine.ts`) como API HTTP pública, com autenticação por API key e gating por assinatura ativa (Stripe).

## 1. Infraestrutura

- **Lovable Cloud** (Supabase) — auth de usuários, tabelas de chaves e assinaturas
- **Stripe (seamless)** — checkout e webhook de assinatura
- Endpoints públicos em `src/routes/api/public/v1/*.ts` (TanStack server routes)

## 2. Banco (migrações)

- `api_keys` — `id`, `user_id`, `key_hash` (sha256), `prefix` (8 chars visíveis), `name`, `created_at`, `last_used_at`, `revoked_at`. RLS: dono lê/revoga; gravação pelo service role.
- `subscriptions` — `user_id` (PK), `stripe_customer_id`, `stripe_subscription_id`, `status` (`active`/`trialing`/`past_due`/`canceled`), `plan`, `current_period_end`. RLS: dono lê; gravação só service role (via webhook).
- `api_usage` — `id`, `api_key_id`, `endpoint`, `created_at`, `status`, `ms`. Service role grava; dono lê próprio.

Grants explícitos + RLS conforme padrão do projeto.

## 3. Endpoints públicos (`/api/public/v1/*`)

Todos exigem header `Authorization: Bearer lodi_<key>` e validam:
1. chave existe e não revogada;
2. usuário dono tem assinatura `active`/`trialing`;
3. rate limit por chave (contagem em `api_usage` na janela; 429 se exceder).

Endpoints:

- `POST /api/public/v1/simulate` — entrada: `doses[]`, `params?`, `config?`. Retorna `perfil[]` + métricas.
- `POST /api/public/v1/metrics` — entrada: `perfil[]`, `doses[]`. Retorna `MetricasPK` + `cmaxSS`.
- `POST /api/public/v1/montecarlo` — entrada: `doses[]`, `nSimulacoes` (cap 500), `config?`. Retorna percentis + métricas populacionais.
- `POST /api/public/v1/recommend-interval` — entrada: meta Cmédia + observações. Retorna intervalo recomendado.
- `GET /api/public/v1/health` — público, sem auth.

Todos com CORS aberto, `OPTIONS` handler, validação Zod estrita, erros JSON estruturados.

## 4. Pagamentos (Stripe seamless)

- Rodar `recommend_payment_provider` → `enable_stripe_payments`.
- Server fn `createCheckout` cria sessão de assinatura mensal (1 plano inicial).
- Webhook `src/routes/api/public/stripe-webhook.ts`: verifica assinatura, faz upsert em `subscriptions` nos eventos `customer.subscription.{created,updated,deleted}` e `invoice.payment_{succeeded,failed}`.
- Server fn `createCustomerPortal` para gerenciar/cancelar.

## 5. UI (área logada)

Nova rota `/conta` (sob `_authenticated`):
- Status da assinatura + botão "Assinar" ou "Gerenciar".
- Seção "Chaves de API": listar, criar (mostra chave em texto puro UMA VEZ), revogar.
- Bloco "Como usar a API" com exemplo `curl` e link para `/api-docs`.

Nova rota pública `/api-docs`:
- Documentação dos endpoints, schemas de request/response, exemplos, política de rate limit.

Login (`/login`) e cadastro (email/senha + Google) — só se ainda não houver. *Pergunta: precisa de perfil (nome/avatar) ou só auth?*

## 6. Segurança

- API key gerada no servidor com `crypto.randomBytes(32)`, prefixo `lodi_`, armazenada como SHA-256 (nunca em texto).
- Comparação timing-safe.
- Webhook Stripe valida assinatura HMAC.
- Sem PII em `/api/public/*` (retorna só dados de simulação).
- Rate limit por chave + cap global por janela.

## 7. Entregáveis

1. Migrações SQL (3 tabelas + grants + RLS + policies).
2. `src/lib/api-auth.server.ts` — helper de verificação de chave + assinatura.
3. 5 server routes em `src/routes/api/public/v1/`.
4. Webhook Stripe + server fns de checkout/portal.
5. Server fns: `createApiKey`, `listApiKeys`, `revokeApiKey`.
6. Páginas: `/login`, `/conta`, `/api-docs`.
7. Link "API" no `SiteChrome`.

## Pergunta de bloqueio

Antes de implementar: **precisa de tabela `profiles` (nome, avatar etc.) ou basta o `auth.users` do Lovable Cloud?**
