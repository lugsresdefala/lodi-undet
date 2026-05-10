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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  computeMetrics,
  DEFAULT_PK,
  generatePkSeries,
  ngdlToNmol,
  simulatePopulation,
  singleDoseTmax,
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
        <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </Label>
        <span className="font-mono text-sm tabular-nums text-foreground">
          {value}
          <span className="ml-1 text-[10px] text-muted-foreground">{unit}</span>
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
      <p className="text-[11px] leading-snug text-muted-foreground">
        {hint}
        {source ? (
          <span className="ml-1 font-mono text-[10px] text-foreground/60">— {source}</span>
        ) : null}
      </p>
    </div>
  );
}

export function PkCalculator() {
  const [params, setParams] = useState<PkParams>(DEFAULT_PK);
  const [targetCmean, setTargetCmean] = useState<number>(550); // ng/dL — meio do intervalo 264–916

  const series = useMemo(() => generatePkSeries(params, { stepDays: 1 }), [params]);
  const metrics = useMemo(() => computeMetrics(series, params), [series, params]);
  const tmax = useMemo(() => singleDoseTmax(params), [params]);
  const cssExpected = useMemo(() => steadyStateMean(params), [params]);

  // τ sugerido para atingir Css,avg = alvo, mantendo dose, peso e Cl fixos.
  // Css,avg = F · D_T / (Cl · τ) · 1e5  →  τ = F · D_T / (Cl · C_alvo) · 1e5
  const suggestedInterval = useMemo(() => {
    const Cl = params.clearanceLPerKgPerDay * params.weightKg;
    const D_T = params.doseMg * 0.6315;
    if (targetCmean <= 0) return 0;
    return (params.bioavailability * D_T) / (Cl * targetCmean) * 100_000;
  }, [params, targetCmean]);
  const suggestedIntervalClamped = Math.max(42, Math.min(168, Math.round(suggestedInterval / 7) * 7));

  const update = (patch: Partial<PkParams>) => setParams((p) => ({ ...p, ...patch }));

  return (
    <Card className="relative overflow-hidden border-border/70 bg-card/80 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_40px_-24px_color-mix(in_oklab,var(--color-chart-1)_35%,transparent),0_30px_60px_-30px_color-mix(in_oklab,var(--color-chart-2)_30%,transparent)] backdrop-blur">
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-chart-1)_55%,transparent),transparent_70%)] blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -top-10 -right-16 h-80 w-80 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-chart-2)_55%,transparent),transparent_70%)] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-chart-3)_45%,transparent),transparent_70%)] blur-3xl" />
      <CardHeader className="px-4 pt-5 md:px-6 md:pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="font-serif text-xl font-medium tracking-tight sm:text-2xl md:text-3xl">
              Modelação farmacocinética
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              Concentração sérica de testosterona após undecilato IM em óleo de rícino
              (1000 mg / 4 mL). Modelo Bateman de um compartimento em forma de
              clearance, calibrado para cinética flip-flop conforme Schubert et al.
              (JCEM 2004): t½ aparente terminal ≈ 33 d, Tmax ≈ 7–14 d. Esquema de
              loading 0 + 6 sem (Endocrine Society 2017 / SmPC Nebido).
            </CardDescription>
          </div>
          <span
            className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${
              metrics.inRange
                ? "bg-[color:var(--color-system-body)]/15 text-[color:var(--color-system-body)]"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {metrics.inRange ? "Dentro do intervalo" : "Fora do intervalo"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="grid gap-8 px-4 pb-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_1.6fr]">
        {/* Inputs */}
        <div className="space-y-6">
          {/* === Variáveis de interesse (hero) === */}
          <section
            aria-labelledby="vars-heading"
            className="relative overflow-hidden rounded-lg border border-border/70 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-chart-1)_10%,transparent),color-mix(in_oklab,var(--color-chart-2)_8%,transparent))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 id="vars-heading" className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/80">
                Variáveis de interesse — estado estacionário
              </h3>
              <span className="font-mono text-[10px] text-muted-foreground">último τ</span>
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              <Metric
                label="Cmax"
                value={metrics.cmax}
                unit="ng/dL"
                secondary={`${ngdlToNmol(metrics.cmax).toFixed(1)} nmol/L`}
                hint={`Pico · dia ${metrics.cmaxDay}`}
              />
              <Metric
                label="Cmédia"
                value={metrics.cmean}
                unit="ng/dL"
                secondary={`${ngdlToNmol(metrics.cmean).toFixed(1)} nmol/L`}
                hint="Css,avg (AUC/τ)"
                emphasis
              />
              <Metric
                label="Cmin"
                value={metrics.ctrough}
                unit="ng/dL"
                secondary={`${ngdlToNmol(metrics.ctrough).toFixed(1)} nmol/L`}
                hint={`Vale · dia ${metrics.ctroughDay}`}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2 font-mono text-[10px] text-muted-foreground">
              <span>
                Δ vs alvo{" "}
                <span className={`tabular-nums ${
                  Math.abs(metrics.cmean - targetCmean) < 50
                    ? "text-[color:var(--color-system-body)]"
                    : "text-foreground"
                }`}>
                  {metrics.cmean - targetCmean >= 0 ? "+" : ""}
                  {Math.round(metrics.cmean - targetCmean)} ng/dL
                </span>
              </span>
              <span>Amplitude Cmax−Cmin: <span className="text-foreground tabular-nums">{Math.round(metrics.cmax - metrics.ctrough)} ng/dL</span></span>
              <span>Ref. adulto 264–916 (Travison 2017)</span>
            </div>
          </section>

          {/* === Ajuste por Cmédia-alvo === */}
          <section
            aria-labelledby="target-heading"
            className="rounded-lg border border-[color:var(--color-chart-2)]/40 bg-[color:var(--color-chart-2)]/8 p-3.5 space-y-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 id="target-heading" className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/80">
                Ajustar τ para Cmédia-alvo
              </h3>
              <span className="font-mono text-[10px] text-muted-foreground">
                τ actual = {params.intervalDays} d
              </span>
            </div>
            <Control
              label="Cmédia-alvo"
              unit="ng/dL"
              value={targetCmean}
              min={264}
              max={916}
              step={10}
              hint="Concentração sérica média desejada entre aplicações em estado estacionário. Alvos habituais ~500–700 ng/dL; intervalo de referência adulto 264–916 ng/dL."
              source="Travison JCEM 2017"
              onChange={setTargetCmean}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2.5">
              <div className="text-[11px] leading-snug text-muted-foreground">
                τ sugerido{" "}
                <span className="font-mono text-foreground">
                  <strong>{suggestedInterval.toFixed(0)} d</strong>{" "}
                  (~{(suggestedInterval / 7).toFixed(1)} sem)
                </span>
                <span className="ml-1 text-[10px]">· F·D<sub>T</sub>/(Cl·C<sub>alvo</sub>)</span>
              </div>
              <button
                type="button"
                onClick={() => update({ intervalDays: suggestedIntervalClamped })}
                className="rounded-full border border-border/70 bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground shadow-sm transition hover:bg-muted"
              >
                Aplicar τ = {suggestedIntervalClamped} d
              </button>
            </div>
            <p className="text-[10px] leading-snug text-muted-foreground">
              Cálculo determinístico; não substitui titulação por níveis séricos. Clampado a 42–168 d.
            </p>
          </section>

          {/* === Esquema posológico === */}
          <section aria-labelledby="dose-heading" className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-border/60 pb-1.5">
              <h3 id="dose-heading" className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/80">
                Esquema posológico
              </h3>
              <span className="font-mono text-[10px] text-muted-foreground">variáveis controláveis</span>
            </div>
            <Control
              label="Dose"
              unit="mg TU"
              value={params.doseMg}
              min={250}
              max={1500}
              step={50}
              hint="Quantidade de undecilato de testosterona (TU) por injecção IM. Padrão 1000 mg / 4 mL óleo de rícino."
              source="SmPC Nebido / Reandron"
              onChange={(v) => update({ doseMg: v })}
            />
            <Control
              label="Intervalo τ (manutenção)"
              unit="dias"
              value={params.intervalDays}
              min={42}
              max={168}
              step={7}
              hint="Tempo entre doses de manutenção. Tipicamente 70–98 d (10–14 sem) — ES 2017 / SmPC Nebido. Literatura documenta 42–168 d em ajuste individualizado guiado por níveis séricos."
              source="ES 2017 · Saad 2008 · Zitzmann 2013"
              onChange={(v) => update({ intervalDays: v })}
            />
            <Control
              label="Peso"
              unit="kg"
              value={params.weightKg}
              min={45}
              max={130}
              step={1}
              hint="Escala a clearance metabólica total (Cl = Cl/kg × peso)."
              onChange={(v) => update({ weightKg: v })}
            />
          </section>

          {/* === Parâmetros PK (avançado) === */}
          <details className="group rounded-lg border border-border/60 bg-muted/20 open:bg-muted/30">
            <summary className="flex cursor-pointer items-baseline justify-between gap-2 px-3.5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/70 transition hover:text-foreground">
              <span>Parâmetros farmacocinéticos · avançado</span>
              <span className="text-[10px] text-muted-foreground transition group-open:rotate-180">▾</span>
            </summary>
            <div className="space-y-4 px-3.5 pb-4 pt-1">
              <Control
                label="t½ subida (absorção)"
                unit="d"
                value={params.absorptionHalfLifeD}
                min={2}
                max={20}
                step={0.5}
                hint="Meia-vida de absorção (ka): libertação rápida do depósito IM. Tmax (7–14 d, Schubert 2004) emerge da combinação ka/ke."
                source="Schubert 2004"
                onChange={(v) => update({ absorptionHalfLifeD: v })}
              />
              <Control
                label="t½ aparente terminal"
                unit="d"
                value={params.eliminationHalfLifeD}
                min={20}
                max={50}
                step={1}
                hint="Meia-vida aparente da fase descendente. Em flip-flop reflecte libertação do depósito (~33 d), não a eliminação intrínseca da T."
                source="Schubert 2004 / Behre 1999"
                onChange={(v) => update({ eliminationHalfLifeD: v })}
              />
              <Control
                label="Clearance"
                unit="L/kg/d"
                value={params.clearanceLPerKgPerDay}
                min={12}
                max={32}
                step={1}
                hint="Clearance metabólica da T — define directamente a Cmédia em estado estacionário."
                source="Wang 2004 (~21 L/kg/d)"
                onChange={(v) => update({ clearanceLPerKgPerDay: v })}
              />
              <div className="rounded-md border border-border/60 bg-card/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-mono uppercase tracking-[0.16em] text-foreground/70">
                    Verificação analítica
                  </span>
                  <span className="font-mono text-[10px] text-foreground/60">
                    Tmax ≈ {tmax.toFixed(1)} d · Css,avg ≈ {Math.round(cssExpected)} ng/dL
                  </span>
                </div>
                <p className="mt-1.5">
                  Css,avg = F·D<sub>T</sub>/(Cl·τ), com D<sub>T</sub> = dose<sub>TU</sub>×0,6315.
                  Tmax dose-única = ln(ka/ke)/(ka−ke). Esperado: 264–916 ng/dL (Travison 2017),
                  Tmax 7–14 d (Schubert 2004).
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* Chart */}
        <div className="h-[260px] w-full sm:h-[320px] md:h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
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

              {/* Cmédia actual */}
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
                stroke="url(#pk-stroke)"
                strokeWidth={2.5}
                fill="url(#pk-fill)"
                filter="url(#pk-glow)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>

      <div className="border-t border-border/60 px-4 py-4 text-[11px] leading-relaxed text-muted-foreground md:px-6">
        <span className="font-mono uppercase tracking-[0.16em] text-foreground/70">Fontes —</span>{" "}
        Schubert M et al. <em>JCEM</em> 2004;89:5429–34 (PK do TU 1000 mg IM, t½ aparente
        33,9 d). Behre HM, Nieschlag E. <em>Eur J Endocrinol</em> 1999. Wang C et al.{" "}
        <em>JCEM</em> 2004 (Cl ≈ 1500 L/d). Endocrine Society Clinical Practice Guideline
        2017. Travison TG et al. <em>JCEM</em> 2017 (intervalo 264–916 ng/dL).{" "}
        <span className="italic">Página educativa; não constitui orientação posológica.</span>
      </div>
    </Card>
  );
}

function Metric({
  label,
  value,
  unit,
  secondary,
  hint,
  emphasis = false,
}: {
  label: string;
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
          ? "rounded-md border border-[color:var(--color-chart-2)]/40 bg-card/70 px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
          : "px-1"
      }
    >
      <div className={`text-[10px] uppercase tracking-[0.18em] ${emphasis ? "text-[color:var(--color-chart-2)]" : "text-muted-foreground"}`}>{label}</div>
      <div className={`font-mono tabular-nums text-foreground ${emphasis ? "text-xl font-medium" : "text-lg"}`}>{Math.round(value)}</div>
      <div className="text-[10px] text-muted-foreground">{unit}</div>
      {secondary ? (
        <div className="font-mono text-[10px] text-foreground/60">{secondary}</div>
      ) : null}
      {hint ? <div className="mt-1 text-[10px] leading-tight text-muted-foreground/80">{hint}</div> : null}
    </div>
  );
}
