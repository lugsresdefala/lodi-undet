// Modelo farmacocinético do undecilato de testosterona (TU) IM em óleo de rícino
// (formulação tipo Nebido/Reandron 1000 mg / 4 mL).
//
// Base na literatura:
//   • Schubert M et al. JCEM 2004 — perfil PK após 1000 mg IM TU em castor oil:
//     Tmax ≈ 7 d, t½ aparente terminal ≈ 33,9 d, Cmax ≈ 23–37 nmol/L (≈660–1070 ng/dL).
//   • Behre HM, Nieschlag E. Eur J Endocrinol 1999 — TU IM long-acting; cinética
//     de tipo "flip-flop" (a libertação a partir do depósito é a etapa limitante;
//     o t½ aparente reflecte a libertação, não a eliminação intrínseca da T).
//   • Wang C et al. JCEM 2004 — clearance metabólica da testosterona ≈ 1500 L/dia.
//   • Endocrine Society Guideline 2017 / Nebido SmPC — esquema posológico:
//     1000 mg em t = 0, repetir a 6 semanas, depois a cada 10–14 semanas.
//   • Travison TG et al. JCEM 2017 — intervalo harmonizado de testosterona total
//     em adultos saudáveis (19–39 anos): 264–916 ng/dL.
//
// IMPLEMENTAÇÃO. Modelo Bateman de um compartimento, expresso em forma de
// clearance (Cl) em vez de volume de distribuição. Esta forma é numericamente
// estável em cinética flip-flop, onde o Vd aparente perde significado físico:
//
//   C(t) = (F · D_T · ka · ke) / (Cl · (ka − ke)) · (e^(−ke·t) − e^(−ka·t))
//
// onde:
//   D_T  = dose efectiva de testosterona (mg) = dose_TU × 0,6315 (razão MW T/TU)
//   ka   = constante de subida (libertação rápida inicial do depósito)
//   ke   = constante aparente terminal (limite por libertação do depósito)
//   F    = biodisponibilidade (IM ≈ 1,0)
//   Cl   = clearance metabólica da testosterona (L/dia)
//
// Em flip-flop convencional, a menor das duas constantes domina a cauda. Aqui
// definimos ka > ke, tal que ke é o rate-limit (t½ aparente ≈ 33 d) e ka modela
// a fase ascendente (Tmax ≈ 7–14 d).
//
// AVISO: ferramenta educativa; não substitui monitorização sérica nem ajuste
// clínico individual. Variabilidade interindividual é elevada (CV 30–50%).

export interface PkParams {
  /** Dose de undecilato de testosterona em mg (Nebido/Reandron padrão = 1000 mg). */
  doseMg: number;
  /** Intervalo posológico em dias (Endocrine Society 2017: 70–98 d em manutenção). */
  intervalDays: number;
  /** Peso corporal em kg — escala a clearance metabólica. */
  weightKg: number;
  /** t½ de subida (libertação rápida do depósito IM); típico 3–6 d. */
  absorptionHalfLifeD: number;
  /** t½ aparente terminal (flip-flop); Schubert 2004 ≈ 33,9 d. */
  eliminationHalfLifeD: number;
  /** Biodisponibilidade (IM ≈ 1,0). */
  bioavailability: number;
  /** Clearance metabólica da testosterona em L/kg/dia; Wang 2004 ≈ 21 L/kg/d. */
  clearanceLPerKgPerDay: number;
  /** Número de doses simuladas (incluindo loading). */
  doses?: number;
  /** Esquema de loading (Endocrine Society / Nebido): 0, 6w, depois intervalo. */
  loading?: boolean;
}

export const DEFAULT_PK: PkParams = {
  doseMg: 1000,
  intervalDays: 84, // 12 semanas
  weightKg: 70,
  absorptionHalfLifeD: 4,
  eliminationHalfLifeD: 33,
  bioavailability: 1.0,
  clearanceLPerKgPerDay: 21,
  doses: 6,
  loading: true,
};

