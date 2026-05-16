# Como contribuir para o lodi-t

Obrigado pelo interesse em melhorar esta ferramenta de referência clínica! Este documento explica como participar de forma construtiva.

---

## Código de conduta

Este projecto destina-se a ser um espaço acolhedor e seguro para todas as pessoas, especialmente para a comunidade trans e profissionais de saúde que a acompanham. Esperamos que todos os participantes mantenham um comportamento respeitoso e construtivo.

---

## Tipos de contribuição

### Dados clínicos e referências

- **Novos efeitos** em `src/data/effects.ts`: inclua a referência bibliográfica no campo `notes` e garanta que os intervalos temporais têm suporte explícito na literatura (Endocrine Society, WPATH SOC-8 ou estudos de coorte).
- **Correcções a intervalos** existentes: documente a fonte e o raciocínio na Pull Request. Alterações sem referência bibliográfica não serão aceites.
- **Novas referências**: adicione ao `docs/MODEL.md` e ao `README.md`.

### Motor PK (`src/lib/pk.ts`)

- Alterações numéricas **exigem** testes de regressão em `src/lib/__tests__/pk.test.ts`.
- Qualquer mudança que afecte os resultados deve:
  1. Incrementar `MODEL_VERSION` (exportado do módulo).
  2. Documentar a mudança no `CHANGELOG.md` com referência bibliográfica.
  3. Comparar os novos resultados com os valores publicados (Schubert 2004, ENIGI/Defreyne 2018).
- Não altere os parâmetros padrão (`DEFAULT_PK`) sem justificação bibliográfica.

### Interface

- Siga o design system existente (Tailwind CSS + shadcn/ui + fontes em `src/styles.css`).
- Não adicione novas dependências sem discussão prévia numa Issue.
- Mantenha os textos em português europeu (pt-PT) como idioma principal.

### Testes

- Todos os ficheiros em `src/lib/` devem ter cobertura de testes unitários.
- Testes de UI são bem-vindos mas não obrigatórios para contribuições de dados.

---

## Fluxo de trabalho

```bash
# 1. Fork e clonar
git clone https://github.com/<o-seu-user>/lodi-undet.git
cd lodi-undet

# 2. Instalar dependências
bun install

# 3. Criar branch com nome descritivo
git checkout -b fix/correcao-tmax-schubert
# ou
git checkout -b feat/efeito-densidade-ossea
# ou
git checkout -b model/calibrar-clearance-pelusi

# 4. Desenvolver e testar
bun run dev           # servidor local (http://localhost:3000)
bun run lint          # verificar estilo (ESLint + Prettier)
bun run test          # correr testes unitários
bun run build         # verificar build completo

# 5. Commit e push
git add .
git commit -m "data: adicionar efeito densidade mineral óssea com ref Endocrine Society 2017"
git push origin feat/efeito-densidade-ossea
```

### Convenção de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

| Prefixo    | Uso                                                             |
| ---------- | --------------------------------------------------------------- |
| `feat:`    | Nova funcionalidade na interface ou calculadora                 |
| `fix:`     | Correcção de bug                                               |
| `data:`    | Alteração à base de dados de efeitos (`effects.ts`)            |
| `model:`   | Alteração ao motor PK (requer bump de `MODEL_VERSION`)         |
| `docs:`    | Documentação (README, MODEL.md, CHANGELOG)                     |
| `test:`    | Testes unitários ou de integração                              |
| `ci:`      | Pipeline CI/CD                                                  |
| `refactor:` | Refactorização sem mudança de comportamento observável        |
| `style:`   | Formatação, whitespace, sem mudança de lógica                  |

---

## Checklist de Pull Request

Antes de abrir um PR, verifique:

- [ ] O código compila sem erros (`bun run build`)
- [ ] O lint passa sem erros ou avisos novos (`bun run lint`)
- [ ] Os testes passam (`bun run test`)
- [ ] Novas funcionalidades têm testes associados
- [ ] Referências bibliográficas incluídas (se os dados clínicos foram alterados)
- [ ] `CHANGELOG.md` atualizado na secção `[Unreleased]`
- [ ] `MODEL_VERSION` incrementado (apenas se o motor PK foi alterado)
- [ ] A descrição do PR explica _porquê_ a mudança é necessária

---

## Reportar problemas

Abra uma Issue descrevendo:

1. O comportamento observado (inclua um screenshot se relevante)
2. O comportamento esperado
3. Passos para reproduzir
4. Versão do navegador e sistema operativo

Para questões sobre os dados clínicos ou o modelo matemático, inclua sempre a referência bibliográfica de suporte à sua afirmação.

---

## Estrutura do código relevante

```
src/lib/pk.ts          ← motor PK; alterações precisam de testes
src/lib/export.ts      ← utilitários de exportação
src/data/effects.ts    ← efeitos clínicos; adicionar novos aqui
src/components/
  PkCalculator.tsx     ← calculadora interactiva principal
  EffectsTimeline.tsx  ← cronologia de efeitos
  EffectCards.tsx      ← cartões por sistema
  ExportButton.tsx     ← botão de exportação reutilizável
src/routes/
  index.tsx            ← página principal
  metodologia.tsx      ← documentação técnica
docs/MODEL.md          ← especificação do modelo PK
```
