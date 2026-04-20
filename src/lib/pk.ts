// Pharmacokinetic model — Bateman one-compartment with first-order absorption.
// Used to estimate serum testosterone after intramuscular testosterone undecanoate (TU).
//
// IMPORTANT: This is an educational model. Real-world TU PK shows wide
// inter-individual variability. Use only as a visual reference, not a dosing tool.

export interface PkParams {
  /** Dose in mg (e.g. 1000 mg TU = 631.5 mg testosterone after de-esterification) */
  doseMg: number;
  /** Dosing interval in days (typical: 84 = 12 weeks) */
  intervalDays: number;
  /** Body weight in kg — affects volume of distribution */
  weightKg: number;
  /** Absorption half-life in days (TU depot release; ~20–25 d typical) */
  absorptionHalfLifeD: number;
  /** Elimination half-life in days (testosterone after release; ~2–3 d) */
  eliminationHalfLifeD: number;
  /** Bioavailability fraction (0–1). TU IM ~ 0.85 */
  bioavailability: number;
  /** Number of doses simulated in the build-up */
  doses?: number;
}

export const DEFAULT_PK: PkParams = {
  doseMg: 1000,
  intervalDays: 84,
  weightKg: 70,
  absorptionHalfLifeD: 22,
  eliminationHalfLifeD: 2.5,
  bioavailability: 0.85,
  doses: 6,
};

const LN2 = Math.LN2;

/** Single-dose Bateman equation in ng/dL units. */
export function singleDoseConcentration(t: number, p: PkParams): number {
  if (t <= 0) return 0;
  const ka = LN2 / p.absorptionHalfLifeD;
  const ke = LN2 / p.eliminationHalfLifeD;
  // Volume of distribution ~ 1.0 L/kg for testosterone
  const Vd_L = 1.0 * p.weightKg;
  // TU 1000 mg ≈ 631.5 mg testosterone; we approximate via molecular ratio
  const testosteroneMg = p.doseMg * 0.6315;
  const F = p.bioavailability;
  // Convert mg / L → ng/dL : 1 mg/L = 100,000 ng/dL
  const factor = (F * testosteroneMg * ka) / (Vd_L * (ka - ke)) * 100_000;
  return factor * (Math.exp(-ke * t) - Math.exp(-ka * t));
}

/** Superposition of repeated doses spaced `intervalDays` apart. */
export function steadyStateConcentration(t: number, p: PkParams): number {
  const n = p.doses ?? 6;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const tau = t - i * p.intervalDays;
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
  const totalDays = (p.doses ?? 6) * p.intervalDays + 30;
  const series: PkSeriesPoint[] = [];
  for (let t = 0; t <= totalDays; t += step) {
    series.push({
      day: t,
      concentration: Math.max(0, steadyStateConcentration(t, p)),
      doseMarker: t > 0 && t % p.intervalDays === 0,
    });
  }
  return series;
}

export interface PkMetrics {
  cmax: number;
  cmaxDay: number;
  ctrough: number;
  ctroughDay: number;
  cmean: number;
  inRange: boolean;
}

/** Compute PK metrics over the final dosing interval (steady state proxy). */
export function computeMetrics(series: PkSeriesPoint[], p: PkParams): PkMetrics {
  const n = p.doses ?? 6;
  const startDay = (n - 1) * p.intervalDays;
  const endDay = n * p.intervalDays;
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
  // Adult male reference range ≈ 264–916 ng/dL
  const inRange = cmean >= 264 && cmean <= 916;
  return { cmax, cmaxDay, ctrough, ctroughDay, cmean, inRange };
}