const LN2 = Math.LN2;
/** Razão de peso molecular: testosterona (288,4) / undecilato (456,7). */
const MW_RATIO_T_TU = 0.6315;

/** Tempos das doses, em dias, considerando esquema de loading. */
export function doseTimes(p: PkParams): number[] {
  const n = p.doses ?? 6;
  const times: number[] = [0];
  if (p.loading) {
    // Endocrine Society 2017 / Nebido SmPC: segunda dose às 6 semanas (42 d).
    times.push(42);
    for (let i = 2; i < n; i++) {
      times.push(times[i - 1] + p.intervalDays);
    }
  } else {
    for (let i = 1; i < n; i++) {
      times.push(i * p.intervalDays);
    }
  }
  return times;
}

/** Concentração após uma única dose, em ng/dL. */
export function singleDoseConcentration(t: number, p: PkParams): number {
  if (t <= 0) return 0;
  const ka = LN2 / p.absorptionHalfLifeD;
  const ke = LN2 / p.eliminationHalfLifeD;
  const Cl = p.clearanceLPerKgPerDay * p.weightKg; // L/dia
  const D_T = p.doseMg * MW_RATIO_T_TU; // mg testosterona equivalente
  const F = p.bioavailability;
  // Conversão: mg/L → ng/dL  (×100 000)
  const base = (F * D_T) / Cl * 100_000;
  // Caso degenerado ka ≈ ke: limite analítico C(t) = base·k²·t·e^(−k·t).
  if (Math.abs(ka - ke) < 1e-6) {
    const k = (ka + ke) / 2;
    return base * k * k * t * Math.exp(-k * t);
  }
  return (base * ka * ke) / (ka - ke) * (Math.exp(-ke * t) - Math.exp(-ka * t));
}

/** Tmax analítico de dose única (dias). */
export function singleDoseTmax(p: PkParams): number {
  const ka = LN2 / p.absorptionHalfLifeD;
  const ke = LN2 / p.eliminationHalfLifeD;
  if (Math.abs(ka - ke) < 1e-6) return 1 / ((ka + ke) / 2);
  return Math.log(ka / ke) / (ka - ke);
}

/** Css média esperada em estado estacionário (ng/dL). */
export function steadyStateMean(p: PkParams): number {
  const Cl = p.clearanceLPerKgPerDay * p.weightKg;
  const D_T = p.doseMg * MW_RATIO_T_TU;
  return (p.bioavailability * D_T) / (Cl * p.intervalDays) * 100_000;
}

/** Sobreposição linear (princípio da superposição) das doses do esquema. */
export function steadyStateConcentration(t: number, p: PkParams): number {
  const times = doseTimes(p);
  let sum = 0;
  for (const t0 of times) {
    const tau = t - t0;
    if (tau > 0) sum += singleDoseConcentration(tau, p);
  }
  return sum;
}

export interface PkSeriesPoint {
  day: number;
  concentration: number;
  doseMarker?: boolean;
}

export function generatePkSeries(p: PkParams, opts?: { stepDays?: number }): PkSeriesPoint[] {
  const step = opts?.stepDays ?? 1;
  const times = doseTimes(p);
  const lastDose = times[times.length - 1];
  const totalDays = lastDose + p.intervalDays;
  const markerSet = new Set(times);
  const series: PkSeriesPoint[] = [];
  for (let t = 0; t <= totalDays; t += step) {
    series.push({
      day: t,
      concentration: Math.max(0, steadyStateConcentration(t, p)),
      doseMarker: markerSet.has(t),
    });
  }
  return series;
}

// ──────────────────────────────────────────────────────────────────────────
// Simulação populacional (Monte Carlo)
// Variabilidade inter-individual log-normal aplicada a Cl, ka, ke.
// CV (coef. variação) ~ 30–50% é o reportado em estudos de TU IM
// (Behre 1999, Schubert 2004, Zitzmann 2013). Aqui parametrizado pelo utilizador.
// ──────────────────────────────────────────────────────────────────────────

