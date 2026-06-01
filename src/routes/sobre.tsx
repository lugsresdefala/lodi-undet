import { createFileRoute, Link } from "@tanstack/react-router";

import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { SectionEyebrow } from "@/components/SiteChrome";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre o projeto — lodi-t" },
      {
        name: "description",
        content:
          "Modelo farmacocinético populacional do undecilato de testosterona IM (Nebido): absorção bifásica paralela, integração numérica RK4, simulação Monte Carlo com variabilidade log-normal e recomendação individualizada de intervalo por meta de Cmédia.",
      },
      { property: "og:title", content: "Sobre o projeto — lodi-t" },
      {
        property: "og:description",
        content:
          "Motor PK populacional para undecilato de testosterona IM, com Monte Carlo e ajuste individualizado de intervalo guiado por Cmédia.",
      },
    ],
    links: [{ rel: "canonical", href: "https://lodi-undet.lovable.app/sobre" }],
  }),
  component: SobrePage,
});

function Block({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-24 border-t border-border/60 pt-10">
      <div className="grid gap-6 md:grid-cols-[160px_1fr]">
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          <div className="text-foreground">{n}</div>
          <div className="mt-2">{title}</div>
        </div>
        <div className="prose-clinical space-y-4 text-[15px] leading-relaxed text-foreground/90">
          {children}
        </div>
      </div>
    </section>
  );
}

function Eq({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border/60 bg-muted/40 px-4 py-3 font-mono text-[12.5px] leading-relaxed text-foreground/90">
      {children}
    </pre>
  );
}

