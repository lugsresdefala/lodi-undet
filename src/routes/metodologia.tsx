import { createFileRoute, Link } from "@tanstack/react-router";

import { MODEL_VERSION } from "@/lib/pk";

export const Route = createFileRoute("/metodologia")({
  head: () => ({
    meta: [
      { title: "Metodologia — lodi-t" },
      {
        name: "description",
        content:
          "Documentação técnica do modelo farmacocinético do undecilato de testosterona: equações, calibração, parâmetros e limitações.",
      },
      {
        property: "og:title",
        content: "Metodologia — lodi-t",
      },
    ],
    links: [
      { rel: "canonical", href: "https://lodi-undet.lovable.app/metodologia" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: Metodologia,
});

function Metodologia() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 md:px-8">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-medium tracking-tight">lodi-t</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              metodologia
            </span>
          </Link>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <Link to="/" className="transition-colors hover:text-foreground">
              ← Calculadora
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-14 px-4 py-12 md:px-8 md:py-16">
        {/* Hero */}
        <section>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Documentação técnica
          </span>
          <h1 className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl">
            Modelo farmacocinético do undecilato de testosterona
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Especificação completa do motor PK implementado em{" "}
            <code className="font-mono text-sm">src/lib/pk.ts</code>, incluindo equações,
            parâmetros, calibração e limitações.{" "}
            <span className="font-mono text-xs">
              Versão do modelo: <strong>{MODEL_VERSION}</strong>
            </span>
          </p>
        </section>

        {/* 1. Fundamento */}
        <Section id="fundamento" title="1. Fundamento farmacocinético">
          <SubSection title="1.1 Cinética flip-flop">
            <p>
              O undecilato de testosterona IM em óleo de rícino é uma{" "}
              <strong>formulação de depósito lipofílico</strong>. Após injecção intramuscular, o
              éster dissolve-se lentamente a partir da fase oleosa para os tecidos e corrente
              sanguínea. Consequências:
            </p>
            <ul>
              <li>
                A <strong>etapa limitante de velocidade</strong> é a libertação do fármaco a partir
                do depot, e não a eliminação sistémica.
              </li>
              <li>
                O <strong>tempo de semi-vida aparente</strong> observado no terminal (~33 d)
                reflecte a taxa de libertação do depot, e não a semi-vida biológica intrínseca da
                testosterona (t½ real da T livre ≈ 10–100 min).
              </li>
              <li>
                O modelo exibe cinética <em>flip-flop</em>: ka &gt; ke nas constantes de ajuste
                monofásico.
              </li>
            </ul>
            <Ref>Behre HM, Nieschlag E. Eur J Endocrinol 1999;140(5):414–9.</Ref>
          </SubSection>

          <SubSection title="1.2 Equação do modelo">
            <p>
              Modelo Bateman de um compartimento, expresso na forma de <em>clearance</em>{" "}
              (numericamente mais estável em flip-flop, onde o Vd aparente perde significado
              físico):
            </p>
            <CodeBlock>
              {"C(t) = (F · D_T · ka · ke) / (Cl · (ka − ke)) · (e^(−ke·t) − e^(−ka·t))"}
            </CodeBlock>
            <ParamsTable />
            <p className="mt-3 text-sm">
              <strong>Caso degenerado (ka ≈ ke):</strong> quando |ka − ke| &lt; 10⁻⁶, aplica-se o
              limite analítico{" "}
              <code className="font-mono text-xs">C(t) = base · k² · t · e^(−k·t)</code>.
            </p>
          </SubSection>

          <SubSection title="1.3 Superposição linear (doses múltiplas)">
            <p>
              Para um esquema de N doses com tempos {"{"} t₀, t₁, …, t_{"{N−1}"} {"}"}:
            </p>
            <CodeBlock>{"C_total(t) = Σᵢ C_single(t − tᵢ)   para t > tᵢ"}</CodeBlock>
            <p>
              Pressupõe <strong>linearidade</strong> (sem saturação enzimática ou de receptor),
              válida para concentrações terapêuticas de testosterona em adultos.
            </p>
          </SubSection>
        </Section>

        {/* 2. Calibração */}
        <Section id="calibracao" title="2. Parâmetros e calibração">
          <SubSection title="2.1 Constante de absorção e Tmax">
            <p>O Tmax analítico para dose única é:</p>
            <CodeBlock>{"Tmax = ln(ka / ke) / (ka − ke)"}</CodeBlock>
            <p>
              Com t½_abs = 4 d, Tmax ≈ 14 dias. Schubert 2004 reporta Tmax mediano ≈ 7 dias (t½_abs
              ≈ 1,5 d), mas esse valor gera Cmax per dose única acima do observado na coorte ENIGI
              em estado estacionário. O valor{" "}
              <strong>t½_abs = 4 d é um compromisso calibrado</strong> para compatibilidade
              simultânea com Cmax e Cmédia da ENIGI, à custa de um Tmax ligeiramente mais tardio do
              que o mediano de Schubert 2004.
            </p>
          </SubSection>

          <SubSection title="2.2 Clearance metabólica">
            <p>
              Wang et al. (2004) mediram a MCR da testosterona em homens cis eugonadais: ~21
              L/kg/dia. Na coorte ENIGI (homens trans em TU IM, n = 53; Defreyne 2018; Pelusi 2014),
              o retro-cálculo aponta para <strong>~17–18 L/kg/dia</strong>. Valor padrão neste
              modelo: <strong>17,5 L/kg/dia</strong>.
            </p>
          </SubSection>

          <SubSection title="2.3 Esquema de loading (dose de ataque)">
            <p>
              Segundo a Endocrine Society 2017 e o SmPC do Nebido: dose 1 em t = 0, dose 2 em t = 42
              d (dose de ataque), doses seguintes em intervalos de manutenção. Objectivo: acelerar a
              chegada ao estado estacionário (sem loading: 4–5 × t½ ≈ 132–165 dias).
            </p>
          </SubSection>
        </Section>

        {/* 3. Monte Carlo */}
        <Section id="montecarlo" title="3. Simulação Monte Carlo">
          <SubSection title="3.1 Variabilidade inter-individual">
            <p>
              CV reportado: Cl ~30–50%; ka, ke ~20–35% (Schubert 2004; Behre 1999; Zitzmann 2007). O
              modelo gera coortes com parâmetros amostrados de distribuições log-normal:
            </p>
            <CodeBlock>{"θᵢ ~ LogNormal(μ = ln θ₀,  σ = √ln(1 + CV²))"}</CodeBlock>
            <p>
              Factor 0,7 aplicado ao CV de ka e ke: a clearance sistémica (enzimas hepáticas,
              composição corporal) varia mais do que os parâmetros de libertação do depot
              (vascularização local).
            </p>
          </SubSection>

          <SubSection title="3.2 Reprodutibilidade">
            <p>
              PRNG determinístico mulberry32 com seed configurável — resultados reprodutíveis entre
              renders sem guardar estado.
            </p>
          </SubSection>
        </Section>

        {/* 4. Métricas */}
        <Section id="metricas" title="4. Métricas clínicas">
          <SubSection title="4.1 Cmax, Ctrough, Cmean">
            <p>Calculadas no último intervalo posológico (proxy de estado estacionário):</p>
            <CodeBlock>
              {`Cmax    = max{ C(t) : t ∈ [t_última_dose, t_última_dose + τ] }
Ctrough = min{ C(t) : t ∈ [t_última_dose, t_última_dose + τ] }
Cmean   = AUC[τ] / τ   (integração trapezoidal)`}
            </CodeBlock>
          </SubSection>

          <SubSection title="4.2 Intervalo de referência">
            <p>
              264–916 ng/dL (P2,5–P97,5 em 4 coortes combinadas EUA/UE, homens 19–39 anos): Travison
              TG et al. JCEM 2017;102(4):1161–73.
            </p>
          </SubSection>

          <SubSection title="4.3 Intervalo sugerido">
            <p>Derivado da equação de estado estacionário:</p>
            <CodeBlock>{"τ = F · D_T / (Cl · C_alvo) × 10⁵"}</CodeBlock>
            <p>
              Faixa de 90% (log-normal, σ = √ln(1 + CV²)):{" "}
              <code className="font-mono text-xs">[τ × exp(−1,645σ), τ × exp(+1,645σ)]</code>
            </p>
          </SubSection>
        </Section>

        {/* 5. Titulação individual */}
        <Section id="titulacao" title="5. Titulação individual">
          <p className="text-muted-foreground">
            Uma medição sérica em estado estacionário, com dia pós-dose conhecido, calibra o modelo
            ao indivíduo via factor de escala:
          </p>
          <CodeBlock>
            {`factor = C_medido / C_modelo(t_colheita)
Cmean_indiv = Cmean_pop × factor
τ_indiv = τ_actual × Cmean_indiv / C_alvo`}
          </CodeBlock>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Condição
                  </th>
                  <th className="py-2 pr-4 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Critério
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {[
                  ["Estado estacionário", "≥ 4 × t½ (≈ 132 d) no mesmo esquema"],
                  ["Timing documentado", "Dia pós-dose rigorosamente conhecido"],
                  ["Colheita em vale", "Aviso se colheita ao dia ≈ τ − 1"],
                  ["Factor plausível", "Aviso se factor < 0,5 ou > 2,0"],
                ].map(([cond, crit]) => (
                  <tr key={cond}>
                    <td className="py-2 pr-4 font-medium">{cond}</td>
                    <td className="py-2 text-muted-foreground">{crit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 6. Limitações */}
        <Section id="limitacoes" title="6. Limitações conhecidas">
          <ol className="space-y-2 text-muted-foreground">
            {[
              "Modelo de um compartimento: ignora a distribuição tecidual bifásica observável nas primeiras horas pós-injecção.",
              "Linearidade pressuposta: sem saturação da SHBG, dependência de concentração na clearance, nem inibição da produção endógena.",
              "Parâmetros de depot fixos (ka, ke): variam com local de injecção, volume, temperatura corporal e profundidade da agulha.",
              "Calibração de Cl para homens trans (ENIGI): pode não generalizar-se a outras populações (etnicidade, composição corporal, medicação concomitante).",
              "Produção endógena não modelada: pressupõe supressão total; concentração real pode ser superior ao modelo em fases precoces ou com produção residual.",
              "Variabilidade do local de injecção: fibrose por injecções repetidas e técnica de injecção não são modelados.",
              "Independência entre parâmetros: Cl, ka e ke são amostrados independentemente; a estrutura de correlação real é desconhecida.",
            ].map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-xs text-muted-foreground/60 tabular-nums">
                  {i + 1}.
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </Section>

        {/* 7. Referências */}
        <Section id="referencias" title="7. Referências bibliográficas">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    #
                  </th>
                  <th className="py-2 pr-4 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Referência
                  </th>
                  <th className="py-2 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Relevância
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {REFERENCES.map((r) => (
                  <tr key={r.n}>
                    <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground">{r.n}</td>
                    <td className="py-2.5 pr-4 text-xs leading-relaxed">
                      {r.authors} <em>{r.journal}</em> {r.year}.{" "}
                      {r.doi ? (
                        <a
                          href={`https://doi.org/${r.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                        >
                          doi:{r.doi}
                        </a>
                      ) : null}
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground">{r.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Footer nav */}
        <div className="border-t border-border/70 pt-8 text-sm text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground">
            ← Voltar à calculadora
          </Link>
        </div>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p>lodi-t · página de referência, sem fim comercial.</p>
          <a
            href="https://diversidadebarrafunda.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            diversidadebarrafunda.org ↗
          </a>
          <p className="font-mono uppercase tracking-[0.18em]">
            WPATH SOC-8 · Endocrine Society 2017
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-6">
      <h2 className="font-serif text-xl font-medium tracking-tight md:text-2xl">{title}</h2>
      <div className="space-y-5 text-base leading-relaxed">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-serif text-base font-medium tracking-tight text-foreground/90">
        {title}
      </h3>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border/70 bg-muted/50 p-4 font-mono text-[13px] leading-relaxed">
      {children}
    </pre>
  );
}

function Ref({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 font-mono text-[11px] text-muted-foreground/70 italic">{children}</p>;
}

function ParamsTable() {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 pr-4 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Símbolo
            </th>
            <th className="py-2 pr-4 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Definição
            </th>
            <th className="py-2 pr-4 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Padrão
            </th>
            <th className="py-2 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Fonte
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 text-xs">
          {[
            [
              "D_T",
              "dose efectiva de T = dose_TU × 0,6315",
              "631,5 mg (1000 mg TU)",
              "Razão MW: 288,43/456,71",
            ],
            [
              "ka",
              "constante de absorção = ln 2 / t½_abs",
              "0,1733 d⁻¹ (t½ = 4 d)",
              "Compromisso ENIGI/Schubert",
            ],
            [
              "ke",
              "constante terminal = ln 2 / t½_elim",
              "0,0210 d⁻¹ (t½ = 33 d)",
              "Schubert 2004",
            ],
            ["F", "biodisponibilidade", "1,0 (IM directo)", "—"],
            ["Cl", "clearance = Cl_kg × peso", "17,5 × peso L/dia", "ENIGI/Defreyne 2018"],
          ].map(([sym, def, val, src]) => (
            <tr key={sym}>
              <td className="py-2 pr-4 font-mono font-medium text-foreground">{sym}</td>
              <td className="py-2 pr-4 text-muted-foreground">{def}</td>
              <td className="py-2 pr-4 font-mono text-foreground">{val}</td>
              <td className="py-2 text-muted-foreground/80 italic">{src}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Dados de referências ──────────────────────────────────────────────────────

const REFERENCES = [
  {
    n: 1,
    authors: "Schubert M et al.",
    journal: "J Clin Endocrinol Metab 2004;89(11):5429–34.",
    year: "",
    doi: "10.1210/jc.2004-0935",
    role: "PK do TU 1000 mg IM: Tmax, t½",
  },
  {
    n: 2,
    authors: "Behre HM, Nieschlag E.",
    journal: "Eur J Endocrinol 1999;140(5):414–9.",
    year: "",
    doi: "10.1530/eje.0.1400414",
    role: "Cinética flip-flop TU IM",
  },
  {
    n: 3,
    authors: "Wang C et al.",
    journal: "J Clin Endocrinol Metab 2004;89(2):534–43.",
    year: "",
    doi: "10.1210/jc.2003-030330",
    role: "MCR da testosterona (~21 L/kg/d)",
  },
  {
    n: 4,
    authors: "Defreyne J et al.",
    journal: "Andrology 2018;6(3):441–51.",
    year: "",
    doi: "10.1111/andr.12480",
    role: "ENIGI; Cl ≈ 17,5 L/kg/d em homens trans",
  },
  {
    n: 5,
    authors: "Pelusi C et al.",
    journal: "Andrology 2014;2(4):516–21.",
    year: "",
    doi: "10.1111/j.2047-2927.2014.00211.x",
    role: "Validação em homens trans",
  },
  {
    n: 6,
    authors: "Hembree WC et al.",
    journal: "J Clin Endocrinol Metab 2017;102(11):3869–903.",
    year: "",
    doi: "10.1210/jc.2017-01658",
    role: "Endocrine Society CPG 2017",
  },
  {
    n: 7,
    authors: "Travison TG et al.",
    journal: "J Clin Endocrinol Metab 2017;102(4):1161–73.",
    year: "",
    doi: "10.1210/jc.2016-2935",
    role: "Intervalo de referência 264–916 ng/dL",
  },
  {
    n: 8,
    authors: "Coleman E et al.",
    journal: "J Sex Med 2022;19(3):S1–S259.",
    year: "",
    doi: "10.1016/j.jsxm.2022.01.003",
    role: "WPATH Standards of Care v8",
  },
  {
    n: 9,
    authors: "Zitzmann M, Nieschlag E.",
    journal: "Nat Clin Pract Urol 2007;4(3):160–70.",
    year: "",
    doi: "10.1038/ncpuro0753",
    role: "Variabilidade inter-individual TU IM",
  },
  {
    n: 10,
    authors: "Rowland M, Tozer TN.",
    journal: "Clinical Pharmacokinetics and Pharmacodynamics. 5ª ed. Wolters Kluwer; 2011.",
    year: "",
    doi: null,
    role: "Fundamentos PK; integração trapezoidal",
  },
  {
    n: 11,
    authors: "Saad F et al.",
    journal: "J Androl 2007;28(4):568–76.",
    year: "",
    doi: "10.2164/jandrol.106.001859",
    role: "Individualização de intervalos TU IM",
  },
  {
    n: 12,
    authors: "Zitzmann M et al.",
    journal: "J Urol 2013;190(1):234–40.",
    year: "",
    doi: "10.1016/j.juro.2013.01.051",
    role: "Variabilidade clínica e ajuste de intervalos",
  },
] as const;
