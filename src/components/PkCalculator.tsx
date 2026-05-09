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

  const series = useMemo(() => generatePkSeries(params, { stepDays: 1 }), [params]);
  const metrics = useMemo(() => computeMetrics(series, params), [series, params]);

  const update = (patch: Partial<PkParams>) => setParams((p) => ({ ...p, ...patch }));

  return (
    <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur">
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
            min={56}
            max={126}
            step={7}
            hint="Tempo entre doses de manutenção. Ajustável individualmente conforme níveis séricos — tipicamente 70–98 d (10–14 semanas)."
            source="Endocrine Society 2017"
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
            label="t½ subida (libertação)"
            unit="d"
            value={params.absorptionHalfLifeD}
            min={2}
            max={10}
            step={0.5}
            hint="Meia-vida de absorção: rapidez com que o TU é libertado do depósito IM. Determina a fase ascendente e o Tmax (~7–14 d)."
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
            <Metric label="Cmax" value={metrics.cmax} unit="ng/dL" hint="Concentração máxima no último intervalo" />
            <Metric label="Cmédia" value={metrics.cmean} unit="ng/dL" hint="Exposição média (proxy de AUC/τ)" />
            <Metric label="Cmin" value={metrics.ctrough} unit="ng/dL" hint="Vale antes da próxima dose" />
          </div>

          <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-mono uppercase tracking-[0.16em] text-foreground/70">
              Faixa de referência
            </span>
            <p className="mt-1">
              264–916 ng/dL — intervalo harmonizado em adultos saudáveis (19–39 a),
              Travison et al., <em>JCEM</em> 2017. Contexto, não alvo terapêutico individual.
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pk-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                </linearGradient>
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
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="url(#pk-fill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>

      <div className="border-t border-border/60 px-6 py-4 text-[11px] leading-relaxed text-muted-foreground">
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
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="font-mono text-lg tabular-nums text-foreground">{Math.round(value)}</div>
      <div className="text-[10px] text-muted-foreground">{unit}</div>
      {hint ? <div className="mt-1 text-[10px] leading-tight text-muted-foreground/80">{hint}</div> : null}
    </div>
  );
}
