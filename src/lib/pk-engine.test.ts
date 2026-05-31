/**
 * Golden tests do motor farmacocinético (item 8 da documentação).
 *
 * Travam o comportamento do motor contra os valores calibrados em literatura
 * (Behre/Nieschlag 1999, Schubert 2004 — Nebido 1000 mg em óleo de mamona).
 *
 * Mudanças que alterem qualquer um desses valores DEVEM ser deliberadas
 * (re-calibração) e o teste atualizado em conjunto, nunca silenciosamente.
 */
import { describe, it, expect } from "vitest";
import {
  ALVOS_CALIBRACAO,
  CONFIG_PADRAO,
  EUGONADAL_MIN_NGDL,
  EUGONADAL_MAX_NGDL,
  PARAMETROS_POPULACIONAIS,
  calcularMetricas,
  calcularMetricasSS,
  gerarCronograma,
  gerarCronogramaSchubert,
  recomendarIntervalo,
  simularMonteCarlo,
  simularPerfil,
} from "./pk-engine";

// Regime Schubert (carga + manutenção q12sem) — usado para calibração.
const dosesSchubert = gerarCronogramaSchubert(1000, 10);

describe("calibração: paciente típico (Schubert q12 sem, 1000 mg)", () => {
  const perfil = simularPerfil(dosesSchubert, PARAMETROS_POPULACIONAIS, CONFIG_PADRAO);
  const m = calcularMetricasSS(perfil, dosesSchubert);

  it("Cmax 1ª dose dentro de ±15% do alvo (~404 ng/dL)", () => {
    const alvo = ALVOS_CALIBRACAO.cmaxDose1Ngdl;
    expect(m.cmaxNgdl).toBeGreaterThan(alvo * 0.85);
    expect(m.cmaxNgdl).toBeLessThan(alvo * 1.15);
  });

  it("Tmax 1ª dose entre 5 e 14 dias", () => {
    expect(m.tmaxDias).toBeGreaterThanOrEqual(5);
    expect(m.tmaxDias).toBeLessThanOrEqual(14);
  });

  it("Cmin SS dentro de ±15% do alvo (~460 ng/dL) e acima de 264", () => {
    const alvo = ALVOS_CALIBRACAO.cminSSNgdl;
    expect(m.cminNgdl).toBeGreaterThan(alvo * 0.85);
    expect(m.cminNgdl).toBeLessThan(alvo * 1.15);
    expect(m.cminNgdl).toBeGreaterThan(EUGONADAL_MIN_NGDL);
  });

  it("Cmax SS dentro de ±20% do alvo (~940 ng/dL)", () => {
    const alvo = ALVOS_CALIBRACAO.cmaxSSNgdl;
    expect(m.cmaxSSNgdl).toBeGreaterThan(alvo * 0.8);
    expect(m.cmaxSSNgdl).toBeLessThan(alvo * 1.2);
  });

  it("Cavg SS dentro de ±15% do alvo (~600 ng/dL)", () => {
    const alvo = ALVOS_CALIBRACAO.cavgSSNgdl;
    expect(m.cavgNgdl).toBeGreaterThan(alvo * 0.85);
    expect(m.cavgNgdl).toBeLessThan(alvo * 1.15);
  });

  it("t½ aparente entre 70 e 130 dias (alvo ~90 d)", () => {
    expect(m.t12AparenteDias).toBeGreaterThan(70);
    expect(m.t12AparenteDias).toBeLessThan(130);
  });

  it("razão pico:vale SS entre 1,5 e 3,0 (literatura ~2,0–2,5)", () => {
    const razao = m.cmaxSSNgdl / m.cminNgdl;
    expect(razao).toBeGreaterThan(1.5);
    expect(razao).toBeLessThan(3.0);
  });
});

