/**
 * Versão do modelo farmacocinético.
 * Incrementar sempre que os parâmetros padrão, equações ou calibração mudarem.
 * Ver docs/MODEL.md para detalhes da versão actual.
 */
export const MODEL_VERSION = "2.1";

// Modelo farmacocinético do undecilato de testosterona (TU) IM em óleo de rícino
// (formulação tipo Nebido/Reandron 1000 mg / 4 mL).
//
// Base na literatura:
//   • Schubert M et al. JCEM 2004;89(11):5429–34 — perfil PK após 1000 mg IM TU
//     em castor oil em homens hipogonadais: Tmax mediano ≈ 7 d, t½ aparente
//     terminal 33,9 ± 26,6 d (elevada variabilidade), Cmax ≈ 23–37 nmol/L
//     (≈660–1070 ng/dL).
//   • Behre HM, Nieschlag E. Eur J Endocrinol 1999;140(5):414–9 — primeira
//     descrição da cinética de tipo "flip-flop" para TU IM 1000 mg: a libertação
//     a partir do depósito lipofílico é a etapa limitante; o t½ aparente reflecte
//     a taxa de libertação do depot, não a eliminação intrínseca da T (t½ real
//     da T livre ≈ 10–100 min).
//   • Wang C et al. JCEM 2004;89(2):534–43 — clearance metabólica da testosterona
//     (MCR) medida por diluição isotópica em homens cis eugonadais: MCR ≈ 1500 L/d
//     (~21 L/kg/d a 70 kg).
//   • Defreyne J et al. J Sex Med 2017;14(5):e345; Defreyne J et al. Andrology
//     2018;6(3):441–51 (coorte ENIGI, n = 53 homens trans) e Pelusi C et al.
//     Andrology 2014;2(4):516–21 — em homens trans em hormonização masculinizante
//     com TU IM 1000 mg q10–14 sem, Cmédia em estado estacionário situa-se
//     ~600–700 ng/dL (Cmin ~13–15 nmol/L ≈ 375–430 ng/dL; Cmax ~28–32 nmol/L
//     ≈ 810–920 ng/dL). A clearance efectiva retro-calculada a partir destas
//     concentrações observadas é ~17–18 L/kg/d, inferior à MCR de homens cis
//     eugonadais (Wang 2004). Este modelo está calibrado por defeito para esta
//     população (Cl = 17,5 L/kg/d).
//   • Endocrine Society Clinical Practice Guideline 2017 (Hembree WC et al.
//     JCEM 2017;102(11):3869–903) / SmPC Nebido — esquema posológico:
//     1000 mg em t = 0, repetir às 6 semanas (42 d), depois a cada 10–14 semanas.
//   • Travison TG et al. JCEM 2017;102(4):1161–73 — intervalo harmonizado de
//     testosterona total em homens saudáveis dos 19–39 anos: 264–916 ng/dL
//     (percentis 2,5–97,5 em 4 coortes EUA/UE combinadas).
//
// IMPLEMENTAÇÃO. Modelo Bateman de um compartimento, expresso em forma de
// clearance (Cl) em vez de volume de distribuição. Esta forma é numericamente
// estável em cinética flip-flop, onde o Vd aparente perde significado físico:
//
//   C(t) = (F · D_T · ka · ke) / (Cl · (ka − ke)) · (e^(−ke·t) − e^(−ka·t))
//
// onde:
//   D_T  = dose efectiva de testosterona (mg) = dose_TU × 0,6315 (razão MW T/TU:
//          288,43 g/mol / 456,71 g/mol)
//   ka   = constante de absorção (libertação rápida inicial do depot IM)
//   ke   = constante aparente terminal (dominada pela libertação lenta do depot)
//   F    = biodisponibilidade (IM ≈ 1,0)
//   Cl   = clearance metabólica efectiva da testosterona (L/dia)
//
// Em cinética flip-flop (ka > ke), a cauda terminal é governada por ke e o pico
// analítico surge em Tmax = ln(ka/ke)/(ka − ke). Com os parâmetros padrão
// (t½_abs = 4 d → ka ≈ 0,173 d⁻¹; t½_elim = 33 d → ke ≈ 0,021 d⁻¹), o modelo
// produz Tmax ≈ 14 d. O Tmax mediano reportado por Schubert 2004 é ~7 d, o que
// corresponderia a t½_abs ≈ 1,5 d; contudo, esse valor gera Cmax >900 ng/dL por
// dose única, acima do intervalo ENIGI observado (~810–920 ng/dL em estado
// estacionário). Os parâmetros padrão constituem um compromisso calibrado para
// compatibilidade simultânea com o Cmax e a Cmédia da coorte ENIGI, à custa de
// um Tmax ligeiramente mais tardio do que o mediano de Schubert 2004.
//
// AVISO: ferramenta educativa; não substitui monitorização sérica nem ajuste
// clínico individual. A variabilidade inter-individual é elevada (CV 30–50% para
// Cl, ka e ke; Schubert 2004, Behre 1999, Zitzmann M, Nieschlag E. Nat Clin
// Pract Urol 2007;4(3):160–70).

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
  /** Clearance metabólica efectiva da testosterona em L/kg/dia.
   *  Default 17,5 calibrado para homens trans em hormonização (ENIGI/Defreyne 2018,
   *  Pelusi 2014). Em homens cis eugonadais (Wang 2004) é ~21 L/kg/d. */
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
  clearanceLPerKgPerDay: 17.5,
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
  const base = ((F * D_T) / Cl) * 100_000;
  // Caso degenerado ka ≈ ke: limite analítico C(t) = base·k²·t·e^(−k·t).
  if (Math.abs(ka - ke) < 1e-6) {
    const k = (ka + ke) / 2;
    return base * k * k * t * Math.exp(-k * t);
  }
  return ((base * ka * ke) / (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t));
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
  return ((p.bioavailability * D_T) / (Cl * p.intervalDays)) * 100_000;
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
// (Schubert 2004;89:5429–34; Behre & Nieschlag 1999;140:414–9;
// Zitzmann M & Nieschlag E, Nat Clin Pract Urol 2007;4(3):160–70).
// Aqui parametrizado pelo utilizador.
//
// O factor de escala 0,7 aplicado ao CV de ka e ke reflecte o pressuposto de
// que a clearance sistémica (determinada por enzimas hepáticas e composição
// corporal) exibe maior variabilidade inter-individual do que os parâmetros de
// libertação do depot (ka, ke), que dependem predominantemente do volume e
// vascularização do local de injecção. Este rácio é uma escolha de modelação;
// na ausência de dados de variância conjunta publicados para TU IM, assume-se
// independência log-normal entre os três parâmetros.
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
  let trapSum = 0;
  for (let i = 0; i < window.length; i++) {
    const pt = window[i];
    if (pt.concentration > cmax) {
      cmax = pt.concentration;
      cmaxDay = pt.day;
    }
    if (pt.concentration < ctrough) {
      ctrough = pt.concentration;
      ctroughDay = pt.day;
    }
    // Integração trapezoidal: peso 0,5 nos extremos, 1 nos pontos interiores.
    // Calcula AUC/τ, que é a verdadeira média temporal (Rowland & Tozer, 5ª ed.).
    const w = i === 0 || i === window.length - 1 ? 0.5 : 1;
    trapSum += w * pt.concentration;
  }
  // window.length - 1 = número de intervalos de 1 d = τ (em dias inteiros)
  const cmean = window.length > 1 ? trapSum / (window.length - 1) : window[0].concentration;
  // Intervalo harmonizado adulto (Travison TG et al. JCEM 2017;102:1161–73): 264–916 ng/dL.
  const inRange = cmean >= 264 && cmean <= 916;
  return { cmax, cmaxDay, ctrough, ctroughDay, cmean, inRange };
}

