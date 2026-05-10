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
import {
  computeMetrics,
  DEFAULT_PK,
  generatePkSeries,
  ngdlToNmol,
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
        <div className="space-y-5">
          <Control
            label="Dose"
            unit="mg TU"
            value={params.doseMg}
            min={250}
            max={1500}
            step={50}
            hint="Quantidade de undecilato de testosterona (TU) administrada por injeção IM. Padrão: 1000 mg em 4 mL de óleo de rícino."
            source="SmPC Nebido / Reandron"
            onChange={(v) => update({ doseMg: v })}
          />
          <Control
            label="Intervalo (manutenção)"
            unit="dias"
            value={params.intervalDays}
            min={42}
            max={168}
            step={7}
            hint="Tempo entre doses de manutenção. Tipicamente 70–98 d (10–14 sem) conforme Endocrine Society 2017 / SmPC Nebido, mas a literatura documenta encurtamento até 6 sem (42 d) e prolongamento até 24 sem (168 d) em ajuste individualizado guiado por níveis séricos (Saad 2008; Zitzmann 2013)."
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
            hint="Peso corporal — escala a clearance metabólica total (Cl total = Cl/kg × peso)."
            onChange={(v) => update({ weightKg: v })}
          />
          <Control
            label="t½ subida (absorção)"
            unit="d"
            value={params.absorptionHalfLifeD}
            min={2}
            max={20}
            step={0.5}
            hint="Meia-vida de absorção (ka): rapidez com que o TU é libertado do depósito IM. Não confundir com Tmax — o Tmax (7–14 d, Schubert 2004) emerge da combinação de ka e ke; tipicamente ka corresponde a t½ ~3–6 d."
            source="Schubert 2004 (Tmax 7–14 d)"
            onChange={(v) => update({ absorptionHalfLifeD: v })}
          />
          <Control
            label="t½ aparente terminal"
            unit="d"
            value={params.eliminationHalfLifeD}
            min={20}
            max={50}
            step={1}
            hint="Meia-vida aparente da fase descendente. Em cinética flip-flop reflecte a libertação lenta do depósito, não a eliminação intrínseca da T (~33 d)."
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
            hint="Clearance metabólica da testosterona — volume de plasma depurado por dia por kg. Define a concentração média em estado estacionário."
            source="Wang 2004 (~21 L/kg/d)"
            onChange={(v) => update({ clearanceLPerKgPerDay: v })}
          />

          <div className="grid grid-cols-3 gap-2 border-t border-border pt-5">
            <Metric
              label="Cmax"
              value={metrics.cmax}
              unit="ng/dL"
              secondary={`${ngdlToNmol(metrics.cmax).toFixed(1)} nmol/L`}
              hint={`Pico no último intervalo (dia ${metrics.cmaxDay})`}
            />
            <Metric
              label="Cmédia"
              value={metrics.cmean}
              unit="ng/dL"
              secondary={`${ngdlToNmol(metrics.cmean).toFixed(1)} nmol/L`}
              hint="Exposição média (proxy AUC/τ)"
            />
            <Metric
              label="Cmin"
              value={metrics.ctrough}
              unit="ng/dL"
              secondary={`${ngdlToNmol(metrics.ctrough).toFixed(1)} nmol/L`}
              hint={`Vale (dia ${metrics.ctroughDay})`}
            />
          </div>

          <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono uppercase tracking-[0.16em] text-foreground/70">
                Verificação analítica
              </span>
              <span className="font-mono text-[10px] text-foreground/60">
                Tmax ≈ {tmax.toFixed(1)} d · Css,avg ≈ {Math.round(cssExpected)} ng/dL
              </span>
            </div>
            <p className="mt-1.5">
              Css,avg = F·D<sub>T</sub>/(Cl·τ), com D<sub>T</sub> = dose<sub>TU</sub>×0,6315
              (razão MW T/TU). Tmax dose-única = ln(ka/ke)/(ka−ke). Valores devem
              cair em 264–916 ng/dL (Travison <em>JCEM</em> 2017) e Tmax em 7–14 d
              (Schubert <em>JCEM</em> 2004) com parâmetros típicos.
            </p>
          </div>
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
}: {
  label: string;
  value: number;
  unit: string;
  secondary?: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="font-mono text-lg tabular-nums text-foreground">{Math.round(value)}</div>
      <div className="text-[10px] text-muted-foreground">{unit}</div>
      {secondary ? (
        <div className="font-mono text-[10px] text-foreground/60">{secondary}</div>
      ) : null}
      {hint ? <div className="mt-1 text-[10px] leading-tight text-muted-foreground/80">{hint}</div> : null}
    </div>
  );
}
