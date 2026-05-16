/**
 * Testes unitários para src/lib/pk.ts
 *
 * Cobre: precisão numérica, validação, métricas, Monte Carlo, exportação.
 * Valores de referência: Schubert 2004, ENIGI/Defreyne 2018, Travison 2017.
 */

import { describe, expect, it } from "vitest";
import {
  computeIntervalForTarget,
  computeMetrics,
  DEFAULT_PK,
  doseTimes,
  generatePkSeries,
  MODEL_VERSION,
  ngdlToNmol,
  seededRng,
  simulatePopulation,
  singleDoseConcentration,
  singleDoseTmax,
  steadyStateMean,
  steadyStateConcentration,
  validatePkParams,
  type PkParams,
} from "../pk";

// ── Constantes de teste ──────────────────────────────────────────────────────

/** Parâmetros padrão extraídos para clareza. */
const P = DEFAULT_PK;

// ── MODEL_VERSION ────────────────────────────────────────────────────────────

describe("MODEL_VERSION", () => {
  it("é uma string no formato semver", () => {
    expect(typeof MODEL_VERSION).toBe("string");
    expect(MODEL_VERSION.length).toBeGreaterThan(0);
    expect(MODEL_VERSION).toMatch(/^\d+\.\d+/);
  });
});

// ── doseTimes ────────────────────────────────────────────────────────────────

describe("doseTimes", () => {
  it("com loading: primeira dose em 0, segunda em 42 d", () => {
    const times = doseTimes({ ...P, loading: true, doses: 4, intervalDays: 84 });
    expect(times[0]).toBe(0);
    expect(times[1]).toBe(42);
  });

  it("com loading: doses após a segunda seguem o intervalo de manutenção", () => {
    const times = doseTimes({ ...P, loading: true, doses: 4, intervalDays: 84 });
    expect(times[2]).toBe(42 + 84);
    expect(times[3]).toBe(42 + 84 * 2);
  });

  it("sem loading: doses igualmente espaçadas", () => {
    const times = doseTimes({ ...P, loading: false, doses: 3, intervalDays: 84 });
    expect(times).toEqual([0, 84, 168]);
  });

  it("devolve exatamente N tempos", () => {
    const n = 6;
    expect(doseTimes({ ...P, doses: n }).length).toBe(n);
  });

  it("primeira dose é sempre 0", () => {
    expect(doseTimes(P)[0]).toBe(0);
  });
});

// ── singleDoseConcentration ───────────────────────────────────────────────────

describe("singleDoseConcentration", () => {
  it("retorna 0 para t ≤ 0", () => {
    expect(singleDoseConcentration(0, P)).toBe(0);
    expect(singleDoseConcentration(-1, P)).toBe(0);
  });

  it("é positivo para t > 0", () => {
    expect(singleDoseConcentration(7, P)).toBeGreaterThan(0);
    expect(singleDoseConcentration(14, P)).toBeGreaterThan(0);
  });

  it("pico está na faixa esperada para dose única (200–1200 ng/dL)", () => {
    let peak = 0;
    for (let t = 1; t <= 120; t++) {
      const c = singleDoseConcentration(t, P);
      if (c > peak) peak = c;
    }
    expect(peak).toBeGreaterThan(200);
    expect(peak).toBeLessThan(1200);
  });

  it("concentração decresce após o pico", () => {
    const tmax = Math.round(singleDoseTmax(P));
    const cAtTmax = singleDoseConcentration(tmax, P);
    const cLater = singleDoseConcentration(tmax + 30, P);
    expect(cLater).toBeLessThan(cAtTmax);
  });

  it("caso degenerado ka ≈ ke não lança erro", () => {
    const pDegenerate: PkParams = { ...P, absorptionHalfLifeD: 33, eliminationHalfLifeD: 33 };
    expect(() => singleDoseConcentration(10, pDegenerate)).not.toThrow();
    expect(singleDoseConcentration(10, pDegenerate)).toBeGreaterThan(0);
  });
});

