// Adaptador que expõe a API pública usada por src/components/PkCalculator.tsx,
// mas implementada inteiramente sobre o motor bicompartmental importado de
// lugsresdefala/Compartment-Model (src/lib/pk-engine.ts):
//
//   • Absorção bifásica paralela (depósito rápido + lento) → compartimento
//     central → eliminação, integrada por Runge-Kutta de 4ª ordem.
//   • Variabilidade interindividual log-normal (Monte Carlo) parametrizada
//     pelo CV escolhido na UI.
//
// As variáveis clínicas controladas na UI (dose, intervalo, peso, t½ de
// absorção, t½ aparente terminal, depuração, biodisponibilidade) são mapeadas
// em ParametrosPK do motor:
//
//   ka_rapido = ln2 / absorptionHalfLifeD
//   ka_lento  = ln2 / eliminationHalfLifeD          (rate-limiting → flip-flop)
//   frac_rapido, ke ← valores populacionais do motor (Schubert/Behre/Aveed)
//   S = S_pop · F · (W_ref · Cl_ref) / (peso · depuração)
//      W_ref = 70 kg, Cl_ref = 17,5 L/kg/d  (ENIGI/Defreyne 2018, Pelusi 2014)
//
// Esta forma preserva a semântica dos sliders: aumentar peso ou depuração
// reduz S (e portanto a concentração); aumentar t½ terminal abranda ka_lento
// (cauda mais alta e prolongada).

import {
  PARAMETROS_POPULACIONAIS,
  NGDL_TO_NMOL,
  simularPerfil,
  type DoseAgendada,
  type ParametrosPK,
} from "./pk-engine";

export interface PkParams {
  /** Dose de undecilato de testosterona em mg (Nebido/Reandron padrão = 1000 mg). */
  doseMg: number;
  /** Intervalo posológico em dias (Endocrine Society 2017: 70–98 d em manutenção). */
  intervalDays: number;
  /** Peso corporal em kg — escala a depuração total. */
  weightKg: number;
  /** t½ do componente de absorção rápida do depósito IM (dias). */
  absorptionHalfLifeD: number;
  /** t½ aparente terminal (flip-flop, dominado pelo depósito lento) (dias). */
  eliminationHalfLifeD: number;
  /** Biodisponibilidade (IM ≈ 1,0). */
  bioavailability: number;
  /** Depuração metabólica efectiva da testosterona em L/kg/dia. */
  clearanceLPerKgPerDay: number;
  /** Fracção da dose alocada ao depósito de libertação rápida (0–1). */
  fracRapido: number;
  /** Número de doses simuladas (incluindo loading). */
  doses?: number;
  /** Esquema de loading (Endocrine Society / Nebido): 0, 6 sem, depois intervalo. */
  loading?: boolean;
}

export const DEFAULT_PK: PkParams = {
  doseMg: 1000,
  intervalDays: 84, // 12 semanas
  weightKg: 70,
  absorptionHalfLifeD: 20, // depósito rápido Nebido (ln2/ka_rapido_pop ≈ 19,8 d)
  eliminationHalfLifeD: 90, // meia-vida de libertação Nebido SmPC 5.2: 90±40 d
  bioavailability: 1.0,
  clearanceLPerKgPerDay: 17.5,
  fracRapido: 0.07, // calibrado (Schubert 2004 / Behre 1999)
  doses: 6,
  loading: true,
};

const LN2 = Math.LN2;
const REF_WEIGHT_KG = 70;
const REF_CL_LKGD = 17.5;

/** Mapeia PkParams da UI → ParametrosPK do motor bicompartmental. */
function toParametros(p: PkParams): ParametrosPK {
  const ka_rapido = LN2 / Math.max(0.1, p.absorptionHalfLifeD);
  const ka_lento = LN2 / Math.max(1, p.eliminationHalfLifeD);
  const scale =
    (p.bioavailability * REF_WEIGHT_KG * REF_CL_LKGD) /
    Math.max(1, p.weightKg * p.clearanceLPerKgPerDay);
  return {
    ka_rapido,
    ka_lento,
    frac_rapido: Math.min(0.85, Math.max(0.02, p.fracRapido)),
    ke: PARAMETROS_POPULACIONAIS.ke,
    S: PARAMETROS_POPULACIONAIS.S * scale,
  };
}

