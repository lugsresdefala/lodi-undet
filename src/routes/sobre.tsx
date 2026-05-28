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
          "Projeto de pesquisa sobre satisfação e qualidade de vida após ajuste de intervalo posológico do undecilato de testosterona, guiado por meta individual de Cmédia.",
      },
      { property: "og:title", content: "Sobre o projeto — lodi-t" },
      {
        property: "og:description",
        content:
          "Estrutura de pesquisa: satisfação e qualidade de vida após ajuste individualizado do intervalo de undecilato de testosterona por meta de Cmédia.",
      },
      { rel: "canonical", href: "https://lodi-undet.lovable.app/sobre" } as never,
    ],
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

function SobrePage() {
  return (
    <main className="relative mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
      <SectionEyebrow n="00" label="Sobre o projeto" />

      <h1 className="font-serif text-balance text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
        Satisfação e qualidade de vida após ajuste individualizado do{" "}
        <span className="italic text-foreground/80">intervalo</span> do undecilato de
        testosterona, guiado por meta de C
        <sub>média</sub>.
      </h1>

      <p className="mt-6 max-w-3xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
        Estrutura de projeto de pesquisa em formato acadêmico. Reúne o racional clínico,
        a hipótese, os métodos e os desfechos para avaliar se ajustar o intervalo entre
        aplicações — e não a dose — a partir de uma meta individual de concentração
        média (C<sub>média</sub>) melhora a satisfação subjetiva e a qualidade de vida de
        pessoas em hormonização com testosterona.
      </p>

      <div className="mt-10">
        <MedicalDisclaimer />
      </div>

      <div className="mt-14 space-y-12">
        <Block n="01" title="Resumo">
          <p>
            O undecilato de testosterona (1000 mg IM) é frequentemente prescrito em
            intervalos fixos de 10 a 14 semanas. Na prática, a variação individual de
            clearance produz exposições médias (C<sub>média</sub>) heterogêneas, com
            queixas no fim do ciclo. Este projeto propõe um modelo de ajuste do{" "}
            <strong>intervalo</strong> posológico — mantendo a dose fixa — para atingir
            uma meta individual de C<sub>média</sub>, e mede o impacto desse ajuste em
            satisfação e qualidade de vida ao longo de seis meses.
          </p>
        </Block>

        <Block n="02" title="Justificativa">
          <p>
            Diretrizes (Endocrine Society 2017; WPATH SOC-8) recomendam alvos de
            testosterona total dentro da faixa fisiológica masculina, sem prescrever um
            esquema único. A literatura descreve que sintomas de fim de ciclo se
            associam mais ao <em>vale</em> do que à média ou ao pico. Ajustar o intervalo
            individualmente, com base em modelo farmacocinético e medições reais, é uma
            estratégia simples, de baixo custo e potencialmente superior ao esquema
            fixo em desfechos centrados na pessoa.
          </p>
        </Block>

        <Block n="03" title="Hipótese">
          <p>
            Pessoas em uso de undecilato de testosterona cujo intervalo posológico é
            ajustado para uma meta individual de C<sub>média</sub> apresentam, em 6 meses,
            melhora clinicamente relevante em satisfação subjetiva e em qualidade de
            vida, em comparação com o intervalo fixo prévio.
          </p>
        </Block>

        <Block n="04" title="Objetivos">
          <p className="font-medium text-foreground">Primário</p>
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>
              Avaliar a variação na satisfação subjetiva com a hormonização após 6 meses
              de intervalo ajustado por meta de C<sub>média</sub>.
            </li>
          </ul>
          <p className="mt-3 font-medium text-foreground">Secundários</p>
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>Variação em qualidade de vida (instrumento padronizado).</li>
            <li>
              Variação em sintomas de fim de ciclo (energia, libido, humor, sono).
            </li>
            <li>Concordância entre C<sub>média</sub> previsto pelo modelo e medido.</li>
            <li>Aderência e segurança (eventos adversos relatados).</li>
          </ul>
        </Block>

        <Block n="05" title="Métodos">
          <p className="font-medium text-foreground">Desenho</p>
          <p>
            Estudo prospectivo, intra-sujeito (cada participante é seu próprio
            controle), com duas fases: <strong>basal</strong> (intervalo fixo prévio,
            8 semanas de observação) e <strong>intervenção</strong> (intervalo ajustado
            por meta de C<sub>média</sub>, 24 semanas).
          </p>

          <p className="mt-4 font-medium text-foreground">População</p>
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>Adultos em hormonização com undecilato de testosterona IM 1000 mg.</li>
            <li>Mínimo de 6 meses de uso contínuo antes da entrada.</li>
            <li>
              Acompanhamento clínico ativo; capacidade de consentir e responder
              questionários autoaplicáveis em PT-BR.
            </li>
          </ul>

          <p className="mt-4 font-medium text-foreground">Intervenção</p>
          <ol className="list-decimal pl-5 text-muted-foreground">
            <li>
              Definição da meta individual de C<sub>média</sub> em conjunto com o médico
              assistente, dentro da faixa fisiológica.
            </li>
            <li>
              Estimativa do intervalo ótimo pelo modelo PK do simulador (calculadora
              lodi-t), a partir de pelo menos uma dosagem de vale medida.
            </li>
            <li>
              Reaplicação ao atingir o intervalo estimado; reavaliação a cada ciclo.
            </li>
          </ol>

          <p className="mt-4 font-medium text-foreground">Instrumentos</p>
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>
              Escala de satisfação com a hormonização (autoaplicável, 0–10, ancorada em
              domínios: energia, libido, humor, sono, corpo).
            </li>
            <li>
              Qualidade de vida: WHOQOL-BREF (versão validada em português) e/ou
              SF-12.
            </li>
            <li>Diário simples de sintomas de fim de ciclo (semanal).</li>
            <li>Dosagem laboratorial de testosterona total em vale.</li>
          </ul>

          <p className="mt-4 font-medium text-foreground">Coleta</p>
          <p>
            Aplicação na entrada (T0), ao final do basal (T1), e nas semanas 8, 16 e 24
            da intervenção (T2–T4). Dados de C<sub>média</sub> previsto vs. medido são
            registrados a cada ciclo.
          </p>
        </Block>

        <Block n="06" title="Desfechos">
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>
              <strong>Primário:</strong> diferença média na escala de satisfação entre
              T1 e T4.
            </li>
            <li>
              <strong>Secundários:</strong> diferença em WHOQOL-BREF por domínio;
              redução de dias com sintomas de fim de ciclo; erro absoluto médio entre
              C<sub>média</sub> previsto e medido; aderência ao intervalo; eventos
              adversos.
            </li>
          </ul>
        </Block>

        <Block n="07" title="Análise">
          <p>
            Análise intra-sujeito por modelos lineares mistos, com participante como
            efeito aleatório e tempo como efeito fixo. Tamanho amostral planejado para
            detectar diferença mínima clinicamente relevante de 1 ponto na escala de
            satisfação, com poder de 80% e alfa de 0,05. Análise por intenção de
            tratar; sensibilidade por aderência.
          </p>
        </Block>

        <Block n="08" title="Ética e proteção de dados">
          <p>
            Protocolo a ser submetido a Comitê de Ética em Pesquisa. Consentimento
            livre e esclarecido em linguagem acessível. Dados pseudonimizados, com
            chave separada sob responsabilidade do investigador principal. Sem incentivo
            financeiro à adesão. Direito de retirada a qualquer momento, sem prejuízo
            ao cuidado.
          </p>
        </Block>

        <Block n="09" title="Limitações">
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>Desenho intra-sujeito sem braço controle paralelo.</li>
            <li>
              Modelo PK populacional; previsão individual depende de uma medida real
              para calibração.
            </li>
            <li>Autorrelato sujeito a viés de expectativa.</li>
            <li>
              Generalização limitada a pessoas já adaptadas ao undecilato (≥ 6 meses).
            </li>
          </ul>
        </Block>

        <Block n="10" title="Equipe e responsabilidade">
          <p>
            Investigador responsável: <strong>Tiago José de Oliveira Gomes</strong>,
            CRM 164375. Este site é uma página de referência educativa que apoia o
            protocolo: o simulador implementa o modelo PK descrito nos métodos e a
            cronologia/efeitos contextualizam o material de consentimento.
          </p>
        </Block>

        <Block n="11" title="Referências">
          <ul className="list-disc pl-5 text-muted-foreground">
            <li>
              Hembree WC et al. Endocrine Treatment of Gender-Dysphoric/Gender-Incongruent
              Persons. <em>JCEM</em>, 2017.
            </li>
            <li>
              Coleman E et al. Standards of Care for the Health of Transgender and Gender
              Diverse People, Version 8 (WPATH SOC-8), 2022.
            </li>
            <li>
              WHOQOL Group. The World Health Organization Quality of Life assessment
              (WHOQOL-BREF), 1998.
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
