# Changelog

Todas as alterações relevantes ao projecto estão documentadas neste ficheiro.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projecto adere a [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Adicionado

- Página de metodologia (`/metodologia`) com documentação técnica completa do modelo PK: equações, parâmetros, calibração, limitações e referências.
- Exportação de resultados em JSON e CSV diretamente do calculador PK (`ExportButton`).
- Comparação de cenários posológicos no `PkCalculator`: sobreposição gráfica de dois intervalos e tabela comparativa de métricas.
- Suíte de testes automatizados com Vitest para `src/lib/pk.ts` (precisão numérica, validação, Monte Carlo).
- Pipeline CI GitHub Actions: lint + build + testes em cada push e pull request.
- `validatePkParams()`: validação estruturada de parâmetros PK com erros e avisos tipados.
- `MODEL_VERSION`: versionamento explícito do motor PK; incluído nos metadados de exportação.
- `computeIntervalForTarget()`: cálculo de intervalo sugerido extraído do calculador para o domínio PK.
- 8 novos efeitos clínicos: hematócrito/policitemia, perfil lipídico, pressão arterial, densidade mineral óssea, acne, espessura da pele, sudorese e odor corporal, cognição e concentração.
- `src/lib/export.ts`: utilitários de exportação (JSON, CSV, download no browser).
- `README.md`, `CONTRIBUTING.md` e `docs/MODEL.md`.

### Alterado

- Página 404 e componente de erro agora completamente em português.
- Rodapé alargado com link para metodologia e indicador de versão do modelo.
- Navegação principal inclui ligação à página de metodologia.
- Sitemap actualizado com `/metodologia`.
- `public/llms.txt` actualizado com novas páginas e referências.

---

## [2.0.0] — 2025-05-16

### Adicionado

- Modo de titulação individual: calibra o modelo com uma medição sérica real para estimar a clearance e o intervalo individual.
- Simulação Monte Carlo: gera coortes virtuais de N sujeitos com variabilidade log-normal em Cl, ka e ke; calcula P5, P25, P50, P75, P95.
- Intervalos sugeridos a partir de Cmédia-alvo com faixa de 90% (log-normal, CV configurável).
- Avisos estruturados de estado estacionário: verifica se o esquema atingiu 4–5 × t½ antes de aceitar uma medição sérica para calibração.
- Design system clínico/editorial completo (Fraunces + Inter Tight + JetBrains Mono; paleta parchment/ink/clay).
- Schema.org `MedicalWebPage` + JSON-LD para Endocrine Society 2017 e WPATH SOC-8.
- Controlo de doses de ataque (loading): segunda dose às 6 semanas segundo SmPC Nebido / Endocrine Society 2017.
- Parâmetros PK avançados editáveis (t½_abs, t½_elim, clearance).
- Verificação analítica em linha (Tmax previsto, Cmédia esperada).

### Alterado

- Motor PK refactorado para forma de clearance (numericamente mais estável em flip-flop; elimina divisão por Vd apraente).
- Cronologia de efeitos com filtro por sistema corporal.
- Cartões de efeitos com linha colorida de sistema, badge rev./perm. e notas com citações.

---

## [1.0.0] — 2025-03-01

### Adicionado

- Calculadora PK inicial com modelo Bateman de um compartimento (forma Vd).
- Cronologia de efeitos baseada na Endocrine Society 2017 (Tabela 13).
- Cartões de efeitos por sistema corporal (pele, corpo, reprodutor, mente, voz).
- Aviso/disclaimer médico.
- Sitemap XML e robots.txt.