/**
 * Conversão ng/dL → nmol/L para testosterona.
 * Factor = 10 / MW_T = 10 / 288,43 = 0,03467 nmol·dL/(ng·L).
 * (1 ng/dL = 10 ng/L; 1 nmol/L = 288,43 ng/L para T com MW = 288,43 g/mol.)
 */
export function ngdlToNmol(ngdl: number): number {
  return ngdl * 0.03467;
}

// ──────────────────────────────────────────────────────────────────────────
// Validação de parâmetros PK
// ──────────────────────────────────────────────────────────────────────────

export interface PkValidation {
  /** true se os parâmetros são suficientemente válidos para uma simulação. */
  valid: boolean;
  /** Erros que impedem a simulação (parâmetros fora de intervalo fisicamente possível). */
  errors: string[];
  /** Avisos que não impedem a simulação mas indicam valores atípicos. */
  warnings: string[];
}

/**
 * Valida os parâmetros PK e devolve erros/avisos estruturados.
 * Aceita Partial<PkParams> para ser útil em fluxos de formulário progressivos.
 */
export function validatePkParams(p: Partial<PkParams>): PkValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (p.doseMg !== undefined) {
    if (p.doseMg <= 0) errors.push("doseMg deve ser positivo.");
    else if (p.doseMg < 100)
      warnings.push(
        `doseMg = ${p.doseMg} mg é muito baixo para TU IM; formulações típicas: 250–1000 mg.`,
      );
    else if (p.doseMg > 2000)
      warnings.push(
        `doseMg = ${p.doseMg} mg excede as doses documentadas na literatura (máx. ≈ 1000 mg/aplicação).`,
      );
  }

  if (p.intervalDays !== undefined) {
    if (p.intervalDays <= 0) errors.push("intervalDays deve ser positivo.");
    else if (p.intervalDays < 28)
      warnings.push(
        `intervalDays = ${p.intervalDays} d é muito curto para TU IM (mín. documentado ≈ 42 d).`,
      );
    else if (p.intervalDays > 180)
      warnings.push(
        `intervalDays = ${p.intervalDays} d excede o máximo documentado na literatura (~168 d).`,
      );
  }

  if (p.weightKg !== undefined) {
    if (p.weightKg <= 0) errors.push("weightKg deve ser positivo.");
    else if (p.weightKg < 30)
      warnings.push(
        `weightKg = ${p.weightKg} kg é muito baixo; a clearance pode estar subestimada.`,
      );
    else if (p.weightKg > 200)
      warnings.push(`weightKg = ${p.weightKg} kg é muito elevado; verifique o valor.`);
  }

  if (p.absorptionHalfLifeD !== undefined && p.eliminationHalfLifeD !== undefined) {
    if (p.absorptionHalfLifeD <= 0) errors.push("absorptionHalfLifeD deve ser positivo.");
    else if (p.eliminationHalfLifeD <= 0) errors.push("eliminationHalfLifeD deve ser positivo.");
    else if (p.absorptionHalfLifeD > p.eliminationHalfLifeD)
      errors.push(
        "absorptionHalfLifeD não pode exceder eliminationHalfLifeD em cinética flip-flop (ka deve ser > ke).",
      );
  } else {
    if (p.absorptionHalfLifeD !== undefined && p.absorptionHalfLifeD <= 0)
      errors.push("absorptionHalfLifeD deve ser positivo.");
    if (p.eliminationHalfLifeD !== undefined) {
      if (p.eliminationHalfLifeD <= 0) errors.push("eliminationHalfLifeD deve ser positivo.");
      else if (p.eliminationHalfLifeD < 10)
        warnings.push(
          `eliminationHalfLifeD = ${p.eliminationHalfLifeD} d é muito curto para TU IM (esperado ≈ 20–50 d).`,
        );
      else if (p.eliminationHalfLifeD > 100)
        warnings.push(
          `eliminationHalfLifeD = ${p.eliminationHalfLifeD} d excede os valores reportados na literatura.`,
        );
    }
  }

  if (p.bioavailability !== undefined) {
    if (p.bioavailability <= 0 || p.bioavailability > 1)
      errors.push("bioavailability deve estar em ]0, 1].");
  }

  if (p.clearanceLPerKgPerDay !== undefined) {
    if (p.clearanceLPerKgPerDay <= 0) errors.push("clearanceLPerKgPerDay deve ser positivo.");
    else if (p.clearanceLPerKgPerDay < 5)
      warnings.push(
        `clearanceLPerKgPerDay = ${p.clearanceLPerKgPerDay} L/kg/d é muito baixo (mín. plausível ≈ 8 L/kg/d).`,
      );
    else if (p.clearanceLPerKgPerDay > 50)
      warnings.push(
        `clearanceLPerKgPerDay = ${p.clearanceLPerKgPerDay} L/kg/d é muito elevado (máx. reportado ~30 L/kg/d).`,
      );
  }

  if (p.doses !== undefined) {
    if (p.doses < 1) errors.push("doses deve ser ≥ 1.");
    else if (p.doses > 52)
      warnings.push(`doses = ${p.doses}: simulação de mais de 52 aplicações pode ser lenta.`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ──────────────────────────────────────────────────────────────────────────
// Intervalo sugerido a partir de Cmédia-alvo
// ──────────────────────────────────────────────────────────────────────────

/**
 * Calcula o intervalo posológico que produz uma Cmédia-alvo dada, assumindo os
 * parâmetros populacionais do modelo (sem calibração individual).
 *
 * Baseado em: Css_avg = F · D_T / (Cl · τ) · 1e5  →  τ = F · D_T / (Cl · C_alvo) · 1e5
 *
 * @returns intervalo em dias; 0 se targetCmeanNgdl ≤ 0.
 */
export function computeIntervalForTarget(targetCmeanNgdl: number, p: PkParams): number {
  if (targetCmeanNgdl <= 0) return 0;
  const Cl = p.clearanceLPerKgPerDay * p.weightKg;
  const D_T = p.doseMg * MW_RATIO_T_TU;
  return ((p.bioavailability * D_T) / (Cl * targetCmeanNgdl)) * 100_000;
}
