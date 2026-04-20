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
  onChange: (v: number) => void;
}

function Control({ label, value, min, max, step, unit, onChange }: ControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </Label>
        <span className="font-mono text-sm tabular-nums text-foreground">
          {value}
          <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
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
      <CardHeader>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle className="font-serif text-2xl font-medium tracking-tight md:text-3xl">
              Modelação farmacocinética
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              Estimativa visual da concentração sérica de testosterona após undecanoato IM,
              com base em um modelo Bateman de um compartimento.
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

      <CardContent className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_1.6fr]">
        {/* Inputs */}
        <div className="space-y-6">
          <Control
            label="Dose"
            unit="mg"
            value={params.doseMg}
            min={250}
            max={1500}
            step={50}
            onChange={(v) => update({ doseMg: v })}
          />
          <Control
            label="Intervalo"
            unit="dias"
            value={params.intervalDays}
            min={28}
            max={140}
            step={7}
            onChange={(v) => update({ intervalDays: v })}
          />
          <Control
            label="Peso"
            unit="kg"
            value={params.weightKg}
            min={45}
            max={130}
            step={1}
            onChange={(v) => update({ weightKg: v })}
          />
          <Control
            label="t½ absorção"
            unit="d"
            value={params.absorptionHalfLifeD}
            min={10}
            max={40}
            step={1}
            onChange={(v) => update({ absorptionHalfLifeD: v })}
          />
          <Control
            label="t½ eliminação"
            unit="d"
            value={params.eliminationHalfLifeD}
            min={1}
            max={6}
            step={0.5}
            onChange={(v) => update({ eliminationHalfLifeD: v })}
          />

          <div className="grid grid-cols-3 gap-2 border-t border-border pt-5">
            <Metric label="Cmax" value={metrics.cmax} unit="ng/dL" />
            <Metric label="Cmédia" value={metrics.cmean} unit="ng/dL" />
            <Metric label="Cmin" value={metrics.ctrough} unit="ng/dL" />
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
    </Card>
  );
}

function Metric({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="font-mono text-lg tabular-nums text-foreground">{Math.round(value)}</div>
      <div className="text-[10px] text-muted-foreground">{unit}</div>
    </div>
  );
}