/** Amostra normal padrão (Box–Muller). */
function randn(rng: () => number): number {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** PRNG determinístico (mulberry32) — reprodutibilidade entre renders. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Amostra log-normal com mediana = median e CV aproximado. */
function lognormal(median: number, cv: number, rng: () => number): number {
  const sigma = Math.sqrt(Math.log(1 + cv * cv));
  return median * Math.exp(sigma * randn(rng));
}

export interface PopulationSeriesPoint {
  day: number;
  p05: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

export interface PopulationSimOptions {
  /** Número de indivíduos simulados. */
  nSubjects: number;
  /** CV inter-individual (0.30 = 30%). */
  cv: number;
  stepDays?: number;
  seed?: number;
}

/** Simula coorte e devolve percentis por dia. */
export function simulatePopulation(
  p: PkParams,
  opts: PopulationSimOptions,
): PopulationSeriesPoint[] {
  const step = opts.stepDays ?? 1;
  const n = Math.max(1, Math.floor(opts.nSubjects));
  const cv = Math.max(0, opts.cv);
  const rng = seededRng(opts.seed ?? 42);

  const times = doseTimes(p);
  const totalDays = times[times.length - 1] + p.intervalDays;
  const days: number[] = [];
  for (let t = 0; t <= totalDays; t += step) days.push(t);

  // matriz [nDays][nSubjects]
  const matrix: number[][] = days.map(() => new Array<number>(n));

  for (let s = 0; s < n; s++) {
    const subject: PkParams = {
      ...p,
      clearanceLPerKgPerDay: lognormal(p.clearanceLPerKgPerDay, cv, rng),
      absorptionHalfLifeD: lognormal(p.absorptionHalfLifeD, cv * 0.7, rng),
      eliminationHalfLifeD: lognormal(p.eliminationHalfLifeD, cv * 0.7, rng),
    };
    for (let i = 0; i < days.length; i++) {
      matrix[i][s] = Math.max(0, steadyStateConcentration(days[i], subject));
    }
  }

  const pct = (arr: number[], q: number) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = (sorted.length - 1) * q;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  };

  return days.map((day, i) => ({
    day,
    p05: pct(matrix[i], 0.05),
    p25: pct(matrix[i], 0.25),
    p50: pct(matrix[i], 0.5),
    p75: pct(matrix[i], 0.75),
    p95: pct(matrix[i], 0.95),
  }));
}

export interface PkMetrics {
  cmax: number;
  cmaxDay: number;
  ctrough: number;
  ctroughDay: number;
  cmean: number;
  inRange: boolean;
}

/** Métricas no último intervalo posológico (proxy de estado estacionário). */
export function computeMetrics(series: PkSeriesPoint[], p: PkParams): PkMetrics {
  const times = doseTimes(p);
  const startDay = times[times.length - 1];
  const endDay = startDay + p.intervalDays;
  const window = series.filter((pt) => pt.day >= startDay && pt.day <= endDay);
  if (window.length === 0) {
    return { cmax: 0, cmaxDay: 0, ctrough: 0, ctroughDay: 0, cmean: 0, inRange: false };
  }
  let cmax = -Infinity;
  let ctrough = Infinity;
  let cmaxDay = startDay;
  let ctroughDay = startDay;
  let sum = 0;
  for (const pt of window) {
    if (pt.concentration > cmax) {
      cmax = pt.concentration;
      cmaxDay = pt.day;
    }
    if (pt.concentration < ctrough) {
      ctrough = pt.concentration;
      ctroughDay = pt.day;
    }
    sum += pt.concentration;
  }
  const cmean = sum / window.length;
  // Intervalo harmonizado adulto (Travison 2017): 264–916 ng/dL.
  const inRange = cmean >= 264 && cmean <= 916;
  return { cmax, cmaxDay, ctrough, ctroughDay, cmean, inRange };
}

/** Conversão ng/dL → nmol/L (factor 0,03467 para testosterona). */
export function ngdlToNmol(ngdl: number): number {
  return ngdl * 0.03467;
}