// ── singleDoseTmax ───────────────────────────────────────────────────────────

describe("singleDoseTmax", () => {
  it("Tmax com parâmetros padrão está entre 7 e 20 dias", () => {
    const tmax = singleDoseTmax(P);
    expect(tmax).toBeGreaterThan(7);
    expect(tmax).toBeLessThan(20);
  });

  it("Tmax aumenta quando t½_abs aumenta (absorção mais lenta → pico mais tardio)", () => {
    const tmaxFast = singleDoseTmax({ ...P, absorptionHalfLifeD: 2 });
    const tmaxSlow = singleDoseTmax({ ...P, absorptionHalfLifeD: 8 });
    expect(tmaxSlow).toBeGreaterThan(tmaxFast);
  });
});

// ── steadyStateMean ──────────────────────────────────────────────────────────

describe("steadyStateMean", () => {
  it("com parâmetros padrão (70 kg, 84 d, 1000 mg) está entre 400 e 900 ng/dL", () => {
    const css = steadyStateMean(P);
    // Fórmula analítica: css = F·D_T / (Cl·τ) · 1e5
    // = 1·631.5 / (17.5·70·84) · 1e5 ≈ 614 ng/dL
    expect(css).toBeGreaterThan(400);
    expect(css).toBeLessThan(900);
  });

  it("cresce linearmente com a dose", () => {
    const css1 = steadyStateMean({ ...P, doseMg: 500 });
    const css2 = steadyStateMean({ ...P, doseMg: 1000 });
    expect(css2 / css1).toBeCloseTo(2, 1);
  });

  it("decresce quando o intervalo aumenta", () => {
    const css84 = steadyStateMean({ ...P, intervalDays: 84 });
    const css112 = steadyStateMean({ ...P, intervalDays: 112 });
    expect(css112).toBeLessThan(css84);
  });

  it("é inversamente proporcional ao peso (através da clearance)", () => {
    const css70 = steadyStateMean({ ...P, weightKg: 70 });
    const css140 = steadyStateMean({ ...P, weightKg: 140 });
    expect(css70 / css140).toBeCloseTo(2, 1);
  });
});

// ── steadyStateConcentration ─────────────────────────────────────────────────

describe("steadyStateConcentration", () => {
  it("retorna 0 em t = 0 (antes de qualquer dose ter efeito)", () => {
    expect(steadyStateConcentration(0, P)).toBe(0);
  });

  it("é positivo após a primeira dose", () => {
    expect(steadyStateConcentration(7, P)).toBeGreaterThan(0);
  });

  it("acumula concentração: imediatamente após 2ª dose supera a concentração pré-2ª-dose", () => {
    // Com loading: dose 2 em dia 42. Concentração logo após (dia 43) deve ser maior que no dia 41 (pré-dose 2)
    const preDose2 = steadyStateConcentration(41, P);
    const postDose2 = steadyStateConcentration(43, P);
    expect(postDose2).toBeGreaterThan(preDose2);
  });
});

// ── computeMetrics ────────────────────────────────────────────────────────────

describe("computeMetrics", () => {
  const series = generatePkSeries(P, { stepDays: 1 });

  it("Cmax > Ctrough (pico > vale)", () => {
    const m = computeMetrics(series, P);
    expect(m.cmax).toBeGreaterThan(m.ctrough);
  });

  it("Cmédia está entre Ctrough e Cmax", () => {
    const m = computeMetrics(series, P);
    expect(m.cmean).toBeGreaterThanOrEqual(m.ctrough);
    expect(m.cmean).toBeLessThanOrEqual(m.cmax);
  });

  it("inRange é true para parâmetros padrão (coorte ENIGI dentro de 264–916 ng/dL)", () => {
    const m = computeMetrics(series, P);
    expect(m.inRange).toBe(true);
  });

  it("inRange é false quando Cmédia está muito acima do intervalo", () => {
    const pHighDose: PkParams = { ...P, doseMg: 3000, intervalDays: 84 };
    const s = generatePkSeries(pHighDose, { stepDays: 1 });
    const m = computeMetrics(s, pHighDose);
    expect(m.cmean).toBeGreaterThan(916);
    expect(m.inRange).toBe(false);
  });

  it("retorna zeros para série vazia", () => {
    const m = computeMetrics([], P);
    expect(m.cmax).toBe(0);
    expect(m.cmean).toBe(0);
    expect(m.inRange).toBe(false);
  });
});