describe("variabilidade populacional (Monte Carlo)", () => {
  const mc = simularMonteCarlo(dosesSchubert, 200, {
    ...CONFIG_PADRAO,
    passoDias: 1,
  });

  it("CV de Cmin SS entre 0,20 e 0,55 (literatura ~0,34)", () => {
    const cv = mc.metricasPopulacionais.cminSSDpNgdl / mc.metricasPopulacionais.cminSSMediaNgdl;
    expect(cv).toBeGreaterThan(0.2);
    expect(cv).toBeLessThan(0.55);
  });

  it("mediana de Cmin SS próxima da média populacional (±20%)", () => {
    const alvo = ALVOS_CALIBRACAO.cminSSNgdl;
    expect(mc.metricasPopulacionais.cminSSMediaNgdl).toBeGreaterThan(alvo * 0.8);
    expect(mc.metricasPopulacionais.cminSSMediaNgdl).toBeLessThan(alvo * 1.2);
  });

  it("percentil 5 < percentil 25 < mediana < percentil 75 < percentil 95", () => {
    const idx = Math.floor(mc.mediana.length * 0.7); // ponto bem no SS
    expect(mc.p5[idx].ngdl).toBeLessThan(mc.p25[idx].ngdl);
    expect(mc.p25[idx].ngdl).toBeLessThan(mc.mediana[idx].ngdl);
    expect(mc.mediana[idx].ngdl).toBeLessThan(mc.p75[idx].ngdl);
    expect(mc.p75[idx].ngdl).toBeLessThan(mc.p95[idx].ngdl);
  });

  it("percentual de tempo eugonádico maior que 60%", () => {
    expect(mc.metricasPopulacionais.percentEugonadal).toBeGreaterThan(60);
  });
});

describe("recomendação de intervalo", () => {
  it("paciente típico (vale 460, pico 940 em 12 sem) → intervalo próximo de 12 sem", () => {
    const rec = recomendarIntervalo({
      doseMg: 1000,
      intervaloDias: 84,
      cmaxObservadoNgdl: 940,
      cminObservadoNgdl: 460,
    });
    expect(rec.intervaloRecomendadoDias).toBeGreaterThanOrEqual(70);
    expect(rec.intervaloRecomendadoDias).toBeLessThanOrEqual(98);
  });

  it("paciente com vale baixo (200) → intervalo menor que o atual (12 sem)", () => {
    const rec = recomendarIntervalo({
      doseMg: 1000,
      intervaloDias: 84,
      cmaxObservadoNgdl: 700,
      cminObservadoNgdl: 200,
    });
    // Ou recomenda intervalo menor, ou sinaliza que nenhum intervalo é seguro.
    expect(
      rec.intervaloRecomendadoDias < 84 ||
        rec.justificativa.toLowerCase().includes("aumentar a dose"),
    ).toBe(true);
  });

  it("classificação de sensibilidade reflete o fator individual", () => {
    const baixo = recomendarIntervalo({
      doseMg: 1000,
      intervaloDias: 84,
      cmaxObservadoNgdl: 500,
      cminObservadoNgdl: 230,
    });
    const alto = recomendarIntervalo({
      doseMg: 1000,
      intervaloDias: 84,
      cmaxObservadoNgdl: 1400,
      cminObservadoNgdl: 700,
    });
    expect(baixo.fatorIndividual).toBeLessThan(alto.fatorIndividual);
  });
});

describe("gerador de cronograma", () => {
  it("gerarCronograma produz nDoses uniformemente espaçadas", () => {
    const c = gerarCronograma(1000, 84, 5);
    expect(c).toHaveLength(5);
    expect(c[0].diaDose).toBe(0);
    expect(c[4].diaDose).toBe(4 * 84);
  });

  it("gerarCronogramaSchubert: carga na semana 6, depois q12sem", () => {
    const c = gerarCronogramaSchubert(1000, 4);
    expect(c[0].diaDose).toBe(0);
    expect(c[1].diaDose).toBe(42); // 6 sem
    expect(c[2].diaDose).toBe(42 + 84); // +12 sem
    expect(c[3].diaDose).toBe(42 + 168);
  });
});

describe("invariantes físicos", () => {
  it("concentração nunca é negativa", () => {
    const perfil = simularPerfil(dosesSchubert, PARAMETROS_POPULACIONAIS, CONFIG_PADRAO);
    for (const p of perfil) expect(p.ngdl).toBeGreaterThanOrEqual(0);
  });

  it("dobrar a dose dobra (aprox.) os níveis em SS — linearidade do modelo", () => {
    const doses1 = gerarCronogramaSchubert(500, 10);
    const doses2 = gerarCronogramaSchubert(1000, 10);
    const m1 = calcularMetricas(
      simularPerfil(doses1, PARAMETROS_POPULACIONAIS, CONFIG_PADRAO),
      doses1,
    );
    const m2 = calcularMetricas(
      simularPerfil(doses2, PARAMETROS_POPULACIONAIS, CONFIG_PADRAO),
      doses2,
    );
    const razaoCavg = m2.cavgNgdl / m1.cavgNgdl;
    expect(razaoCavg).toBeGreaterThan(1.9);
    expect(razaoCavg).toBeLessThan(2.1);
  });

  it("limiares eugonadais são consistentes (264 < 916)", () => {
    expect(EUGONADAL_MIN_NGDL).toBeLessThan(EUGONADAL_MAX_NGDL);
  });
});