/** Tempos das doses, em dias, considerando esquema de loading. */
export function doseTimes(p: PkParams): number[] {
  const n = p.doses ?? 6;
  const times: number[] = [0];
  if (p.loading) {
    times.push(42); // Endocrine Society 2017 / Nebido SmPC: 2ª dose às 6 sem
    for (let i = 2; i < n; i++) times.push(times[i - 1] + p.intervalDays);
  } else {
    for (let i = 1; i < n; i++) times.push(i * p.intervalDays);
  }
  return times;
}

function buildDoses(p: PkParams): DoseAgendada[] {
  return doseTimes(p).map((diaDose, i) => ({
    diaDose,
    doseMg: p.doseMg,
    rotulo: `Injeção ${i + 1}`,
  }));
}

export interface PkSeriesPoint {
  day: number;
  concentration: number;
  doseMarker?: boolean;
}

export function generatePkSeries(p: PkParams, opts?: { stepDays?: number }): PkSeriesPoint[] {
  const step = opts?.stepDays ?? 1;
  const params = toParametros(p);
  const doses = buildDoses(p);
  const lastDose = doses[doses.length - 1].diaDose;
  const horizonteDias = lastDose + p.intervalDays;
  const perfil = simularPerfil(doses, params, { passoDias: step, horizonteDias });
  const markers = new Set(doses.map((d) => d.diaDose));
  return perfil.map((pt) => ({
    day: pt.dia,
    concentration: Math.max(0, pt.ngdl),
    doseMarker: markers.has(pt.dia),
  }));
}

/** Tmax de dose única (dias) — calculado numericamente sobre o motor. */
export function singleDoseTmax(p: PkParams): number {
  const params = toParametros(p);
  const perfil = simularPerfil(
    [{ diaDose: 0, doseMg: p.doseMg }],
    params,
    { passoDias: 0.5, horizonteDias: 365 },
  );
  let tmax = 0;
  let cmax = 0;
  for (const pt of perfil) {
    if (pt.ngdl > cmax) {
      cmax = pt.ngdl;
      tmax = pt.dia;
    }
  }
  return tmax;
}

/** Css média esperada em estado estacionário (ng/dL), medida no último intervalo de uma série de 14 doses. */
export function steadyStateMean(p: PkParams): number {
  const params = toParametros(p);
  const nDoses = 14;
  const doses: DoseAgendada[] = Array.from({ length: nDoses }, (_, i) => ({
    diaDose: i * p.intervalDays,
    doseMg: p.doseMg,
  }));
  const horizonte = p.intervalDays * (nDoses + 1);
  const perfil = simularPerfil(doses, params, { passoDias: 0.5, horizonteDias: horizonte });
  const tIni = doses[nDoses - 2].diaDose;
  const tFim = doses[nDoses - 1].diaDose;
  const ss = perfil.filter((pt) => pt.dia >= tIni && pt.dia < tFim);
  if (ss.length === 0) return 0;
  return ss.reduce((a, pt) => a + pt.ngdl, 0) / ss.length;
}