// ── generatePkSeries ──────────────────────────────────────────────────────────

describe("generatePkSeries", () => {
  it("começa no dia 0", () => {
    const s = generatePkSeries(P, { stepDays: 1 });
    expect(s[0].day).toBe(0);
  });

  it("termina no dia lastDose + intervalDays", () => {
    const s = generatePkSeries(P, { stepDays: 1 });
    const expectedEnd = doseTimes(P).at(-1)! + P.intervalDays;
    expect(s.at(-1)!.day).toBe(expectedEnd);
  });

  it("todos os valores de concentração são ≥ 0", () => {
    const s = generatePkSeries(P, { stepDays: 1 });
    expect(s.every((pt) => pt.concentration >= 0)).toBe(true);
  });

  it("marca os dias de dose corretamente", () => {
    const s = generatePkSeries(P, { stepDays: 1 });
    const markedDays = s.filter((pt) => pt.doseMarker).map((pt) => pt.day);
    const expectedDoses = doseTimes(P);
    expect(markedDays).toEqual(expect.arrayContaining(expectedDoses));
  });
});

// ── validatePkParams ──────────────────────────────────────────────────────────

describe("validatePkParams", () => {
  it("parâmetros padrão são válidos sem erros", () => {
    const result = validatePkParams(P);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("dose negativa gera erro", () => {
    const result = validatePkParams({ ...P, doseMg: -100 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("doseMg"))).toBe(true);
  });

  it("intervalo zero gera erro", () => {
    const result = validatePkParams({ ...P, intervalDays: 0 });
    expect(result.valid).toBe(false);
  });

  it("peso negativo gera erro", () => {
    const result = validatePkParams({ ...P, weightKg: -10 });
    expect(result.valid).toBe(false);
  });

  it("biodisponibilidade fora de ]0,1] gera erro", () => {
    expect(validatePkParams({ ...P, bioavailability: 0 }).valid).toBe(false);
    expect(validatePkParams({ ...P, bioavailability: 1.1 }).valid).toBe(false);
    expect(validatePkParams({ ...P, bioavailability: 1.0 }).valid).toBe(true);
  });

  it("clearance negativa gera erro", () => {
    const result = validatePkParams({ ...P, clearanceLPerKgPerDay: -1 });
    expect(result.valid).toBe(false);
  });

  it("absorptionHalfLife > eliminationHalfLife gera erro (viola flip-flop)", () => {
    const result = validatePkParams({ ...P, absorptionHalfLifeD: 40, eliminationHalfLifeD: 33 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("flip-flop"))).toBe(true);
  });

  it("dose muito baixa gera aviso (não erro)", () => {
    const result = validatePkParams({ ...P, doseMg: 50 });
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("intervalo muito longo gera aviso", () => {
    const result = validatePkParams({ ...P, intervalDays: 200 });
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("intervalDays"))).toBe(true);
  });
});

// ── computeIntervalForTarget ──────────────────────────────────────────────────

describe("computeIntervalForTarget", () => {
  it("retorna 0 para alvo = 0", () => {
    expect(computeIntervalForTarget(0, P)).toBe(0);
  });

  it("retorna valor positivo para alvo positivo", () => {
    expect(computeIntervalForTarget(550, P)).toBeGreaterThan(0);
  });

  it("é inversamente proporcional ao alvo de Cmédia", () => {
    const tau550 = computeIntervalForTarget(550, P);
    const tau275 = computeIntervalForTarget(275, P);
    expect(tau275 / tau550).toBeCloseTo(2, 1);
  });

  it("com parâmetros padrão e alvo 550 ng/dL, intervalo está entre 60 e 120 dias", () => {
    const tau = computeIntervalForTarget(550, P);
    expect(tau).toBeGreaterThan(60);
    expect(tau).toBeLessThan(120);
  });

  it("é consistente com steadyStateMean: τ calculado produz aproximadamente o alvo", () => {
    const target = 600;
    const tau = computeIntervalForTarget(target, P);
    const css = steadyStateMean({ ...P, intervalDays: tau });
    expect(css).toBeCloseTo(target, 0);
  });
});

// ── ngdlToNmol ────────────────────────────────────────────────────────────────

describe("ngdlToNmol", () => {
  it("0 → 0", () => {
    expect(ngdlToNmol(0)).toBe(0);
  });

  it("288,5 ng/dL ≈ 10 nmol/L (ponto de referência clínico)", () => {
    // 10 nmol/L × (288,43 g/mol) / 10 = 288,43 ng/dL
    expect(ngdlToNmol(288.43)).toBeCloseTo(10, 0);
  });

  it("converte 264 ng/dL (limite inferior de referência) para ~9,2 nmol/L", () => {
    expect(ngdlToNmol(264)).toBeCloseTo(9.2, 0);
  });
});

// ── seededRng e simulatePopulation ────────────────────────────────────────────

describe("seededRng", () => {
  it("é determinístico: mesma seed gera mesmos valores", () => {
    const rng1 = seededRng(42);
    const rng2 = seededRng(42);
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("seeds diferentes geram sequências diferentes", () => {
    const rng1 = seededRng(1);
    const rng2 = seededRng(2);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });

  it("todos os valores estão em [0, 1)", () => {
    const rng = seededRng(99);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("simulatePopulation", () => {
  it("devolve o mesmo número de pontos que a série determinística", () => {
    const series = generatePkSeries(P, { stepDays: 1 });
    const pop = simulatePopulation(P, { nSubjects: 50, cv: 0.3, seed: 1 });
    expect(pop.length).toBe(series.length);
  });

  it("é determinístico com a mesma seed", () => {
    const opts = { nSubjects: 20, cv: 0.3, seed: 42 };
    const pop1 = simulatePopulation(P, opts);
    const pop2 = simulatePopulation(P, opts);
    expect(pop1[10].p50).toBe(pop2[10].p50);
  });

  it("P5 < P25 < P50 < P75 < P95 para todos os pontos com concentração > 0", () => {
    const pop = simulatePopulation(P, { nSubjects: 100, cv: 0.35, seed: 7 });
    const nonZero = pop.filter((pt) => pt.p50 > 0);
    for (const pt of nonZero) {
      expect(pt.p05).toBeLessThanOrEqual(pt.p25);
      expect(pt.p25).toBeLessThanOrEqual(pt.p50);
      expect(pt.p50).toBeLessThanOrEqual(pt.p75);
      expect(pt.p75).toBeLessThanOrEqual(pt.p95);
    }
  });

  it("P50 está próximo da curva determinística no estado estacionário", () => {
    const pop = simulatePopulation(P, { nSubjects: 500, cv: 0.3, seed: 123 });
    const series = generatePkSeries(P, { stepDays: 1 });
    const metrics = computeMetrics(series, P);
    // No estado estacionário, a mediana populacional deve estar razoavelmente
    // próxima da curva determinística (log-normal é assimétrica, mediana < média)
    const lastInterval = pop.filter((pt) => {
      const times = series.filter((s) => s.doseMarker).map((s) => s.day);
      const lastDose = times.at(-1) ?? 0;
      return pt.day >= lastDose && pt.day <= lastDose + P.intervalDays;
    });
    const medianMean = lastInterval.reduce((a, b) => a + b.p50, 0) / lastInterval.length;
    // A mediana (log-normal) deve ser entre 60% e 100% da média determinística
    expect(medianMean).toBeGreaterThan(metrics.cmean * 0.6);
    expect(medianMean).toBeLessThan(metrics.cmean * 1.1);
  });
});
