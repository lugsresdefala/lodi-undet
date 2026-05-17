import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  computeMetrics,
  DEFAULT_PK,
  doseTimes,
  generatePkSeries,
  ngdlToNmol,
  simulatePopulation,
  singleDoseTmax,
  steadyStateConcentration,
  steadyStateMean,
  type PkParams,
} from "@/lib/pk";

const REF_LOW = 264;
const REF_HIGH = 916;

interface ControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint: string;
  source?: string;
  onChange: (v: number) => void;
}

function Control({ label, value, min, max, step, unit, hint, source, onChange }: ControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <span className="font-mono text-base tabular-nums text-foreground">
          {value}
          <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
        </span>
      </div>
      <Slider
        aria-label={`${label}${unit ? ` (${unit})` : ""}`}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
      <p className="text-xs leading-relaxed text-muted-foreground">
        {hint}
        {source ? (
          <span className="ml-1 font-mono text-[11px] text-foreground/60">— {source}</span>
        ) : null}
      </p>
    </div>
  );
}

export function PkCalculator() {
  const [params, setParams] = useState<PkParams>(DEFAULT_PK);
  const [targetCmean, setTargetCmean] = useState<number>(550); // ng/dL — meio do intervalo 264–916

  // === Modo individual: titulação a partir de medição sérica ===
  const [individualMode, setIndividualMode] = useState<boolean>(false);
  const [measuredValue, setMeasuredValue] = useState<number>(550); // ng/dL medido no paciente
  const [sampleDayAfterDose, setSampleDayAfterDose] = useState<number>(84); // dia da coleta no intervalo atual
  const [dosesBeforeSample, setDosesBeforeSample] = useState<number>(4); // n.º de doses no MESMO esquema antes da coleta

  // === Controlos do gráfico ===
  const [showBand, setShowBand] = useState<boolean>(true);
  const [bandRange, setBandRange] = useState<"p5-p95" | "p25-p75">("p5-p95");
  const [nSubjects, setNSubjects] = useState<number>(200);
  const [cvPct, setCvPct] = useState<number>(35);

  const series = useMemo(() => generatePkSeries(params, { stepDays: 1 }), [params]);
  const metrics = useMemo(() => computeMetrics(series, params), [series, params]);
  const tmax = useMemo(() => singleDoseTmax(params), [params]);
  const cssExpected = useMemo(() => steadyStateMean(params), [params]);
  const lastDoseDay = useMemo(() => {
    const times = doseTimes(params);
    return times[times.length - 1] ?? 0;
  }, [params]);

  const population = useMemo(
    () =>
      showBand
        ? simulatePopulation(params, { nSubjects, cv: cvPct / 100, stepDays: 1, seed: 1234 })
        : [],
    [showBand, params, nSubjects, cvPct],
  );

  const chartData = useMemo(() => {
    if (!showBand || population.length !== series.length) return series;
    return series.map((pt, i) => ({
      ...pt,
      p05: population[i]?.p05,
      p25: population[i]?.p25,
      p50: population[i]?.p50,
      p75: population[i]?.p75,
      p95: population[i]?.p95,
    }));
  }, [series, population, showBand]);

  const bandLow = bandRange === "p5-p95" ? "p05" : "p25";
  const bandHigh = bandRange === "p5-p95" ? "p95" : "p75";

  // τ para atingir Css,avg = alvo NA POPULAÇÃO MÉDIA (Cl populacional fixo).
  // Css,avg = F · D_T / (Cl · τ) · 1e5  →  τ = F · D_T / (Cl · C_alvo) · 1e5
  // ATENÇÃO: este τ é determinístico e não personalizável sem medição sérica.
  // A variabilidade inter-individual de Cl (CV 30–50%) implica que, para um
  // indivíduo concreto, o τ que produz a Cmédia-alvo pode diferir em ±40–60%.
  // O intervalo abaixo é a faixa de 90% (log-normal, σ = √ln(1+CV²)).
  const suggestedInterval = useMemo(() => {
    const Cl = params.clearanceLPerKgPerDay * params.weightKg;
    const D_T = params.doseMg * 0.6315;
    if (targetCmean <= 0) return 0;
    return ((params.bioavailability * D_T) / (Cl * targetCmean)) * 100_000;
  }, [params, targetCmean]);
  const intervalBand = useMemo(() => {
    const cv = cvPct / 100;
    const sigma = Math.sqrt(Math.log(1 + cv * cv));
    const z = 1.645;
    return {
      low: suggestedInterval * Math.exp(-z * sigma),
      high: suggestedInterval * Math.exp(z * sigma),
    };
  }, [suggestedInterval, cvPct]);

  // === Titulação individual ===
  // Uma medição isolada só é utilizável se o dia pós-dose for conhecido e o
  // esquema estiver em estado estacionário. O modelo é então calibrado por um
  // fator individual no mesmo tempo de coleta; isto estima a exposição média
  // desse indivíduo, não "converte" genericamente vale em média.
  const individualResult = useMemo(() => {
    if (!individualMode || measuredValue <= 0 || targetCmean <= 0) return null;
    const sampleDay = Math.max(1, Math.min(sampleDayAfterDose, params.intervalDays));
    const predictedAtSample = steadyStateConcentration(lastDoseDay + sampleDay, params);
    if (predictedAtSample <= 0 || metrics.cmean <= 0) return null;
    const exposureRatio = measuredValue / predictedAtSample;
    const cmeanIndiv = metrics.cmean * exposureRatio;
    const tauIndiv = (params.intervalDays * cmeanIndiv) / targetCmean;
    const clPop = params.clearanceLPerKgPerDay * params.weightKg;
    const clIndiv = clPop / exposureRatio;
    return {
      sampleDay,
      predictedAtSample,
      exposureRatio,
      cmeanIndiv,
      tauIndiv,
      clIndiv,
      clRatio: clIndiv / clPop,
    };
  }, [
    individualMode,
    measuredValue,
    sampleDayAfterDose,
    targetCmean,
    params,
    metrics,
    lastDoseDay,
  ]);

  // Validações: a calibração só é fiável em estado estacionário e com timing
  // bem definido. Regra prática (Rowland & Tozer): ≈4–5 × t½ aparente para
  // atingir 90–97% de Css. Com t½ de libertação ≈90 d isto significa ~360–450 dias
  // no MESMO esquema (dose + τ) antes da coleta.
  const individualWarnings = useMemo(() => {
    if (!individualMode) return [] as { level: "error" | "warn"; msg: string }[];
    const warnings: { level: "error" | "warn"; msg: string }[] = [];
    const timeOnRegimen = dosesBeforeSample * params.intervalDays;
    const ssTime = 4 * params.eliminationHalfLifeD; // ~94% Css
    const ssTimeFull = 5 * params.eliminationHalfLifeD; // ~97% Css
    if (timeOnRegimen < ssTime) {
      warnings.push({
        level: "error",
        msg: `Esquema ainda NÃO está em estado estacionário: ${dosesBeforeSample} dose(s) × ${params.intervalDays} d = ${timeOnRegimen} d, abaixo de 4×t½ (${Math.round(ssTime)} d). A medição subestima a exposição real — não é comparável a Cmédia de equilíbrio.`,
      });
    } else if (timeOnRegimen < ssTimeFull) {
      warnings.push({
        level: "warn",
        msg: `Estado estacionário apenas parcial (~94% de Css). Idealmente ≥ ${Math.round(ssTimeFull)} d (${Math.ceil(ssTimeFull / params.intervalDays)} doses) no mesmo esquema antes da coleta.`,
      });
    }
    if (sampleDayAfterDose <= 3) {
      warnings.push({
        level: "warn",
        msg: "Coleta muito próxima da injeção (≤3 d): fase de subida com elevada variabilidade; o fator individual pode estar inflacionado.",
      });
    }
    if (sampleDayAfterDose >= params.intervalDays - 1) {
      warnings.push({
        level: "warn",
        msg: "Coleta em vale: representativa do mínimo, mas extrapolar Cmédia depende fortemente da forma da curva — confirmar com pelo menos uma segunda medição em momento diferente.",
      });
    }
    if (individualResult && (individualResult.exposureRatio < 0.5 || individualResult.exposureRatio > 2)) {
      warnings.push({
        level: "warn",
        msg: `Fator individual extremo (${(individualResult.exposureRatio * 100).toFixed(0)}%): verifique se a dose, intervalo e dia da coleta inseridos correspondem ao realmente praticado.`,
      });
    }
    return warnings;
  }, [
    individualMode,
    dosesBeforeSample,
    sampleDayAfterDose,
    params.intervalDays,
    params.eliminationHalfLifeD,
    individualResult,
  ]);

  const update = (patch: Partial<PkParams>) => setParams((p) => ({ ...p, ...patch }));

  return (
    <Card className="relative overflow-hidden border-border/70 bg-card/80 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_40px_-24px_color-mix(in_oklab,var(--color-chart-1)_35%,transparent),0_30px_60px_-30px_color-mix(in_oklab,var(--color-chart-2)_30%,transparent)] backdrop-blur">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-chart-1)_55%,transparent),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-16 h-80 w-80 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-chart-2)_55%,transparent),transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-chart-3)_45%,transparent),transparent_70%)] blur-3xl"
      />
      <CardHeader className="px-4 pt-5 md:px-6 md:pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-medium leading-none tracking-tight sm:text-2xl md:text-3xl">
              Concentração no sangue ao longo do tempo
            </h2>
            <CardDescription className="mt-2 text-sm leading-relaxed">
              Simulação da testosterona sérica após injecções intramusculares de undecilato de
              testosterona em óleo de rícino (1000 mg / 4 mL, tipo Nebido/Reandron). Usa um modelo
              farmacocinético calibrado para o perfil observado por Schubert et al. (JCEM 2004):
              pico aos 7–14 dias e libertação terminal prolongada, com meia-vida de libertação
              de 90±40 dias na ficha técnica do Nebido. Inclui dose de ataque às 6 semanas segundo
              Endocrine Society 2017.
            </CardDescription>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              metrics.inRange
                ? "bg-[color:var(--color-system-body)]/15 text-[color:var(--color-system-body)]"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {metrics.inRange
              ? "Dentro do intervalo de referência"
              : "Fora do intervalo de referência"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="grid gap-8 px-4 pb-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_1.6fr]">
        {/* Inputs */}
        <div className="space-y-6">
          {/* === Variáveis de interesse (hero) === */}
          <section
            aria-labelledby="vars-heading"
            className="relative overflow-hidden rounded-lg border border-border/70 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-chart-1)_10%,transparent),color-mix(in_oklab,var(--color-chart-2)_8%,transparent))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 id="vars-heading" className="text-sm font-semibold text-foreground">
                Concentração sérica prevista por este modelo
              </h3>
              <span className="text-xs text-muted-foreground">
                para os parâmetros atuais, no último intervalo
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Estimativas calculadas a partir da dose ({params.doseMg} mg), intervalo (
              {params.intervalDays} d) e peso ({params.weightKg} kg) escolhidos — não são valores
              genéricos nem normativos.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Metric
                label="Pico"
                acronym="Cmax"
                value={metrics.cmax}
                unit="ng/dL"
                secondary={`${ngdlToNmol(metrics.cmax).toFixed(1)} nmol/L`}
                hint={`atingido ao dia ${metrics.cmaxDay}`}
              />
              <Metric
                label="Média"
                acronym="Cmédia"
                value={metrics.cmean}
                unit="ng/dL"
                secondary={`${ngdlToNmol(metrics.cmean).toFixed(1)} nmol/L`}
                hint="média entre doses"
                emphasis
              />
              <Metric
                label="Vale"
                acronym="Cmin"
                value={metrics.ctrough}
                unit="ng/dL"
                secondary={`${ngdlToNmol(metrics.ctrough).toFixed(1)} nmol/L`}
                hint={`atingido ao dia ${metrics.ctroughDay}`}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
              <span>
                Diferença para alvo:{" "}
                <span
                  className={`font-mono tabular-nums ${
                    Math.abs(metrics.cmean - targetCmean) < 50
                      ? "text-[color:var(--color-system-body)]"
                      : "text-foreground"
                  }`}
                >
                  {metrics.cmean - targetCmean >= 0 ? "+" : ""}
                  {Math.round(metrics.cmean - targetCmean)} ng/dL
                </span>
              </span>
              <span>
                Oscilação pico–vale:{" "}
                <span className="font-mono tabular-nums text-foreground">
                  {Math.round(metrics.cmax - metrics.ctrough)} ng/dL
                </span>
              </span>
              <span className="text-[11px]">Referência adulto: 264–916 ng/dL (Travison 2017)</span>
            </div>
          </section>

          {/* === Ajuste por Cmédia-alvo (POPULACIONAL — não individual) === */}
          <section
            aria-labelledby="target-heading"
            className="rounded-lg border border-[color:var(--color-chart-2)]/40 bg-[color:var(--color-chart-2)]/8 p-4 space-y-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 id="target-heading" className="text-sm font-semibold text-foreground">
                Intervalo populacional a partir de uma Cmédia-alvo
              </h3>
              <span className="text-xs text-muted-foreground">
                intervalo atual: {params.intervalDays} dias
              </span>
            </div>
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs leading-relaxed text-foreground/90">
              <strong>Não é uma recomendação individual.</strong> O cálculo assume a depuração
              metabólica do modelo atual (padrão: 17,5 L/kg/d, retro-calculada da coorte ENIGI de
              homens trans em TU IM; Defreyne et al., Andrology 2018). Como a variabilidade
              inter-individual de Cl é alta (CV ~30–50%), o τ que produz a Cmédia-alvo num
              indivíduo concreto só pode ser determinado por{" "}
              <em>titulação com análises séricas</em> (vale antes da dose seguinte, Endocrine
              Society 2017).
            </div>
            <Control
              label="Concentração média alvo"
              unit="ng/dL"
              value={targetCmean}
              min={150}
              max={1500}
              step={10}
              hint="Concentração média desejada no sangue entre aplicações, em estado estacionário. Intervalo de referência adulto cis: 264–916 ng/dL (Travison 2017). Alvos clínicos típicos para hormonização masculinizante: meio do intervalo (~500–700 ng/dL); alvos supra-fisiológicos não são recomendados pela Endocrine Society 2017."
              source="Travison JCEM 2017"
              onChange={setTargetCmean}
            />
            <div className="border-t border-border/50 pt-3 space-y-1.5">
              <div className="text-xs leading-relaxed text-muted-foreground">
                Intervalo populacional médio:{" "}
                <span className="font-mono text-foreground">
                  <strong>{suggestedInterval.toFixed(0)} dias</strong> (~
                  {(suggestedInterval / 7).toFixed(1)} semanas)
                </span>
              </div>
              <div className="text-xs leading-relaxed text-muted-foreground">
                Faixa individual plausível (90%, CV {cvPct}%):{" "}
                <span className="font-mono text-foreground">
                  {intervalBand.low.toFixed(0)}–{intervalBand.high.toFixed(0)} dias
                </span>
              </div>
            </div>

            {/* === Modo individual === */}
            <div className="border-t border-border/50 pt-3 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <Switch
                  aria-label="Ativar titulação individual a partir de medição sérica"
                  checked={individualMode}
                  onCheckedChange={setIndividualMode}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  <span className="font-medium text-foreground">Titulação individual</span>
                  <span className="block text-xs text-muted-foreground leading-relaxed">
                    Tenho uma medição sérica de testosterona total feita no esquema atual (
                    {params.doseMg} mg cada {params.intervalDays} dias).
                  </span>
                </span>
              </label>
              {individualMode && (
                <div className="space-y-3 rounded-md border border-[color:var(--color-chart-1)]/30 bg-[color:var(--color-chart-1)]/8 p-3">
                  <Control
                    label="T total medida no paciente"
                    unit="ng/dL"
                    value={measuredValue}
                    min={50}
                    max={2000}
                    step={5}
                    hint="Valor laboratorial real, colhido enquanto o paciente estava no mesmo esquema de dose e intervalo."
                    onChange={setMeasuredValue}
                  />
                  <Control
                    label="Dia da coleta após a última injeção"
                    unit="dias"
                    value={Math.min(sampleDayAfterDose, params.intervalDays)}
                    min={1}
                    max={params.intervalDays}
                    step={1}
                    hint="Obrigatório para contextualizar a análise: dia 7–14 aproxima pico; o último dia antes da próxima aplicação aproxima vale."
                    onChange={setSampleDayAfterDose}
                  />
                  <Control
                    label="Doses já feitas no MESMO esquema antes da coleta"
                    unit="doses"
                    value={dosesBeforeSample}
                    min={1}
                    max={20}
                    step={1}
                    hint={`Estado estacionário ≈ 4–5 × t½ aparente (${Math.round(4 * params.eliminationHalfLifeD)}–${Math.round(5 * params.eliminationHalfLifeD)} d). Com τ = ${params.intervalDays} d, são necessárias pelo menos ${Math.ceil((4 * params.eliminationHalfLifeD) / params.intervalDays)} doses.`}
                    onChange={setDosesBeforeSample}
                  />
                  {individualWarnings.length > 0 && (
                    <ul className="space-y-1.5 text-[11px] leading-relaxed">
                      {individualWarnings.map((w, i) => (
                        <li
                          key={i}
                          className={
                            w.level === "error"
                              ? "rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-destructive"
                              : "rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-amber-700 dark:text-amber-300"
                          }
                        >
                          <span className="font-semibold">
                            {w.level === "error" ? "⛔ " : "⚠️ "}
                          </span>
                          {w.msg}
                        </li>
                      ))}
                    </ul>
                  )}
                  {individualResult && (
                    <div className="space-y-1.5 text-xs leading-relaxed border-t border-border/50 pt-2.5">
                      <div className="text-muted-foreground">
                        Modelo no mesmo dia pós-dose ({individualResult.sampleDay} d):{" "}
                        <span className="font-mono text-foreground">
                          {Math.round(individualResult.predictedAtSample)} ng/dL
                        </span>{" "}
                        <span className="text-[11px]">
                          → fator individual {(individualResult.exposureRatio * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        Cmédia estimada do paciente:{" "}
                        <span className="font-mono text-foreground">
                          {Math.round(individualResult.cmeanIndiv)} ng/dL
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        Depuração estimada:{" "}
                        <span className="font-mono text-foreground">
                          {individualResult.clIndiv.toFixed(0)} L/dia
                        </span>{" "}
                        <span className="text-[11px]">
                          ({(individualResult.clRatio * 100).toFixed(0)}% da população)
                        </span>
                      </div>
                      <div className="pt-1 text-foreground">
                        <strong>
                          Intervalo estimado pelo modelo calibrado para {targetCmean} ng/dL:
                        </strong>{" "}
                        <span className="font-mono">
                          {individualResult.tauIndiv.toFixed(0)} dias (~
                          {(individualResult.tauIndiv / 7).toFixed(1)} semanas)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          update({
                            intervalDays: Math.max(
                              42,
                              Math.min(168, Math.round(individualResult.tauIndiv)),
                            ),
                          })
                        }
                        className="mt-1 rounded-full border border-[color:var(--color-chart-1)]/50 bg-[color:var(--color-chart-1)]/15 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-[color:var(--color-chart-1)]/25"
                      >
                        Aplicar ao gráfico
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Uma medição única apenas calibra a curva no dia informado. Titulação clínica real
              requer medições em condições estáveis (≥3 doses no mesmo τ), momento de coleta
              documentado e ajuste por sintomas/hematócrito.
            </p>
          </section>

          {/* === Esquema posológico === */}
          <section aria-labelledby="dose-heading" className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
              <h3 id="dose-heading" className="text-sm font-semibold text-foreground">
                Esquema de aplicação
              </h3>
              <span className="text-xs text-muted-foreground">parâmetros que pode ajustar</span>
            </div>
            <Control
              label="Dose por injeção"
              unit="mg"
              value={params.doseMg}
              min={250}
              max={1500}
              step={10}
              hint="Quantidade de undecilato de testosterona (TU) por injeção intramuscular. Apresentação padrão: 1000 mg em 4 mL de óleo de rícino."
              source="SmPC Nebido / Reandron"
              onChange={(v) => update({ doseMg: v })}
            />
            <Control
              label="Intervalo entre doses (manutenção)"
              unit="dias"
              value={params.intervalDays}
              min={42}
              max={168}
              step={1}
              hint="Tempo entre injecções na fase de manutenção. Tipicamente 70–98 dias (10–14 semanas) segundo Endocrine Society 2017 / SmPC Nebido. A literatura documenta 42–168 dias quando individualizado por análises."
              source="ES 2017 · Saad 2008 · Zitzmann 2013"
              onChange={(v) => update({ intervalDays: v })}
            />
            <Control
              label="Peso corporal"
              unit="kg"
              value={params.weightKg}
              min={45}
              max={130}
              step={1}
              hint="Escala a depuração metabólica total (depuração total = depuração por kg × peso)."
              onChange={(v) => update({ weightKg: v })}
            />
            <div className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-card/60 px-3.5 py-3">
              <div className="min-w-0">
                <Label className="text-sm font-medium text-foreground">
                  Dose de ataque (loading)
                </Label>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Segunda dose 6 semanas após a primeira (Endocrine Society 2017 / SmPC Nebido) para
                  acelerar a chegada ao estado estacionário. Desligar para esquema regular desde o
                  início.
                </p>
              </div>
              <Switch
                aria-label="Dose de ataque (loading) — segunda dose 6 semanas após a primeira"
                checked={params.loading ?? true}
                onCheckedChange={(v) => update({ loading: v })}
              />
            </div>
          </section>

          {/* === Variação populacional (controlos do gráfico) === */}
          <section
            aria-labelledby="pop-heading"
            className="space-y-3 rounded-lg border border-border/60 bg-[color:var(--color-chart-3)]/8 p-4"
          >
            <div className="flex items-baseline justify-between border-b border-border/50 pb-2">
              <h3 id="pop-heading" className="text-sm font-semibold text-foreground">
                Variação entre pessoas
              </h3>
              <span className="text-xs text-muted-foreground">simulação Monte Carlo</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Label className="text-sm font-medium text-foreground">
                  Mostrar faixa de variação
                </Label>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Sobrepõe a faixa onde caem 90% (ou 50%) das pessoas, simulando variação biológica
                  individual na depuração e na velocidade de absorção/eliminação.
                </p>
              </div>
              <Switch
                aria-label="Mostrar faixa de variação populacional no gráfico"
                checked={showBand}
                onCheckedChange={setShowBand}
              />
            </div>

            {showBand ? (
              <>
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">
                    Largura da faixa
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: "p5-p95", label: "90% das pessoas (P5–P95)" },
                        { id: "p25-p75", label: "50% central (P25–P75)" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setBandRange(opt.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          bandRange === opt.id
                            ? "border-[color:var(--color-chart-3)] bg-[color:var(--color-chart-3)]/15 text-foreground"
                            : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Control
                  label="Número de pessoas simuladas"
                  unit=""
                  value={nSubjects}
                  min={50}
                  max={1000}
                  step={10}
                  hint="Tamanho da coorte simulada. Mais pessoas = faixa mais estável, simulação mais lenta."
                  onChange={setNSubjects}
                />
                <Control
                  label="Variabilidade entre pessoas"
                  unit="%"
                  value={cvPct}
                  min={10}
                  max={60}
                  step={1}
                  hint="Quanto a fisiologia varia entre indivíduos (coeficiente de variação). Estudos com undecilato IM reportam tipicamente 30–50%."
                  source="Behre 1999 · Zitzmann 2013"
                  onChange={setCvPct}
                />
              </>
            ) : null}
          </section>

          {/* === Parâmetros PK (avançado) === */}
          <details className="group rounded-lg border border-border/60 bg-muted/20 open:bg-muted/30">
            <summary className="flex cursor-pointer items-baseline justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground/80 transition hover:text-foreground">
              <span>Parâmetros farmacocinéticos avançados</span>
              <span className="text-xs text-muted-foreground transition group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="space-y-4 px-4 pb-4 pt-1">
              <Control
                label="Meia-vida de absorção (depósito rápido)"
                unit="dias"
                value={params.absorptionHalfLifeD}
                min={5}
                max={40}
                step={0.5}
                hint="Velocidade do componente rápido do depósito IM (ln 2 / ka_rápido). Para Nebido (óleo de rícino) ronda 18–22 dias e determina, junto com a fracção rápida, a forma do pico inicial."
                source="motor bicompartmental — Schubert 2004"
                onChange={(v) => update({ absorptionHalfLifeD: v })}
              />
              <Control
                label="Meia-vida aparente terminal"
                unit="dias"
                value={params.eliminationHalfLifeD}
                min={40}
                max={130}
                step={1}
                hint="Em depósitos IM em óleo de rícino (Nebido/Reandron), a ficha técnica descreve meia-vida de libertação de 90±40 dias; o slider ajusta esse componente lento do depósito. Não confundir com a meia-vida intrínseca da testosterona em circulação (~1 h após IV)."
                source="SmPC Nebido 5.2"
                onChange={(v) => update({ eliminationHalfLifeD: v })}
              />
              <Control
                label="Fracção no depósito rápido"
                unit="%"
                value={Math.round(params.fracRapido * 100)}
                min={2}
                max={40}
                step={1}
                hint="Modelo bicompartmental: fracção da dose que entra no depósito de libertação rápida (responsável pelo pico precoce). O restante alimenta o depósito lento, que determina a acumulação ao longo das doses. Calibrado em ~7% para Nebido."
                source="motor bicompartmental — Schubert 2004"
                onChange={(v) => update({ fracRapido: v / 100 })}
              />
              <Control
                label="Depuração metabólica"
                unit="L/kg/dia"
                value={params.clearanceLPerKgPerDay}
                min={12}
                max={32}
                step={0.5}
                hint="Volume de sangue depurado de testosterona por kg e por dia. Determina directamente a concentração média no estado estacionário."
                source="ENIGI/Defreyne 2018, Pelusi 2014 (~17,5 L/kg/d em homens trans); Wang 2004 ~21 em homens cis"
                onChange={(v) => update({ clearanceLPerKgPerDay: v })}
              />
              <div className="rounded-md border border-border/60 bg-card/60 p-3 text-xs leading-relaxed text-muted-foreground">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-foreground/80">Verificação analítica</span>
                  <span className="font-mono text-[11px] text-foreground/60">
                    pico previsto ≈ dia {tmax.toFixed(1)} · média prevista ≈{" "}
                    {Math.round(cssExpected)} ng/dL
                  </span>
                </div>
                <p className="mt-1.5">
                  Concentração média = biodisponibilidade × dose efectiva ÷ (depuração × intervalo).
                  A dose efectiva de testosterona é 63% da dose de undecilato (razão de pesos
                  moleculares). Valores esperados: 264–916 ng/dL (Travison 2017); pico ao dia 7–14
                  (Schubert 2004).
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* Chart */}
        <div className="h-[260px] w-full sm:h-[320px] md:h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pk-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.55} />
                  <stop offset="45%" stopColor="var(--color-chart-2)" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="pk-stroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--color-chart-2)" />
                  <stop offset="55%" stopColor="var(--color-chart-1)" />
                  <stop offset="100%" stopColor="var(--color-chart-4)" />
                </linearGradient>
                <filter id="pk-glow" x="-10%" y="-20%" width="120%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />

              <XAxis
                dataKey="day"
                stroke="var(--color-muted-foreground)"
                tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                tickFormatter={(v) => `${v}d`}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                tickFormatter={(v) => `${Math.round(v)}`}
                width={48}
              />

              <ReferenceArea
                y1={REF_LOW}
                y2={REF_HIGH}
                fill="var(--color-system-body)"
                fillOpacity={0.08}
                stroke="none"
              />
              <ReferenceLine
                y={REF_LOW}
                stroke="var(--color-system-body)"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{
                  value: "264",
                  position: "insideLeft",
                  fill: "var(--color-system-body)",
                  fontSize: 10,
                }}
              />
              <ReferenceLine
                y={REF_HIGH}
                stroke="var(--color-system-body)"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{
                  value: "916",
                  position: "insideLeft",
                  fill: "var(--color-system-body)",
                  fontSize: 10,
                }}
              />

              {/* Cmédia atual */}
              <ReferenceLine
                y={metrics.cmean}
                stroke="var(--color-chart-2)"
                strokeDasharray="4 2"
                strokeOpacity={0.7}
                label={{
                  value: `Cmédia ${Math.round(metrics.cmean)}`,
                  position: "insideTopRight",
                  fill: "var(--color-chart-2)",
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                }}
              />
              {/* Cmédia-alvo */}
              <ReferenceLine
                y={targetCmean}
                stroke="var(--color-chart-4)"
                strokeDasharray="6 3"
                strokeOpacity={0.55}
                label={{
                  value: `alvo ${targetCmean}`,
                  position: "insideBottomRight",
                  fill: "var(--color-chart-4)",
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                }}
              />

              <ReferenceDot
                x={metrics.cmaxDay}
                y={metrics.cmax}
                r={5}
                fill="var(--color-chart-1)"
                stroke="var(--color-background)"
                strokeWidth={2}
                label={{
                  value: `Cmax ${Math.round(metrics.cmax)}`,
                  position: "top",
                  fontSize: 11,
                  fill: "var(--color-foreground)",
                }}
              />
              <ReferenceDot
                x={metrics.ctroughDay}
                y={metrics.ctrough}
                r={4}
                fill="var(--color-chart-3)"
                stroke="var(--color-background)"
                strokeWidth={2}
                label={{
                  value: `Cmin ${Math.round(metrics.ctrough)}`,
                  position: "bottom",
                  fontSize: 10,
                  fill: "var(--color-muted-foreground)",
                }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${Math.round(v)} ng/dL`, "Concentração"]}
                labelFormatter={(v) => `Dia ${v}`}
              />

              <Area
                type="monotone"
                dataKey="concentration"
                name="Determinístico"
                stroke="url(#pk-stroke)"
                strokeWidth={2.5}
                fill="url(#pk-fill)"
                fillOpacity={1}
                filter="url(#pk-glow)"
                isAnimationActive={false}
              />

              {showBand ? (
                <>
                  <Area
                    type="monotone"
                    dataKey={(d: Record<string, number>) => [d[bandLow], d[bandHigh]]}
                    name={bandRange === "p5-p95" ? "P5–P95" : "P25–P75"}
                    stroke="var(--color-chart-3)"
                    strokeOpacity={0.5}
                    strokeWidth={1}
                    fill="var(--color-chart-3)"
                    fillOpacity={0.22}
                    isAnimationActive={false}
                    activeDot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="p50"
                    name="Mediana populacional"
                    stroke="var(--color-chart-4)"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    fill="none"
                    isAnimationActive={false}
                    activeDot={false}
                  />
                </>
              ) : null}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>

      <div className="border-t border-border/60 px-4 py-4 text-[11px] leading-relaxed text-muted-foreground md:px-6">
        <span className="font-mono uppercase tracking-[0.16em] text-foreground/70">Fontes —</span>{" "}
        Nebido SmPC secção 5.2 (meia-vida de libertação da formulação depot: 90±40 d). Schubert M
        et al. <em>JCEM</em> 2004;89(11):5429–34 (PK do TU 1000 mg IM; Tmax ≈ 7 d; estado estacionário
        entre a 3.ª e 5.ª administração). Behre HM, Nieschlag E. <em>Eur J Endocrinol</em> 1999;140(5):414–9
        (cinética flip-flop do TU IM). Wang C et al. <em>JCEM</em> 2004;89(2):534–43 (MCR da T ≈
        1500 L/d em homens cis). Defreyne J et al. <em>Andrology</em> 2018;6(3):441–51; Pelusi C et
        al. <em>Andrology</em> 2014;2(4):516–21 (coorte ENIGI; calibração Cl = 17,5 L/kg/d em
        homens trans). Hembree WC et al. <em>JCEM</em> 2017;102(11):3869–903 (Endocrine Society
        CPG). Travison TG et al. <em>JCEM</em> 2017;102(4):1161–73 (intervalo harmonizado
        264–916 ng/dL).{" "}
        <span className="italic">Página educativa; não constitui orientação posológica.</span>
      </div>
    </Card>
  );
}

function Metric({
  label,
  acronym,
  value,
  unit,
  secondary,
  hint,
  emphasis = false,
}: {
  label: string;
  acronym?: string;
  value: number;
  unit: string;
  secondary?: string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? "rounded-md border border-[color:var(--color-chart-2)]/40 bg-card/70 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
          : "px-1"
      }
    >
      <div className="flex items-baseline gap-1.5">
        <span
          className={`text-xs font-medium ${emphasis ? "text-[color:var(--color-chart-2)]" : "text-foreground"}`}
        >
          {label}
        </span>
        {acronym ? (
          <span className="font-mono text-[10px] text-muted-foreground">({acronym})</span>
        ) : null}
      </div>
      <div
        className={`font-mono tabular-nums text-foreground ${emphasis ? "text-2xl font-semibold" : "text-xl"}`}
      >
        {Math.round(value)}
      </div>
      <div className="text-[11px] text-muted-foreground">{unit}</div>
      {secondary ? (
        <div className="font-mono text-[11px] text-foreground/60">{secondary}</div>
      ) : null}
      {hint ? (
        <div className="mt-1 text-[11px] leading-tight text-muted-foreground/80">{hint}</div>
      ) : null}
    </div>
  );
}