function SobrePage() {
  return (
    <main className="relative mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
      <SectionEyebrow n="00" label="Sobre o projeto" />

      <h1 className="font-serif text-balance text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
        Modelo farmacocinético populacional do{" "}
        <span className="italic text-foreground/80">undecilato de testosterona</span>{" "}
        IM, com ajuste individualizado de intervalo por meta de C<sub>média</sub>.
      </h1>

      <p className="mt-6 max-w-3xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
        Esta página descreve, em detalhe técnico, o motor que sustenta a calculadora
        lodi-t: a estrutura do modelo, as equações, os parâmetros populacionais, a
        calibração contra a literatura, a propagação de incerteza por Monte Carlo e o
        algoritmo de recomendação de intervalo. O simulador na rota{" "}
        <Link to="/calculadora" className="underline">/calculadora</Link> é a
        implementação direta deste documento.
      </p>

      <div className="mt-10">
        <MedicalDisclaimer />
      </div>

      <div className="mt-14 space-y-12">
        <Block n="01" title="Resumo">
          <p>
            O undecilato de testosterona em óleo de mamona (Nebido®, 1000 mg IM) é um
            depósito oleoso de liberação prolongada. O motor implementa um modelo PK
            populacional com <strong>absorção bifásica paralela</strong> (dois depósitos
            de primeira ordem com taxas distintas) drenando para um compartimento
            central com eliminação de primeira ordem. As equações diferenciais são
            integradas por Runge–Kutta de 4ª ordem. A variabilidade interindividual é
            modelada como log-normal sobre cada parâmetro estrutural e propagada por
            Monte Carlo. A partir do perfil simulado, o motor recomenda um intervalo
            posológico individualizado que aproxima uma meta de concentração média
            (C<sub>média</sub>) dentro da faixa eugonádica masculina.
          </p>
        </Block>

        <Block n="02" title="Por que dois depósitos">
          <p>
            Um único compartimento de absorção mono-exponencial não consegue reproduzir
            simultaneamente os três fatos clínicos observados com TU IM 1000 mg em óleo
            de mamona:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>T<sub>max</sub> da 1ª dose ≈ 7–14 dias (Behre 1999, Schubert 2004);</li>
            <li>
              Acumulação no estado estacionário C<sub>max,SS</sub>/C<sub>max,dose1</sub>{" "}
              ≈ 2,2–2,5× (Schubert 2004);
            </li>
            <li>
              Razão C<sub>max,SS</sub>/C<sub>min,SS</sub> ≈ 2:1 com τ = 12 semanas
              (Schubert 2004).
            </li>
          </ul>
          <p>
            O componente rápido fixa o tempo até o pico inicial; o componente lento, que
            é limitante da taxa (<em>flip-flop</em>: k<sub>a,lento</sub> ≪ k<sub>e</sub>),
            governa a meia-vida aparente terminal (~90 dias) e o acúmulo no estado
            estacionário.
          </p>
        </Block>

        <Block n="03" title="Equações estruturais">
          <p>Seja Q<sub>R</sub>, Q<sub>L</sub>, Q<sub>C</sub> as quantidades (mg) nos
          depósitos rápido, lento e no compartimento central. Para uma dose D administrada
          no instante t<sub>i</sub>, com fração f<sub>R</sub> ao depósito rápido:</p>
          <Eq>{`Q_R(t_i+) = Q_R(t_i-) + f_R · D
Q_L(t_i+) = Q_L(t_i-) + (1 − f_R) · D

dQ_R/dt = − k_a,rapido · Q_R
dQ_L/dt = − k_a,lento  · Q_L
dQ_C/dt =   k_a,rapido · Q_R + k_a,lento · Q_L − k_e · Q_C

C(t) [ng/dL] = S · Q_C(t)`}</Eq>
          <p>
            O parâmetro S = F/V (em (ng/dL)/mg) condensa biodisponibilidade aparente e
            volume de distribuição central em um único fator de escala clínica,
            calibrado contra a C<sub>max</sub> observada após a 1ª dose.
          </p>
          <p>
            A integração é feita por Runge–Kutta de 4ª ordem com passo padrão{" "}
            h = 0,5 dia e horizonte 730 dias. Doses são tratadas como impulsos
            instantâneos sobre os depósitos.
          </p>
        </Block>

        <Block n="04" title="Parâmetros populacionais">
          <p>Valores típicos (θ<sub>pop</sub>) usados no modelo:</p>
          <Eq>{`k_a,rapido   = 0,0350  /dia   (t½ ≈ 19,8 d)
k_a,lento    = 0,00650 /dia   (t½ ≈ 107 d, limitante)
frac_rapido  = 0,070           (~7 % da dose ao depósito rápido)
k_e          = 0,460   /dia   (t½ central ≈ 1,5 d)
S = F/V      = 24,44 (ng/dL)/mg`}</Eq>
          <p>
            Esses valores foram obtidos por busca em grade seguida de refinamento
            numérico contra os alvos de Behre/Nieschlag 1999 e Schubert 2004 (regime{" "}
            0–6–q12sem, 1000 mg). Validação obtida:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>C<sub>max</sub> 1ª dose: <strong>404 ng/dL</strong> @ T<sub>max</sub> 8 d (alvo: 404 @ 7–11 d) ✓</li>
            <li>C<sub>min,SS</sub>: <strong>449 ng/dL</strong> (alvo ~460) ✓</li>
            <li>C<sub>max,SS</sub>: <strong>830 ng/dL</strong> (alvo ~940; ~12 % abaixo, dentro da IIV) ✓</li>
            <li>C<sub>média,SS</sub>: <strong>627 ng/dL</strong> (alvo ~600) ✓</li>
            <li>t<sub>½</sub> aparente: <strong>102 d</strong> (alvo ~90) ✓</li>
          </ul>
        </Block>

        <Block n="05" title="Variabilidade interindividual (IIV) e Monte Carlo">
          <p>
            Cada parâmetro θ é amostrado por modelo log-normal:
            θ<sub>i</sub> = θ<sub>pop</sub> · exp(η<sub>i</sub>), com{" "}
            η<sub>i</sub> ~ N(0, ω²) e ω² = ln(1 + CV²).
          </p>
          <Eq>{`CV(k_a,rapido)   = 0,35
CV(k_a,lento)    = 0,25
CV(frac_rapido)  = 0,20   (truncado em [0,05; 0,85])
CV(k_e)          = 0,20
CV(S = F/V)      = 0,22`}</Eq>
          <p>
            Os CVs derivam da revisão de farmacologia clínica do Aveed (FDA NDA 022219)
            e de Bhasin &amp; Travison (Endocr Rev 2005). A simulação populacional roda
            N indivíduos sintéticos (padrão N = 200; teto API N = 500), calcula percentis
            5/25/50/75/95 da curva ao longo do tempo e métricas no estado estacionário
            (C<sub>max,SS</sub>, C<sub>min,SS</sub>, C<sub>média,SS</sub>, % de tempo
            eugonádico no intervalo entre doses).
          </p>
        </Block>

        <Block n="06" title="Recomendação individualizada de intervalo">
          <p>
            O motor varre intervalos candidatos (semanas inteiras entre 4 e 18 semanas)
            simulando para cada um o estado estacionário e escolhe aquele que mais
            aproxima a C<sub>média,SS</sub> da meta individual (padrão 600 ng/dL,
            dentro da faixa 264–916 ng/dL). Para cada intervalo testado o status é
            classificado como:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground">
            <li><strong>ideal</strong> — C<sub>max,SS</sub> e C<sub>min,SS</sub> dentro da faixa eugonádica;</li>
            <li><strong>aceitável</strong> — pequeno desvio em um dos extremos;</li>
            <li><strong>Cmin subeugonádica</strong> / <strong>Cmax supraeugonádica</strong> / <strong>ambos fora</strong> — desvios relevantes.</li>
          </ul>
          <p>
            Quando o usuário fornece uma medida real (vale e/ou pico), o motor ajusta
            S (= F/V) por escalonamento simples para reduzir o erro entre o previsto e
            o medido, sem alterar as constantes de absorção/eliminação. Esse passo é
            uma calibração individual mínima — não substitui um ajuste bayesiano
            completo, mas reduz o erro sistemático individual nas previsões
            subsequentes.
          </p>
        </Block>

        <Block n="07" title="Métricas calculadas">
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>C<sub>max</sub> e T<sub>max</sub> da 1ª dose (varredura entre doses 1 e 2);</li>
            <li>C<sub>min,SS</sub>, C<sub>max,SS</sub>, C<sub>média,SS</sub> no último intervalo entre doses;</li>
            <li>t<sub>½</sub> aparente terminal por regressão log-linear na cauda &gt; 30 d após a última dose;</li>
            <li>Tempo até estado estacionário ≈ 4 × t<sub>½</sub> aparente;</li>
            <li>% de tempo no intervalo eugonádico (264–916 ng/dL) ao longo do τ.</li>
          </ul>
        </Block>

        <Block n="08" title="Domínio de validade e limitações">
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>
              Calibrado para <strong>undecilato de testosterona 1000 mg IM em óleo
              de mamona/benzilbenzoato</strong> (Nebido®). Não se aplica a TU em
              óleo de tea-seed (formulação chinesa, t<sub>½</sub> ~33 d) nem a
              cipionato/enantato.
            </li>
            <li>
              Doses entre 250 e 1000 mg na interface e intervalos avaliados entre 4 e 18 semanas; fora
              dessa faixa o modelo extrapola e perde acurácia.
            </li>
            <li>
              Parâmetros populacionais derivados de coortes predominantemente
              masculinas cisgênero adultas. Aplicação a pessoas em hormonização
              transmasculina assume mesma farmacocinética da formulação — premissa
              razoável mas não validada formalmente.
            </li>
            <li>
              Sem covariáveis (peso, SHBG, idade) na versão atual; toda
              individualização vem de calibração por medida real do paciente.
            </li>
            <li>
              Modelo descritivo. Não substitui avaliação clínica, dosagem
              laboratorial nem julgamento médico individual.
            </li>
          </ul>
        </Block>

        <Block n="09" title="Implementação e API">
          <p>
            Motor em TypeScript puro em <code className="font-mono text-[12px]">src/lib/pk-engine.ts</code>,
            sem dependências numéricas externas. As funções públicas{" "}
            <code className="font-mono text-[12px]">simularPerfil</code>,{" "}
            <code className="font-mono text-[12px]">simularMonteCarlo</code>,{" "}
            <code className="font-mono text-[12px]">calcularMetricas</code> e{" "}
            <code className="font-mono text-[12px]">recomendarIntervalo</code> são
            expostas por endpoints HTTP autenticados sob{" "}
            <code className="font-mono text-[12px]">/api/public/v1/</code> (ver{" "}
            <Link to="/api-docs" className="underline">/api-docs</Link>).
          </p>
        </Block>

        <Block n="10" title="Responsabilidade">
          <p>
            Investigador responsável: <strong>Tiago José de Oliveira Gomes</strong>,
            CRM 164375. Este site é referência educativa e técnica: o simulador
            implementa o modelo descrito acima; a cronologia e os efeitos por
            sistema contextualizam o material de consentimento informado.
          </p>
        </Block>

        <Block n="11" title="Referências">
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>
              Behre HM, Abshagen K, Oettel M, Hübler D, Nieschlag E. Intramuscular
              injection of testosterone undecanoate for the treatment of male
              hypogonadism: phase I studies. <em>Eur J Endocrinol</em> 1999;140:414–419.
            </li>
            <li>
              Schubert M, Minnemann T, Hübler D, et al. Intramuscular testosterone
              undecanoate: pharmacokinetic aspects of a novel testosterone
              formulation during long-term treatment of men with hypogonadism.{" "}
              <em>JCEM</em> 2004;89(11):5429–5434.
            </li>
            <li>
              Nebido® (testosterone undecanoate 1000 mg/4 mL) Summary of Product
              Characteristics, seção 5.2. Bayer.
            </li>
            <li>
              Aveed® (testosterone undecanoate 750 mg) FDA Clinical Pharmacology
              and Biopharmaceutics Review, NDA 022219, 2014.
            </li>
            <li>
              Bhasin S, Travison TG. Testosterone pharmacokinetics and
              pharmacodynamics. <em>Endocr Rev</em> 2005.
            </li>
            <li>
              Hembree WC et al. Endocrine Treatment of
              Gender-Dysphoric/Gender-Incongruent Persons. <em>JCEM</em> 2017.
            </li>
            <li>
              Coleman E et al. Standards of Care for the Health of Transgender and
              Gender Diverse People, Version 8 (WPATH SOC-8), 2022.
            </li>
          </ul>
        </Block>
      </div>

      <nav className="mt-16 flex flex-wrap items-center gap-3 border-t border-border/60 pt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        <Link to="/calculadora" className="hover:text-foreground">
          → Calculadora
        </Link>
        <span className="opacity-40">·</span>
        <Link to="/cronologia" className="hover:text-foreground">
          → Cronologia
        </Link>
        <span className="opacity-40">·</span>
        <Link to="/efeitos" className="hover:text-foreground">
          → Efeitos
        </Link>
      </nav>
    </main>
  );
}
