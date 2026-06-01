import { useState, useCallback, useMemo, useEffect } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  ReferenceArea,
  Brush,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Activity, AlertTriangle, CheckCircle2, TrendingUp, Clock } from "lucide-react";
import {
  simularPerfil,
  simularMonteCarlo,
  calcularMetricas,
  gerarCronograma,
  gerarCronogramaSchubert,
  recomendarIntervalo,
  PARAMETROS_POPULACIONAIS,
  ALVOS_CALIBRACAO,
  EUGONADAL_MIN_NGDL,
  EUGONADAL_MAX_NGDL,
  EUGONADAL_MIN_NMOL,
  EUGONADAL_MAX_NMOL,
  NMOL_TO_NGDL,
  NGDL_TO_NMOL,
  type PontoCurva,
  type ResultadoMonteCarlo,
  type MetricasPK,
  type RecomendacaoIntervalo,
} from "@/lib/pk-engine";
import { UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import lodiLogo from "@/assets/lodi-logo.png";

type UnidadeConc = "ngdl" | "nmol";

interface ConfigSimulador {
  doseMg: number;
  intervaloDias: number;
  nDoses: number;
  unidade: UnidadeConc;
  mostrarMonteCarlo: boolean;
  nSimulacoesMC: number;
  cargaSchubert: boolean; // regime de carga clássico EU: 0, 6 sem, q12sem
}

const CONFIG_INICIAL: ConfigSimulador = {
  doseMg: 1000,
  intervaloDias: 84, // 12 semanas
  nDoses: 8,
  unidade: "ngdl",
  mostrarMonteCarlo: true,
  nSimulacoesMC: 150,
  cargaSchubert: true,
};

function fmt(v: number, u: UnidadeConc): string {
  if (u === "ngdl") return `${Math.round(v)} ng/dL`;
  return `${v.toFixed(1)} nmol/L`;
}

function statusEugonadal(c: number, u: UnidadeConc): "baixo" | "normal" | "alto" {
  const cNgdl = u === "ngdl" ? c : c * NMOL_TO_NGDL;
  if (cNgdl < EUGONADAL_MIN_NGDL) return "baixo";
  if (cNgdl > EUGONADAL_MAX_NGDL) return "alto";
  return "normal";
}

const STATUS_COLOR = {
  baixo: "text-amber-600 dark:text-amber-400",
  normal: "text-emerald-600 dark:text-emerald-400",
  alto: "text-rose-600 dark:text-rose-400",
};

const STATUS_ICON = {
  baixo: <AlertTriangle className="w-4 h-4" />,
  normal: <CheckCircle2 className="w-4 h-4" />,
  alto: <AlertTriangle className="w-4 h-4" />,
};

const STATUS_LABEL = {
  baixo: "Hipogonádico",
  normal: "Eugonádico",
  alto: "Suprafisiológico",
};

function MetricCard({
  label,
  value,
  sub,
  icon,
  statusClass,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  statusClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-card border border-card-border">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className={`text-lg font-semibold tabular-nums ${statusClass ?? ""}`}>{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function CustomTooltipMC({
  active,
  payload,
  label,
  unidade,
}: {
  active?: boolean;
  payload?: {
    value: number | [number, number];
    name: string;
    color?: string;
    payload?: { dia?: number };
  }[];
  label?: number;
  unidade: UnidadeConc;
}) {
  if (!active || !payload || !payload.length) return null;
  const unit = unidade === "ngdl" ? "ng/dL" : "nmol/L";
  const semana = label !== undefined ? Math.round(label) : "-";
  const dia = payload[0]?.payload?.dia;
  const casas = unidade === "nmol" ? 1 : 0;
  const formatarValor = (valor: number | [number, number]) => {
    if (Array.isArray(valor)) {
      return `${valor[0].toFixed(casas)}–${valor[1].toFixed(casas)} ${unit}`;
    }
    return `${valor.toFixed(casas)} ${unit}`;
  };

  return (
    <div className="w-[220px] max-w-[calc(100vw-2rem)] rounded-lg border border-border/80 bg-popover/95 p-3.5 text-xs shadow-xl backdrop-blur-md">
      <div className="mb-3 flex items-start justify-between gap-4 border-b border-border/60 pb-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Semana {semana}
          </div>
          {typeof dia === "number" && (
            <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              dia {Math.round(dia)}
            </div>
          )}
        </div>
        <div className="rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          {unit}
        </div>
      </div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-baseline justify-between gap-5 py-1 text-muted-foreground">
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: p.color ?? "var(--color-primary)" }}
            />
            <span className="truncate">{p.name}</span>
          </span>
          <span className="font-mono text-[12px] font-semibold tabular-nums text-foreground">
            {formatarValor(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Simulator() {
  const [config, setConfig] = useState<ConfigSimulador>(CONFIG_INICIAL);
  const [isCalculating, setIsCalculating] = useState(false);
  const [aba, setAba] = useState("grafico");

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    try {
      localStorage.removeItem("lodi-theme");
    } catch {
      // ignora armazenamento indisponível no navegador
    }
  }, []);

  const doses = useMemo(
    () =>
      config.cargaSchubert
        ? gerarCronogramaSchubert(config.doseMg, config.nDoses)
        : gerarCronograma(config.doseMg, config.intervaloDias, config.nDoses),
    [config.doseMg, config.intervaloDias, config.nDoses, config.cargaSchubert],
  );

  const horDias = useMemo(() => {
    const ultimaDose = doses[doses.length - 1]?.diaDose ?? 0;
    return Math.max(ultimaDose + 120, 365);
  }, [doses]);

  const perfilMediano = useMemo(
    () =>
      simularPerfil(doses, PARAMETROS_POPULACIONAIS, {
        passoDias: 0.5,
        horizonteDias: horDias,
      }),
    [doses, horDias],
  );

  const metricas: MetricasPK = useMemo(
    () => calcularMetricas(perfilMediano, doses),
    [perfilMediano, doses],
  );

  // Métricas clínicas adicionais: 1ª dose isolada e steady-state
  const metricasClinicas = useMemo(() => {
    if (perfilMediano.length === 0) return null;

    // Cmax 1ª dose: simular dose única isolada (sem acúmulo) por 200 dias
    const perfilDoseUnica = simularPerfil(
      [{ diaDose: 0, doseMg: doses[0]?.doseMg ?? 1000 }],
      PARAMETROS_POPULACIONAIS,
      { passoDias: 0.5, horizonteDias: 200 },
    );
    let cmax1a = 0,
      tmax1a = 0;
    for (const p of perfilDoseUnica) {
      if (p.ngdl > cmax1a) {
        cmax1a = p.ngdl;
        tmax1a = p.dia;
      }
    }

    // Cmin / Cmax SS: último intervalo entre as 2 últimas doses
    const nD = doses.length;
    const tIni = nD >= 2 ? doses[nD - 2].diaDose : 0;
    const tFim = nD >= 1 ? doses[nD - 1].diaDose : 0;
    const ssRegiao = perfilMediano.filter((p) => p.dia >= tIni && p.dia < tFim);
    const cminSS = ssRegiao.length > 0 ? Math.min(...ssRegiao.map((p) => p.ngdl)) : 0;
    const cmaxSS = ssRegiao.length > 0 ? Math.max(...ssRegiao.map((p) => p.ngdl)) : 0;

    return { cmax1a, tmax1a, cminSS, cmaxSS };
  }, [perfilMediano, doses]);

  const [resultadoMC, setResultadoMC] = useState<ResultadoMonteCarlo | null>(null);
  const [mcConcluido, setMcConcluido] = useState(false);

  // ----- Calibração individual (aba "Ajustar para um paciente") -----
  const [pacienteIn, setPacienteIn] = useState({
    doseMg: "1000",
    intervaloSemanas: "12",
    cmaxObs: "",
    cminObs: "",
    cavgAlvo: "600",
  });
  const [recomendacao, setRecomendacao] = useState<RecomendacaoIntervalo | null>(null);

  const calcularRecomendacao = useCallback(() => {
    const dose = parseFloat(pacienteIn.doseMg);
    const intSem = parseFloat(pacienteIn.intervaloSemanas);
    const cmax = parseFloat(pacienteIn.cmaxObs);
    const cmin = parseFloat(pacienteIn.cminObs);
    const alvo = parseFloat(pacienteIn.cavgAlvo);
    if (!isFinite(dose) || dose <= 0) return;
    if (!isFinite(intSem) || intSem <= 0) return;
    const haAlguma = isFinite(cmax) || isFinite(cmin);
    if (!haAlguma) return;
    const r = recomendarIntervalo({
      doseMg: dose,
      intervaloDias: intSem * 7,
      cmaxObsNgdl: isFinite(cmax) ? cmax : undefined,
      cminObsNgdl: isFinite(cmin) ? cmin : undefined,
      cavgAlvoNgdl: isFinite(alvo) && alvo > 0 ? alvo : 600,
    });
    setRecomendacao(r);
  }, [pacienteIn]);

  const executarMC = useCallback(async () => {
    setIsCalculating(true);
    setMcConcluido(false);
    await new Promise((r) => setTimeout(r, 10));
    const resultado = simularMonteCarlo(doses, config.nSimulacoesMC, {
      passoDias: 1,
      horizonteDias: horDias,
    });
    setResultadoMC(resultado);
    setIsCalculating(false);
    setMcConcluido(true);
  }, [doses, config.nSimulacoesMC, horDias]);

  // Auto-executar simulação de variação quando ativada ou quando parâmetros mudam (debounced)
  useEffect(() => {
    if (!config.mostrarMonteCarlo) {
      setResultadoMC(null);
      setMcConcluido(false);
      return;
    }
    const t = setTimeout(() => {
      void executarMC();
    }, 200);
    return () => clearTimeout(t);
  }, [config.mostrarMonteCarlo, doses, config.nSimulacoesMC, executarMC]);

  const chave = config.unidade === "ngdl" ? "ngdl" : "nmol";
  const unLabel = config.unidade === "ngdl" ? "ng/dL" : "nmol/L";
  const eugMin = config.unidade === "ngdl" ? EUGONADAL_MIN_NGDL : EUGONADAL_MIN_NMOL;
  const eugMax = config.unidade === "ngdl" ? EUGONADAL_MAX_NGDL : EUGONADAL_MAX_NMOL;

  // Preparar dados do gráfico (decimar a cada 3 pontos para performance)
  // Para bandas de IC com Recharts, usamos pares [low, high] em cada dataKey de Area
  const dadosGrafico = useMemo(() => {
    if (!config.mostrarMonteCarlo || !resultadoMC) {
      return perfilMediano
        .filter((_, i) => i % 3 === 0)
        .map((pt) => ({ semana: pt.semana, dia: pt.dia, conc: pt[chave] }));
    }

    // Para bandas: area com dataKey=[low, high] onde low é o valor baixo e high o alto
    return resultadoMC.mediana
      .filter((_, i) => i % 3 === 0)
      .map((pt, j) => {
        const idx = j * 3;
        const getV = (arr: PontoCurva[], i: number) => arr[i]?.[chave] ?? 0;
        return {
          semana: pt.semana,
          dia: pt.dia,
          conc: pt[chave],
          bandaIC90: [getV(resultadoMC.p5, idx), getV(resultadoMC.p95, idx)] as [number, number],
          bandaIQ50: [getV(resultadoMC.p25, idx), getV(resultadoMC.p75, idx)] as [number, number],
        };
      });
  }, [perfilMediano, resultadoMC, config.mostrarMonteCarlo, chave]);

  // Dados histograma de distribuição de Cmax (último MC)
  const histCmax = useMemo(() => {
    if (!resultadoMC) return [];
    const { cmaxSSMediaNgdl, cmaxSSDpNgdl } = resultadoMC.metricasPopulacionais;
    const bins = 15;
    const min = Math.max(0, cmaxSSMediaNgdl - 3 * cmaxSSDpNgdl);
    const max = cmaxSSMediaNgdl + 3 * cmaxSSDpNgdl;
    const step = (max - min) / bins;
    return Array.from({ length: bins }, (_, i) => ({
      range: `${Math.round(min + i * step)}`,
      count: 0,
      pct: 0,
    }));
  }, [resultadoMC]);

  const statusCmax = statusEugonadal(
    config.unidade === "ngdl" ? metricas.cmaxNgdl : metricas.cmaxNmol,
    config.unidade,
  );
  const statusCmin = statusEugonadal(
    config.unidade === "ngdl" ? metricas.cminNgdl : metricas.cminNmol,
    config.unidade,
  );

  const xTickFormatter = (v: number) => `sem ${Math.round(v)}`;
  const yTickFormatter = (v: number) =>
    config.unidade === "nmol" ? v.toFixed(1) : Math.round(v).toLocaleString("pt-BR");
  const eixoTick = {
    fontSize: 11,
    fill: "var(--color-muted-foreground)",
    fontFamily: "var(--font-mono)",
  };

  const yMax = useMemo(() => {
    const valores = dadosGrafico.flatMap((p) => {
      const bandas: number[] = [];
      if ("bandaIC90" in p && Array.isArray(p.bandaIC90)) bandas.push(p.bandaIC90[1]);
      if ("bandaIQ50" in p && Array.isArray(p.bandaIQ50)) bandas.push(p.bandaIQ50[1]);
      return [p.conc, ...bandas];
    });
    const max = Math.max(eugMax, ...valores);
    return Math.ceil((max * 1.08) / 100) * 100;
  }, [dadosGrafico, eugMax]);

  // Ticks de eixo X: a cada 12 semanas (≈ 3 meses) para legibilidade
  const xTicks = useMemo(() => {
    const maxSemana = Math.ceil(horDias / 7);
    const step = maxSemana > 80 ? 24 : maxSemana > 40 ? 12 : 6;
    const arr: number[] = [];
    for (let s = 0; s <= maxSemana; s += step) arr.push(s);
    return arr;
  }, [horDias]);

  return (
    <div className="rounded-xl border border-border/70 bg-card/80 text-foreground shadow-sm overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/70 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 bg-muted/25">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <img
            src={lodiLogo}
            alt="L.O.D.I."
            className="h-14 w-auto select-none"
            draggable={false}
          />
          <p className="hidden md:block text-xs text-muted-foreground/80 leading-snug">
            Simulação farmacocinética de undecilato de testosterona (Nebido)
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className="text-[10px] gap-1 border-accent/40 text-accent uppercase tracking-wider"
          >
            <Activity className="w-3 h-3" />
            Uso educacional
          </Badge>
        </div>
      </header>

      <div className="flex flex-col gap-6 p-4 lg:p-5">
        {/* Painel de controles */}
        <aside className="grid gap-5 lg:grid-cols-[1fr_1fr_0.7fr]">
          <div>
            <h2 className="text-sm font-semibold mb-3 text-foreground">Esquema posológico</h2>

            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-muted-foreground">Dose</Label>
                  <span className="text-xs font-mono font-medium">{config.doseMg} mg</span>
                </div>
                <Slider
                  data-testid="slider-dose"
                  min={250}
                  max={1000}
                  step={50}
                  value={[config.doseMg]}
                  onValueChange={([v]) => setConfig((c) => ({ ...c, doseMg: v }))}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>250 mg</span>
                  <span>1000 mg</span>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-foreground">
                    Regime de carga (Schubert)
                  </Label>
                  <Switch
                    data-testid="switch-carga"
                    checked={config.cargaSchubert}
                    onCheckedChange={(v) => setConfig((c) => ({ ...c, cargaSchubert: v }))}
                  />
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Regime de bula do Nebido®: 1ª dose, 2ª dose após 6 semanas, manutenção a cada
                  12 semanas. Reduz o tempo até o estado estacionário (Schubert et al., JCEM 2004).
                </p>
              </div>

              <div
                className={`space-y-2 ${config.cargaSchubert ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex justify-between">
                  <Label className="text-xs text-muted-foreground">Intervalo entre doses (τ)</Label>
                  <span className="text-xs font-mono font-medium">
                    {config.cargaSchubert
                      ? "12 sem (Schubert)"
                      : `${(config.intervaloDias / 7).toFixed(0)} sem`}
                  </span>
                </div>
                <Slider
                  data-testid="slider-intervalo"
                  min={42}
                  max={112}
                  step={7}
                  value={[config.intervaloDias]}
                  onValueChange={([v]) => setConfig((c) => ({ ...c, intervaloDias: v }))}
                  disabled={config.cargaSchubert}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>6 sem</span>
                  <span>16 sem</span>
                </div>

              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-muted-foreground">Número de doses simuladas</Label>
                  <span className="text-xs font-mono font-medium">{config.nDoses}</span>
                </div>
                <Slider
                  data-testid="slider-ndoses"
                  min={2}
                  max={12}
                  step={1}
                  value={[config.nDoses]}
                  onValueChange={([v]) => setConfig((c) => ({ ...c, nDoses: v }))}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2</span>
                  <span>12</span>
                </div>
              </div>
            </div>
          </div>


          <Separator className="lg:hidden" />

          <div>
            <h2 className="text-sm font-semibold mb-3">Visualização</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Unidade</Label>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={
                      config.unidade === "ngdl"
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    ng/dL
                  </span>
                  <Switch
                    data-testid="switch-unidade"
                    checked={config.unidade === "nmol"}
                    onCheckedChange={(v) =>
                      setConfig((c) => ({ ...c, unidade: v ? "nmol" : "ngdl" }))
                    }
                  />
                  <span
                    className={
                      config.unidade === "nmol"
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    nmol/L
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-foreground">
                    Variabilidade populacional (Monte Carlo)
                  </Label>
                  <Switch
                    data-testid="switch-mc"
                    checked={config.mostrarMonteCarlo}
                    onCheckedChange={(v) => setConfig((c) => ({ ...c, mostrarMonteCarlo: v }))}
                  />
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Propaga a variabilidade interindividual log-normal (IIV) sobre os parâmetros
                  estruturais e retorna percentis populacionais da curva.
                </p>
                {config.mostrarMonteCarlo && (
                  <div className="pt-2 space-y-2 border-t border-border">
                    <div className="flex justify-between">
                      <Label className="text-[11px] text-muted-foreground">
                        Replicações Monte Carlo (N)
                      </Label>
                      <span className="text-[11px] font-mono font-medium">
                        {config.nSimulacoesMC}
                      </span>
                    </div>
                    <Slider
                      data-testid="slider-mc"
                      min={50}
                      max={500}
                      step={50}
                      value={[config.nSimulacoesMC]}
                      onValueChange={([v]) => setConfig((c) => ({ ...c, nSimulacoesMC: v }))}
                    />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>50</span>
                      {isCalculating ? (
                        <span className="flex items-center gap-1 text-primary">
                          <span className="inline-block w-2 h-2 rounded-full border border-primary border-t-transparent animate-spin" />
                          simulando…
                        </span>
                      ) : mcConcluido ? (
                        <span className="text-emerald-600 dark:text-emerald-400">concluído</span>
                      ) : null}
                      <span>500</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="lg:hidden" />

          {/* Cronograma de doses */}
          <div>
            <h2 className="text-sm font-semibold mb-2">Cronograma posológico</h2>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {doses.map((d, i) => (
                <div key={i} className="flex justify-between text-xs py-0.5">
                  <span className="text-muted-foreground">Administração {i + 1}</span>
                  <span className="font-mono text-foreground">
                    semana {(d.diaDose / 7).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>


        {/* Área principal */}
        <main className="flex flex-col rounded-xl border border-border/70 bg-background/55">
          {/* Métricas clínicas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-border">
            {(() => {
              const val =
                config.unidade === "ngdl"
                  ? (metricasClinicas?.cmax1a ?? metricas.cmaxNgdl)
                  : (metricasClinicas?.cmax1a ?? metricas.cmaxNgdl) * NGDL_TO_NMOL;
              const st = statusEugonadal(val, config.unidade);
              return (
                <MetricCard
                  label="Cmax (1ª dose)"
                  value={fmt(val, config.unidade)}
                  sub={`Tmax ≈ ${Math.round(metricasClinicas?.tmax1a ?? metricas.tmaxDias)} d`}
                  icon={<TrendingUp className="w-3 h-3" />}
                  statusClass={STATUS_COLOR[st]}
                />
              );
            })()}
            {(() => {
              const val =
                config.unidade === "ngdl"
                  ? (metricasClinicas?.cminSS ?? metricas.cminNgdl)
                  : (metricasClinicas?.cminSS ?? metricas.cminNgdl) * NGDL_TO_NMOL;
              const st = statusEugonadal(val, config.unidade);
              return (
                <MetricCard
                  label="Cmin,SS"
                  value={fmt(val, config.unidade)}
                  sub={`vale no estado estacionário · ${STATUS_LABEL[st]}`}
                  icon={STATUS_ICON[st]}
                  statusClass={STATUS_COLOR[st]}
                />
              );
            })()}
            {(() => {
              const val =
                config.unidade === "ngdl"
                  ? (metricasClinicas?.cmaxSS ?? metricas.cmaxNgdl)
                  : (metricasClinicas?.cmaxSS ?? metricas.cmaxNgdl) * NGDL_TO_NMOL;
              const st = statusEugonadal(val, config.unidade);
              return (
                <MetricCard
                  label="Cmax,SS"
                  value={fmt(val, config.unidade)}
                  sub={`pico no estado estacionário · ${STATUS_LABEL[st]}`}
                  icon={<Activity className="w-3 h-3" />}
                  statusClass={STATUS_COLOR[st]}
                />
              );
            })()}
            <MetricCard
              label="Tempo até estado estacionário"
              value={`~${metricas.steadyStateSemana} sem`}
              sub={`≈ 4 × t½ aparente`}
              icon={<Clock className="w-3 h-3" />}
            />
          </div>

          {/* Métricas populacionais (Monte Carlo) */}
          {resultadoMC && config.mostrarMonteCarlo && (
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-foreground">
                  Variabilidade populacional — N = {resultadoMC.nSimulacoes}
                </p>
                <span className="text-[11px] text-muted-foreground">média ± DP</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  label="Cmax,SS"
                  value={`${Math.round(resultadoMC.metricasPopulacionais.cmaxSSMediaNgdl)} ± ${Math.round(resultadoMC.metricasPopulacionais.cmaxSSDpNgdl)} ng/dL`}
                  sub={`Schubert 2004: ~${ALVOS_CALIBRACAO.cmaxSSNgdl} ng/dL · CV ${((resultadoMC.metricasPopulacionais.cmaxSSDpNgdl / Math.max(1, resultadoMC.metricasPopulacionais.cmaxSSMediaNgdl)) * 100).toFixed(0)}%`}
                />
                <MetricCard
                  label="Cmin,SS"
                  value={`${Math.round(resultadoMC.metricasPopulacionais.cminSSMediaNgdl)} ± ${Math.round(resultadoMC.metricasPopulacionais.cminSSDpNgdl)} ng/dL`}
                  sub={`Schubert 2004: ~${ALVOS_CALIBRACAO.cminSSNgdl} ng/dL`}
                />
                <MetricCard
                  label="Cmédia,SS"
                  value={`${Math.round(resultadoMC.metricasPopulacionais.cavgSSMediaNgdl)} ± ${Math.round(resultadoMC.metricasPopulacionais.cavgSSDpNgdl)} ng/dL`}
                  sub="exposição média no intervalo τ"
                />
                <MetricCard
                  label="% tempo eugonádico"
                  value={`${resultadoMC.metricasPopulacionais.percentEugonadal.toFixed(0)}%`}
                  sub={`${EUGONADAL_MIN_NGDL}–${EUGONADAL_MAX_NGDL} ng/dL no τ`}
                  statusClass={
                    resultadoMC.metricasPopulacionais.percentEugonadal >= 70
                      ? STATUS_COLOR.normal
                      : STATUS_COLOR.baixo
                  }
                />
              </div>
            </div>
          )}


          {/* Gráficos */}
          <div className="flex-1 p-4">
            <Tabs value={aba} onValueChange={setAba}>
              <TabsList className="mb-4">
                <TabsTrigger value="grafico" data-testid="tab-grafico">
                  Perfil temporal
                </TabsTrigger>
                <TabsTrigger value="paciente" data-testid="tab-paciente">
                  <UserCog className="w-3.5 h-3.5 mr-1.5" />
                  Calibração individual
                </TabsTrigger>
                <TabsTrigger value="info" data-testid="tab-info">
                  Modelo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="grafico" className="space-y-5">
                <section className="overflow-visible rounded-lg border border-border/70 bg-card shadow-sm">
                  <div className="border-b border-border/70 px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          Curva farmacocinética
                        </p>
                        <h3 className="mt-2 font-serif text-2xl font-medium tracking-tight text-foreground">
                          Testosterona sérica total
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <span className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
                          {config.doseMg} mg
                        </span>
                        <span className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
                          {config.cargaSchubert
                            ? "Schubert 0 / 6 / q12 sem"
                            : `τ = ${(config.intervaloDias / 7).toFixed(0)} sem`}
                        </span>
                        <span className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
                          {unLabel}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                      Concentração sérica prevista pelo modelo PK populacional. Faixa eugonádica
                      sombreada: {EUGONADAL_MIN_NGDL}–{EUGONADAL_MAX_NGDL} ng/dL. Linhas verticais
                      tracejadas marcam as administrações.
                    </p>
                  </div>
                  <div className="p-3 sm:p-5">
                    {/* Legenda */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-3 text-[11px] text-muted-foreground">
                      {config.mostrarMonteCarlo && resultadoMC ? (
                        <>
                          <span className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-2 w-4 rounded-sm"
                              style={{ backgroundColor: "color-mix(in oklab, var(--color-chart-5) 18%, transparent)" }}
                            />
                            IC 90 % (p5–p95)
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-2 w-4 rounded-sm"
                              style={{ backgroundColor: "color-mix(in oklab, var(--color-chart-2) 30%, transparent)" }}
                            />
                            IIQ 50 % (p25–p75)
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-0.5 w-4"
                              style={{ backgroundColor: "var(--color-primary)" }}
                            />
                            mediana populacional
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-0.5 w-4"
                            style={{ backgroundColor: "var(--color-primary)" }}
                          />
                          concentração sérica (indivíduo típico)
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-4 rounded-sm"
                          style={{ backgroundColor: "color-mix(in oklab, var(--color-system-body) 16%, transparent)" }}
                        />
                        faixa eugonádica ({EUGONADAL_MIN_NGDL}–{EUGONADAL_MAX_NGDL} ng/dL)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-3 w-0.5 border-l border-dashed"
                          style={{ borderColor: "var(--color-chart-4)" }}
                        />
                        administração
                      </span>
                    </div>

                    <div className="-mx-3 overflow-x-auto overflow-y-visible px-3 pb-3 [scrollbar-color:color-mix(in_oklab,var(--color-primary)_34%,transparent)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin] sm:-mx-5 sm:px-5 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/25 [&::-webkit-scrollbar-track]:bg-transparent">
                      <div className="h-[480px] w-full min-w-[760px] rounded-lg border border-border/70 bg-card p-3 sm:h-[520px] sm:p-4">
                        <ResponsiveContainer width="100%" height="100%">

                        <ComposedChart
                          data={dadosGrafico}
                          margin={{ top: 24, right: 118, left: 6, bottom: 44 }}
                        >
                          <defs>
                            <linearGradient id="banda90" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--color-chart-5)" stopOpacity={0.2} />
                              <stop offset="100%" stopColor="var(--color-chart-5)" stopOpacity={0.08} />
                            </linearGradient>
                            <linearGradient id="banda50" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.34} />
                              <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.16} />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="2 8"
                            stroke="var(--color-border)"
                            strokeOpacity={0.62}
                          />
                          <XAxis
                            dataKey="semana"
                            tickFormatter={xTickFormatter}
                            ticks={xTicks}
                            interval={0}
                            minTickGap={12}
                            tick={eixoTick}
                            tickMargin={12}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, yMax]}
                            tickCount={6}
                            tickFormatter={yTickFormatter}
                            tick={eixoTick}
                            tickMargin={12}
                            axisLine={false}
                            tickLine={false}
                            width={64}
                          />
                          <Tooltip
                            allowEscapeViewBox={{ x: true, y: true }}
                            offset={14}
                            content={<CustomTooltipMC unidade={config.unidade} />}
                            wrapperStyle={{ outline: "none", zIndex: 20 }}
                          />

                          {/* Zona eugonadal */}
                          <ReferenceArea
                            y1={eugMin}
                            y2={eugMax}
                            fill="var(--color-system-body)"
                            fillOpacity={0.16}
                          />
                          <ReferenceLine
                            y={eugMin}
                            stroke="var(--color-system-body)"
                            strokeDasharray="6 6"
                            strokeWidth={1.2}
                            opacity={0.72}
                          />
                          <ReferenceLine
                            y={eugMax}
                            stroke="var(--color-system-body)"
                            strokeDasharray="6 6"
                            strokeWidth={1.2}
                            opacity={0.72}
                          />

                          {/* Marcadores de doses */}
                          {doses.map((d, i) => (
                            <ReferenceLine
                              key={i}
                              x={d.diaDose / 7}
                              stroke="var(--color-chart-4)"
                              strokeWidth={1}
                              strokeDasharray="2 4"
                              opacity={0.34}
                            />
                          ))}

                          {config.mostrarMonteCarlo && resultadoMC && (
                            <Area
                              type="monotone"
                              dataKey="bandaIC90"
                              stroke="none"
                              fill="url(#banda90)"
                              fillOpacity={1}
                              name="IC 90 % (p5–p95)"
                              isAnimationActive={false}
                              dot={false}
                              activeDot={false}
                            />
                          )}
                          {config.mostrarMonteCarlo && resultadoMC && (
                            <Area
                              type="monotone"
                              dataKey="bandaIQ50"
                              stroke="none"
                              fill="url(#banda50)"
                              fillOpacity={1}
                              name="IIQ 50 % (p25–p75)"
                              isAnimationActive={false}
                              dot={false}
                              activeDot={false}
                            />
                          )}
                          <Line
                            type="monotone"
                            dataKey="conc"
                            stroke="var(--color-primary)"
                            strokeWidth={2.25}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)", fill: "var(--color-primary)" }}
                            isAnimationActive={false}
                            name={
                              config.mostrarMonteCarlo && resultadoMC
                                ? "mediana populacional"
                                : "concentração sérica"
                            }
                          />


                          <Brush
                            dataKey="semana"
                            height={20}
                            fill="var(--color-card)"
                            stroke="var(--color-border)"
                            tickFormatter={() => ""}
                            travellerWidth={8}
                          />
                        </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Notas de leitura */}
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1.5">
                  <p className="font-medium text-foreground">Notas de leitura</p>
                  <ul className="list-disc list-inside space-y-1 leading-relaxed">
                    <li>
                      <strong className="text-foreground">Acúmulo:</strong> em flip-flop
                      (k<sub>a,lento</sub> ≪ k<sub>e</sub>) o estado estacionário só é atingido
                      após ~4 × t<sub>½</sub> aparente.
                    </li>
                    <li>
                      <strong className="text-foreground">Faixa eugonádica:</strong>{" "}
                      {EUGONADAL_MIN_NGDL}–{EUGONADAL_MAX_NGDL} ng/dL (referência laboratorial
                      para homem adulto).
                    </li>
                    {config.mostrarMonteCarlo && (
                      <li>
                        <strong className="text-foreground">Bandas populacionais:</strong>{" "}
                        derivadas de N indivíduos com IIV log-normal sobre k<sub>a</sub>,
                        k<sub>e</sub>, fração de absorção rápida e S = F/V.
                      </li>
                    )}
                  </ul>
                </div>

                {/* Aviso clínico */}
                <div className="rounded-lg border border-border/70 bg-card p-3 text-xs text-muted-foreground">
                  <strong className="text-foreground">Uso educacional.</strong> Modelo populacional
                  descritivo; não substitui avaliação clínica, dosagem laboratorial nem ajuste
                  posológico individualizado por médico responsável.
                </div>
              </TabsContent>


              <TabsContent value="paciente" className="space-y-4">
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                  {/* Coluna 1: formulário */}
                  <Card className="lg:col-span-1 lodi-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-accent" />
                        Dados do paciente
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Informe a dose atual, o intervalo entre administrações e{" "}
                        <strong>pelo menos um valor laboratorial</strong> (Cmax,SS ou Cmin,SS) medido
                        no estado estacionário, a partir da 4ª–5ª administração.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Dose atual (mg)</Label>
                          <Input
                            data-testid="input-dose"
                            type="number"
                            inputMode="decimal"
                            min={50}
                            step={50}
                            value={pacienteIn.doseMg}
                            onChange={(e) =>
                              setPacienteIn((p) => ({ ...p, doseMg: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Intervalo atual (semanas)</Label>
                          <Input
                            data-testid="input-intervalo"
                            type="number"
                            inputMode="decimal"
                            min={4}
                            step={1}
                            value={pacienteIn.intervaloSemanas}
                            onChange={(e) =>
                              setPacienteIn((p) => ({ ...p, intervaloSemanas: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                          1) Exames do paciente (ng/dL)
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          Informe pelo menos um dos dois valores abaixo, preferencialmente ambos.
                          O algoritmo usa essas medidas para estimar o fator individual de exposição
                          (S = F/V) deste paciente.
                        </p>

                        <div className="space-y-1.5">
                          <Label className="text-xs flex items-center justify-between">
                            <span>Pico medido (Cmax,SS)</span>
                            <span className="text-[10px] text-muted-foreground">
                              ~1 sem após administração
                            </span>
                          </Label>
                          <Input
                            data-testid="input-cmax"
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step={10}
                            placeholder="ex.: 950"
                            value={pacienteIn.cmaxObs}
                            onChange={(e) =>
                              setPacienteIn((p) => ({ ...p, cmaxObs: e.target.value }))
                            }
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs flex items-center justify-between">
                            <span>Vale medido (Cmin,SS)</span>
                            <span className="text-[10px] text-muted-foreground">
                              antes da próxima administração
                            </span>
                          </Label>
                          <Input
                            data-testid="input-cmin"
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step={10}
                            placeholder="ex.: 380"
                            value={pacienteIn.cminObs}
                            onChange={(e) =>
                              setPacienteIn((p) => ({ ...p, cminObs: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                          2) Meta de exposição média
                        </p>
                        <Label className="text-xs flex items-center justify-between">
                          <span>Cmédia,SS alvo (ng/dL)</span>
                          <span className="text-[10px] text-muted-foreground">
                            faixa: {EUGONADAL_MIN_NGDL}–{EUGONADAL_MAX_NGDL}
                          </span>
                        </Label>
                        <Input
                          data-testid="input-cavg-alvo"
                          type="number"
                          inputMode="decimal"
                          min={EUGONADAL_MIN_NGDL}
                          max={EUGONADAL_MAX_NGDL}
                          step={10}
                          placeholder="600"
                          value={pacienteIn.cavgAlvo}
                          onChange={(e) =>
                            setPacienteIn((p) => ({ ...p, cavgAlvo: e.target.value }))
                          }
                        />
                        <div className="flex gap-1.5 flex-wrap pt-1">
                          {[400, 500, 600, 700, 800].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setPacienteIn((p) => ({ ...p, cavgAlvo: String(v) }))}
                              className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                                pacienteIn.cavgAlvo === String(v)
                                  ? "lodi-chip-active bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-muted-foreground border-border hover:bg-muted hover:border-accent/50"
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          Meta de exposição sérica média no intervalo τ. O algoritmo seleciona o
                          intervalo que mais se aproxima dessa meta mantendo Cmin,SS ≥ {EUGONADAL_MIN_NGDL} ng/dL.
                        </p>
                      </div>

                      <Button
                        data-testid="button-recomendar"
                        className="w-full lodi-button-primary font-display tracking-wide"
                        onClick={calcularRecomendacao}
                      >
                        Calcular intervalo recomendado
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Coluna 2-3: resultado */}
                  <div className="lg:col-span-2 space-y-4">
                    {!recomendacao ? (
                      <Card className="border-dashed">
                        <CardContent className="py-12 text-center text-sm text-muted-foreground">
                          <UserCog className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p>
                            Preencha os dados do paciente à esquerda e clique em{" "}
                            <strong className="text-foreground">"Calcular intervalo recomendado"</strong>.
                          </p>
                          <p className="text-xs mt-2">
                            É necessária pelo menos uma medida laboratorial: Cmax,SS ou Cmin,SS.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        {/* Recomendação principal */}
                        <Card className="border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              Intervalo recomendado para este paciente
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-baseline gap-3">
                              <span className="text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                                {(recomendacao.intervaloRecomendadoDias / 7).toFixed(0)}
                              </span>
                              <span className="text-base text-muted-foreground">semanas</span>
                              <span className="text-sm text-muted-foreground">
                                ({recomendacao.intervaloRecomendadoDias} dias) — dose{" "}
                                {parseFloat(pacienteIn.doseMg)} mg
                              </span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">
                              {recomendacao.justificativa}
                            </p>

                            {(() => {
                              const rec = recomendacao.intervalosAvaliados.find(
                                (a) => a.intervaloDias === recomendacao.intervaloRecomendadoDias,
                              )!;
                              return (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                                  <div className="rounded-lg bg-background border border-border p-2">
                                    <div className="text-[10px] text-muted-foreground">
                                      Cmax,SS prevista
                                    </div>
                                    <div className="text-sm font-semibold tabular-nums">
                                      {Math.round(rec.cmaxSSNgdl)} ng/dL
                                    </div>
                                  </div>
                                  <div className="rounded-lg bg-background border border-border p-2">
                                    <div className="text-[10px] text-muted-foreground">
                                      Cmin,SS prevista
                                    </div>
                                    <div className="text-sm font-semibold tabular-nums">
                                      {Math.round(rec.cminSSNgdl)} ng/dL
                                    </div>
                                  </div>
                                  <div className="rounded-lg bg-background border border-border p-2">
                                    <div className="text-[10px] text-muted-foreground">
                                      Cmédia,SS prevista
                                    </div>
                                    <div className="text-sm font-semibold tabular-nums">
                                      {Math.round(rec.cavgSSNgdl)} ng/dL
                                    </div>
                                  </div>
                                  <div className="rounded-lg bg-background border border-border p-2">
                                    <div className="text-[10px] text-muted-foreground">
                                      Tempo eugonádico
                                    </div>
                                    <div
                                      className={`text-sm font-semibold tabular-nums ${rec.percentEugonadal >= 90 ? "text-emerald-600" : rec.percentEugonadal >= 70 ? "text-amber-600" : "text-rose-600"}`}
                                    >
                                      {rec.percentEugonadal.toFixed(0)}%
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>

                        {/* Perfil individual: fator de exposição + Cmédia,SS atual */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                              Perfil individual — exposição e regime atual
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Calculado a partir das medidas laboratoriais informadas, no regime
                              atual ({parseFloat(pacienteIn.doseMg)} mg a cada{" "}
                              {parseFloat(pacienteIn.intervaloSemanas)} semanas).
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Cavg calculado — destaque principal */}
                            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-baseline gap-3">
                              <div className="flex-1">
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
                                  Cmédia,SS atual estimada
                                </div>
                                <div className="text-2xl font-bold tabular-nums text-primary">
                                  {Math.round(recomendacao.cenarioAtual.cavgSSNgdl)}{" "}
                                  <span className="text-sm font-normal text-muted-foreground">
                                    ng/dL
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[11px] text-muted-foreground">
                                  meta
                                </div>
                                <div className="text-base font-semibold tabular-nums">
                                  {Math.round(recomendacao.cavgAlvoNgdl)} ng/dL
                                </div>
                                <div
                                  className={`text-[11px] font-medium ${
                                    Math.abs(
                                      recomendacao.cenarioAtual.cavgSSNgdl -
                                        recomendacao.cavgAlvoNgdl,
                                    ) < 50
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : recomendacao.cenarioAtual.cavgSSNgdl >
                                          recomendacao.cavgAlvoNgdl
                                        ? "text-rose-600 dark:text-rose-400"
                                        : "text-amber-600 dark:text-amber-400"
                                  }`}
                                >
                                  {(() => {
                                    const d =
                                      recomendacao.cenarioAtual.cavgSSNgdl -
                                      recomendacao.cavgAlvoNgdl;
                                    if (Math.abs(d) < 50) return "dentro da meta";
                                    return `${d > 0 ? "+" : ""}${Math.round(d)} ng/dL`;
                                  })()}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="rounded-lg border border-border bg-background p-2">
                                <div className="text-[10px] text-muted-foreground">Cmax,SS atual</div>
                                <div className="font-mono font-semibold">
                                  {Math.round(recomendacao.cenarioAtual.cmaxSSNgdl)} ng/dL
                                </div>
                              </div>
                              <div className="rounded-lg border border-border bg-background p-2">
                                <div className="text-[10px] text-muted-foreground">Cmin,SS atual</div>
                                <div className="font-mono font-semibold">
                                  {Math.round(recomendacao.cenarioAtual.cminSSNgdl)} ng/dL
                                </div>
                              </div>
                              <div className="rounded-lg border border-border bg-background p-2">
                                <div className="text-[10px] text-muted-foreground">
                                  Tempo eugonádico
                                </div>
                                <div
                                  className={`font-mono font-semibold ${recomendacao.cenarioAtual.percentEugonadal >= 90 ? "text-emerald-600" : recomendacao.cenarioAtual.percentEugonadal >= 70 ? "text-amber-600" : "text-rose-600"}`}
                                >
                                  {recomendacao.cenarioAtual.percentEugonadal.toFixed(0)}%
                                </div>
                              </div>
                            </div>

                            <Separator />

                            <div className="text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-muted-foreground">
                                  Fator individual de exposição (S = F/V)
                                </span>
                                <span className="font-mono font-semibold">
                                  {(recomendacao.fatorIndividual * 100).toFixed(0)}% da média
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Estimativa relativa ao parâmetro populacional: cada miligrama de
                                undecilato gera{" "}
                                <strong className="text-foreground">
                                  {recomendacao.fatorIndividual.toFixed(2)}×
                                </strong>{" "}
                                a concentração prevista para um indivíduo típico. Classificação: {recomendacao.classificacaoSensibilidade}.
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Tabela comparativa de intervalos */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                              Comparação de intervalos (para este paciente)
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Predição de pico, vale e tempo na faixa eugonádica para diferentes
                              espaçamentos entre as doses, mantendo a dose atual.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead className="bg-muted/50 text-muted-foreground">
                                  <tr>
                                    <th className="text-left p-2 font-medium">Intervalo</th>
                                    <th className="text-right p-2 font-medium">Cmax,SS</th>
                                    <th className="text-right p-2 font-medium">Cmin,SS</th>
                                    <th className="text-right p-2 font-medium">Cmédia,SS</th>
                                    <th className="text-right p-2 font-medium">% eugonádico</th>
                                    <th className="text-center p-2 font-medium">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {recomendacao.intervalosAvaliados.map((a) => {
                                    const eRecomendado =
                                      a.intervaloDias === recomendacao.intervaloRecomendadoDias;
                                    const statusBadge =
                                      a.status === "ideal" ? (
                                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                                          ideal
                                        </Badge>
                                      ) : a.status === "aceitavel" ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                                          aceitável
                                        </Badge>
                                      ) : a.status === "vale_baixo" ? (
                                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
                                          Cmin baixa
                                        </Badge>
                                      ) : a.status === "pico_alto" ? (
                                        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30">
                                          Cmax alta
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30">
                                          ambos fora
                                        </Badge>
                                      );
                                    return (
                                      <tr
                                        key={a.intervaloDias}
                                        className={`border-t border-border ${eRecomendado ? "bg-emerald-500/5" : ""}`}
                                      >
                                        <td className="p-2 font-medium">
                                          {eRecomendado && (
                                            <span className="text-emerald-600 dark:text-emerald-400 mr-1">
                                              →
                                            </span>
                                          )}
                                          {a.intervaloSemanas.toFixed(0)} sem
                                        </td>
                                        <td
                                          className={`text-right p-2 font-mono ${a.cmaxSSNgdl > EUGONADAL_MAX_NGDL ? "text-rose-600 dark:text-rose-400" : ""}`}
                                        >
                                          {Math.round(a.cmaxSSNgdl)}
                                        </td>
                                        <td
                                          className={`text-right p-2 font-mono ${a.cminSSNgdl < EUGONADAL_MIN_NGDL ? "text-amber-600 dark:text-amber-400" : ""}`}
                                        >
                                          {Math.round(a.cminSSNgdl)}
                                        </td>
                                        <td className="text-right p-2 font-mono">
                                          {Math.round(a.cavgSSNgdl)}
                                        </td>
                                        <td className="text-right p-2 font-mono">
                                          {a.percentEugonadal.toFixed(0)}%
                                        </td>
                                        <td className="p-2 text-center">{statusBadge}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <div className="px-3 py-2 text-[11px] text-muted-foreground border-t border-border">
                              Faixa eugonádica de referência: {EUGONADAL_MIN_NGDL}–
                              {EUGONADAL_MAX_NGDL} ng/dL · Vale acima de {EUGONADAL_MIN_NGDL} = sem
                              concentração subeugonádica entre doses.
                            </div>
                          </CardContent>
                        </Card>

                        <div className="rounded-xl border border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-700 dark:text-amber-300">
                          <strong>Importante:</strong> a recomendação assume medidas laboratoriais
                          coletadas no estado estacionário do regime atual (após a 4ª–5ª administração).
                          Antes desse ponto, a acumulação ainda está em curso e os valores não estimam
                          adequadamente S = F/V. Esta ferramenta é educacional — qualquer ajuste exige
                          validação laboratorial e avaliação médica.
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="info">
                <div className="mb-6 flex flex-col items-center text-center gap-4 py-6">
                  <img
                    src={lodiLogo}
                    alt="L.O.D.I."
                    className="h-40 w-auto select-none"
                    draggable={false}
                  />
                  <p className="text-xs text-muted-foreground max-w-xl">
                    Plataforma educacional de simulação farmacocinética para hormonização com
                    undecilato de testosterona (Nebido) — modelo populacional com absorção bifásica
                    paralela, integração RK4 e variabilidade interindividual por Monte Carlo.
                  </p>
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <Card className="lodi-card">
                    <CardHeader>
                      <CardTitle className="text-sm">Estrutura do modelo</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3 text-muted-foreground leading-relaxed">
                      <p>
                        Após administração intramuscular, o undecilato de testosterona em veículo oleoso
                        forma um depósito de liberação prolongada. O motor representa esse depósito por
                        dois compartimentos de absorção em paralelo: um componente rápido e outro lento.
                      </p>
                      <p>
                        O perfil sérico é calculado pela integração numérica das EDOs do depósito e do
                        compartimento central, considerando:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>dose administrada e cronograma posológico;</li>
                        <li>taxas de absorção k<sub>a,rápido</sub> e k<sub>a,lento</sub>;</li>
                        <li>eliminação central k<sub>e</sub> e fator de escala S = F/V.</li>
                      </ul>
                      <p>
                        O resultado é a curva de testosterona sérica total ao longo do tempo.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="lodi-card">
                    <CardHeader>
                      <CardTitle className="text-sm">Variabilidade interindividual</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3 text-muted-foreground leading-relaxed">
                      <p>
                        Para a mesma dose, indivíduos diferentes podem apresentar concentrações séricas
                        diferentes por variação em biodisponibilidade, distribuição, SHBG, perfusão local
                        e eliminação.
                      </p>
                      <p>Isso depende de fatores como:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>peso, composição corporal e volume aparente de distribuição;</li>
                        <li>SHBG e depuração metabólica;</li>
                        <li>técnica de administração, local de depósito e perfusão muscular.</li>
                      </ul>
                      <p>
                        Quando a opção Monte Carlo está ativa, o motor sorteia parâmetros estruturais
                        por distribuições log-normais e exibe percentis populacionais (p5/p25/mediana/p75/p95).
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="lodi-card">
                    <CardHeader>
                      <CardTitle className="text-sm">Faixas interpretativas</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2 text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                        <span>
                          <strong className="text-foreground">
                            Abaixo de {EUGONADAL_MIN_NGDL} ng/dL — Hipogonádico:
                          </strong>{" "}
                          testosterona baixa demais. Pode causar fadiga, baixa libido, perda
                          muscular.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                        <span>
                          <strong className="text-foreground">
                            Entre {EUGONADAL_MIN_NGDL} e {EUGONADAL_MAX_NGDL} ng/dL — Faixa eugonádica:
                          </strong>{" "}
                          referência laboratorial para testosterona total em homem adulto.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                        <span>
                          <strong className="text-foreground">
                            Acima de {EUGONADAL_MAX_NGDL} ng/dL — Suprafisiológico:
                          </strong>{" "}
                          pode causar efeitos adversos como aumento de hematócrito, retenção,
                          alteração de humor.
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lodi-card">
                    <CardHeader>
                      <CardTitle className="text-sm">Acumulação e estado estacionário</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3 text-muted-foreground leading-relaxed">
                      <p>
                        O Nebido apresenta cinética <em>flip-flop</em>: a absorção lenta do depósito
                        limita a fase terminal mais que a eliminação central.
                      </p>
                      <p>
                        Por isso, nas{" "}
                        <strong className="text-foreground">primeiras 4–5 administrações</strong>, a
                        exposição ainda está em acumulação. O estado estacionário é aproximado após
                        ~4 meias-vidas aparentes, coerente com Schubert et al. 2004.
                      </p>
                      <p>
                        Por isso, calibrações individuais devem usar testosterona medida em regime já
                        estabilizado, preferencialmente{" "}
                        <strong className="text-foreground">
                          imediatamente antes da próxima administração
                        </strong>{" "}
                        (no vale).
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2 lodi-card">
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Detalhes técnicos (para quem quer entender mais)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-3 text-muted-foreground">
                      <p>
                        Modelo farmacocinético populacional com{" "}
                        <strong className="text-foreground">
                          absorção bifásica paralela de 1ª ordem
                        </strong>
                        e <em>efeito flip-flop</em>: k<sub>a,lento</sub> é muito menor que k<sub>e</sub>,
                        tornando a absorção lenta o fator limitante da fase terminal.
                      </p>
                      <div className="font-mono bg-muted rounded p-2 space-y-1 text-[11px]">
                        <p>dQ_R/dt = −k_a,rápido · Q_R</p>
                        <p>dQ_L/dt = −k_a,lento · Q_L</p>
                        <p>dQ_C/dt = k_a,rápido · Q_R + k_a,lento · Q_L − k_e · Q_C</p>
                        <p>C(t) = S · Q_C(t)</p>
                      </div>
                      <p>
                        Parâmetros populacionais: k<sub>a,rápido</sub> = 0,0350/dia; k<sub>a,lento</sub> =
                        0,00650/dia; fração rápida = 0,070; k<sub>e</sub> = 0,460/dia; S = 24,44 (ng/dL)/mg.
                      </p>
                      <p>
                        Variação entre pacientes simulada por{" "}
                        <strong className="text-foreground">método de Monte Carlo</strong>: para
                        cada paciente virtual, sorteia-se um conjunto de parâmetros a partir de
                        distribuições log-normais calibradas com dados de Behre/Nieschlag, Schubert,
                        Bhasin &amp; Travison e revisão clínica do Aveed.
                      </p>
                      <p className="opacity-80">
                        Limitações: não inclui SHBG, variação circadiana, interações medicamentosas
                        nem aromatização. Para decisões clínicas reais, use exames laboratoriais do
                        próprio paciente.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