/** Concentração no esquema completo (com loading) num dado dia. */
export function steadyStateConcentration(t: number, p: PkParams): number {
  const params = toParametros(p);
  const doses = buildDoses(p);
  const lastDose = doses[doses.length - 1].diaDose;
  const horizonteDias = Math.max(t + 1, lastDose + p.intervalDays);
  const perfil = simularPerfil(doses, params, { passoDias: 0.5, horizonteDias });
  // ponto mais próximo de t
  let best = perfil[0];
  let dmin = Infinity;
  for (const pt of perfil) {
    const d = Math.abs(pt.dia - t);
    if (d < dmin) {
      dmin = d;
      best = pt;
    }
  }
  return Math.max(0, best.ngdl);
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
  const win = series.filter((pt) => pt.day >= startDay && pt.day <= endDay);
  if (win.length === 0) {
    return { cmax: 0, cmaxDay: 0, ctrough: 0, ctroughDay: 0, cmean: 0, inRange: false };
  }
  let cmax = -Infinity;
  let ctrough = Infinity;
  let cmaxDay = startDay;
  let ctroughDay = startDay;
  let trap = 0;
  for (let i = 0; i < win.length; i++) {
    const pt = win[i];
    if (pt.concentration > cmax) {
      cmax = pt.concentration;
      cmaxDay = pt.day;
    }
    if (pt.concentration < ctrough) {
      ctrough = pt.concentration;
      ctroughDay = pt.day;
    }
    const w = i === 0 || i === win.length - 1 ? 0.5 : 1;
    trap += w * pt.concentration;
  }
  const cmean = win.length > 1 ? trap / (win.length - 1) : win[0].concentration;
  // Intervalo harmonizado adulto (Travison TG et al. JCEM 2017;102:1161–73): 264–916 ng/dL.
  const inRange = cmean >= 264 && cmean <= 916;
  return { cmax, cmaxDay, ctrough, ctroughDay, cmean, inRange };
}

// ──────────────────────────────────────────────────────────────────────────
// Monte Carlo populacional (envolve o motor bicompartmental).
// Variabilidade log-normal aplicada a ka_rapido, ka_lento, frac_rapido, ke, S
// em torno dos parâmetros derivados de PkParams. ka_lento/frac/ke recebem
// CV × 0,7 (depósito IM tipicamente menos variável que F/V/clearance).
// ──────────────────────────────────────────────────────────────────────────

export interface PopulationSeriesPoint {
  day: number;
  p05: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

export interface PopulationSimOptions {
  nSubjects: number;
  cv: number;
  stepDays?: number;
  seed?: number;
}

function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randn(rng: () => number): number {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function lognormal(median: number, cv: number, rng: () => number): number {
  const sigma = Math.sqrt(Math.log(1 + cv * cv));
  return median * Math.exp(sigma * randn(rng));
}

function percentile(arr: number[], q: number): number {
  const s = [...arr].sort((a, b) => a - b);
  const idx = q * (s.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

export function simulatePopulation(
  p: PkParams,
  opts: PopulationSimOptions,
): PopulationSeriesPoint[] {
  const step = opts.stepDays ?? 1;
  const cv = Math.max(0, opts.cv);
  const rng = seededRng(opts.seed ?? 42);
  const N = Math.max(1, Math.floor(opts.nSubjects));

  const doses = buildDoses(p);
  const lastDose = doses[doses.length - 1].diaDose;
  const horizonteDias = lastDose + p.intervalDays;
  const base = toParametros(p);

  // Eixo temporal de referência
  const referencia = simularPerfil(doses, base, { passoDias: step, horizonteDias });
  const days = referencia.map((pt) => pt.dia);
  const nT = days.length;
  const matrix: number[][] = Array.from({ length: nT }, () => new Array<number>(N));

  for (let s = 0; s < N; s++) {
    const subj: ParametrosPK = {
      ka_rapido: lognormal(base.ka_rapido, cv, rng),
      ka_lento: lognormal(base.ka_lento, cv * 0.7, rng),
      frac_rapido: Math.min(
        0.85,
        Math.max(0.05, lognormal(base.frac_rapido, cv * 0.5, rng)),
      ),
      ke: lognormal(base.ke, cv * 0.5, rng),
      S: lognormal(base.S, cv, rng),
    };
    const perfil = simularPerfil(doses, subj, { passoDias: step, horizonteDias });
    for (let i = 0; i < nT; i++) {
      matrix[i][s] = Math.max(0, perfil[i]?.ngdl ?? 0);
    }
  }

  return days.map((day, i) => ({
    day,
    p05: percentile(matrix[i], 0.05),
    p25: percentile(matrix[i], 0.25),
    p50: percentile(matrix[i], 0.5),
    p75: percentile(matrix[i], 0.75),
    p95: percentile(matrix[i], 0.95),
  }));
}

/** ng/dL → nmol/L (factor do motor: 1/28,84 ≈ 0,03467). */
export function ngdlToNmol(ngdl: number): number {
  return ngdl * NGDL_TO_NMOL;
}
