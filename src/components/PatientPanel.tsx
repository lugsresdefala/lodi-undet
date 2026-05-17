import { useCallback, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  EUGONADAL_MAX_NGDL,
  EUGONADAL_MIN_NGDL,
  recomendarIntervalo,
  type RecomendacaoIntervalo,
} from "@/lib/pk-engine";

/**
 * Painel de calibração individual (importado e adaptado do Compartment-Model,
 * pages/simulator.tsx aba "Ajustar para um paciente").
 *
 * Usa recomendarIntervalo() do motor local, que:
 *  1) ajusta S a partir das medidas reais (Cmax e/ou Cmin em estado estacionário);
 *  2) varre intervalos de 4–18 semanas e escolhe aquele cuja Cmédia mais se
 *     aproxima do alvo, mantendo Cmin ≥ {EUGONADAL_MIN_NGDL} ng/dL
 *     (Travison 2017 / Endocrine Society 2017).
 */
export function PatientPanel() {
  const [pacienteIn, setPacienteIn] = useState({
    doseMg: "1000",
    intervaloSemanas: "12",
    cmaxObs: "",
    cminObs: "",
    cavgAlvo: "600",
  });
  const [recomendacao, setRecomendacao] = useState<RecomendacaoIntervalo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const calcular = useCallback(() => {
    const dose = parseFloat(pacienteIn.doseMg);
    const intSem = parseFloat(pacienteIn.intervaloSemanas);
    const cmax = parseFloat(pacienteIn.cmaxObs);
    const cmin = parseFloat(pacienteIn.cminObs);
    const alvo = parseFloat(pacienteIn.cavgAlvo);
    if (!isFinite(dose) || dose <= 0) {
      setErro("Indique uma dose válida (mg).");
      return;
    }
    if (!isFinite(intSem) || intSem <= 0) {
      setErro("Indique um intervalo válido (semanas).");
      return;
    }
    const haAlguma = isFinite(cmax) || isFinite(cmin);
    if (!haAlguma) {
      setErro("É necessária pelo menos uma medida laboratorial (pico ou vale).");
      return;
    }
    setErro(null);
    const r = recomendarIntervalo({
      doseMg: dose,
      intervaloDias: intSem * 7,
      cmaxObsNgdl: isFinite(cmax) ? cmax : undefined,
      cminObsNgdl: isFinite(cmin) ? cmin : undefined,
      cavgAlvoNgdl: isFinite(alvo) && alvo > 0 ? alvo : 600,
    });
    setRecomendacao(r);
  }, [pacienteIn]);

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="px-4 pt-5 md:px-6 md:pt-6">
        <h2 className="font-serif text-xl font-medium leading-none tracking-tight sm:text-2xl md:text-3xl">
          Ajustar para uma pessoa concreta
        </h2>
        <CardDescription className="mt-2 text-sm leading-relaxed">
          A partir de uma análise sérica feita em estado estacionário (≥ 4–5 doses no
          mesmo esquema), o modelo calibra a sensibilidade individual e propõe o intervalo
          posológico cuja Cmédia mais se aproxima do alvo escolhido, mantendo o vale
          acima do limiar eugonádico (Travison 2017: 264–916 ng/dL). Página educativa,
          não dosimétrica.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6 px-4 pb-6 md:px-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* Formulário */}
        <div className="space-y-5 rounded-lg border border-border/70 bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Dose atual (mg)</Label>
              <Input
                type="number"
                inputMode="decimal"
                min={50}
                step={50}
                value={pacienteIn.doseMg}
                onChange={(e) => setPacienteIn((p) => ({ ...p, doseMg: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Intervalo atual (semanas)</Label>
              <Input
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
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              1) Exames laboratoriais (ng/dL)
            </p>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Pelo menos um dos dois valores, coletados após a 4ª–5ª injeção no mesmo
              esquema. Quanto mais pontos, melhor a calibração.
            </p>

            <div className="space-y-1.5">
              <Label className="flex items-center justify-between text-xs">
                <span>Pico medido (Cmax)</span>
                <span className="text-[10px] text-muted-foreground">
                  ~1 sem após injeção
                </span>
              </Label>
              <Input
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
              <Label className="flex items-center justify-between text-xs">
                <span>Vale medido (Cmin)</span>
                <span className="text-[10px] text-muted-foreground">
                  antes da injeção seguinte
                </span>
              </Label>
              <Input
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
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              2) Cmédia desejada
            </p>
            <Label className="flex items-center justify-between text-xs">
              <span>Cmédia-alvo (ng/dL)</span>
              <span className="text-[10px] text-muted-foreground">
                faixa {EUGONADAL_MIN_NGDL}–{EUGONADAL_MAX_NGDL}
              </span>
            </Label>
            <Input
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
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[400, 500, 600, 700, 800].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    setPacienteIn((p) => ({ ...p, cavgAlvo: String(v) }))
                  }
                  className={`rounded-md border px-2 py-0.5 text-[10px] transition-colors ${
                    pacienteIn.cavgAlvo === String(v)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={calcular}>
            Calcular intervalo ideal
          </Button>

          {erro ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
              {erro}
            </p>
          ) : null}
        </div>

        {/* Resultado */}
        <div className="space-y-4">
          {!recomendacao ? (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-background/60 p-6 text-center text-sm text-muted-foreground">
              <p>
                Preencha os dados à esquerda e clique em{" "}
                <strong className="text-foreground">Calcular intervalo ideal</strong>.
              </p>
              <p className="mt-2 text-xs">
                É necessária pelo menos uma medida laboratorial (pico ou vale).
              </p>
            </div>
          ) : (
            <>
              {/* Recomendação principal */}
              <div className="rounded-lg border border-[color:var(--color-system-body)]/40 bg-[color:var(--color-system-body)]/10 p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Intervalo recomendado
                </div>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="font-serif text-4xl font-medium tabular-nums text-foreground">
                    {(recomendacao.intervaloRecomendadoDias / 7).toFixed(0)}
                  </span>
                  <span className="text-base text-muted-foreground">semanas</span>
                  <span className="text-xs text-muted-foreground">
                    ({recomendacao.intervaloRecomendadoDias} d · dose{" "}
                    {parseFloat(pacienteIn.doseMg)} mg)
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {recomendacao.justificativa}
                </p>

                {(() => {
                  const rec = recomendacao.intervalosAvaliados.find(
                    (a) => a.intervaloDias === recomendacao.intervaloRecomendadoDias,
                  );
                  if (!rec) return null;
                  return (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <MetricSmall label="Pico previsto" value={`${Math.round(rec.cmaxSSNgdl)} ng/dL`} />
                      <MetricSmall label="Vale previsto" value={`${Math.round(rec.cminSSNgdl)} ng/dL`} />
                      <MetricSmall label="Média prevista" value={`${Math.round(rec.cavgSSNgdl)} ng/dL`} />
                      <MetricSmall
                        label="Tempo na faixa"
                        value={`${rec.percentEugonadal.toFixed(0)}%`}
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Perfil individual + cenário atual */}
              <div className="rounded-lg border border-border/70 bg-background/60 p-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Perfil desta pessoa — situação atual
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Calculado a partir das medidas informadas, no regime atual (
                  {parseFloat(pacienteIn.doseMg)} mg a cada{" "}
                  {parseFloat(pacienteIn.intervaloSemanas)} semanas).
                </p>

                <div className="mt-3 flex items-baseline gap-3 rounded-md border border-primary/30 bg-primary/5 p-3">
                  <div className="flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Cmédia atual (calculada)
                    </div>
                    <div className="text-2xl font-semibold tabular-nums text-primary">
                      {Math.round(recomendacao.cenarioAtual.cavgSSNgdl)}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        ng/dL
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">alvo</div>
                    <div className="text-base font-semibold tabular-nums">
                      {Math.round(recomendacao.cavgAlvoNgdl)} ng/dL
                    </div>
                    <div
                      className={`text-[11px] font-medium ${
                        Math.abs(
                          recomendacao.cenarioAtual.cavgSSNgdl -
                            recomendacao.cavgAlvoNgdl,
                        ) < 50
                          ? "text-[color:var(--color-system-body)]"
                          : "text-foreground"
                      }`}
                    >
                      {(() => {
                        const d =
                          recomendacao.cenarioAtual.cavgSSNgdl -
                          recomendacao.cavgAlvoNgdl;
                        if (Math.abs(d) < 50) return "no alvo";
                        return `${d > 0 ? "+" : ""}${Math.round(d)} ng/dL`;
                      })()}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <MetricSmall
                    label="Pico atual"
                    value={`${Math.round(recomendacao.cenarioAtual.cmaxSSNgdl)} ng/dL`}
                  />
                  <MetricSmall
                    label="Vale atual"
                    value={`${Math.round(recomendacao.cenarioAtual.cminSSNgdl)} ng/dL`}
                  />
                  <MetricSmall
                    label="Tempo na faixa"
                    value={`${recomendacao.cenarioAtual.percentEugonadal.toFixed(0)}%`}
                  />
                </div>

                <Separator className="my-3" />

                <div className="text-xs">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Sensibilidade individual à dose
                    </span>
                    <span className="font-mono font-semibold">
                      {(recomendacao.fatorIndividual * 100).toFixed(0)}% da média
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Esta pessoa {recomendacao.classificacaoSensibilidade}. Cada miligrama
                    de undecilato gera{" "}
                    <strong className="text-foreground">
                      {recomendacao.fatorIndividual.toFixed(2)}×
                    </strong>{" "}
                    a concentração que geraria numa pessoa de resposta típica.
                  </p>
                </div>
              </div>

              {/* Comparação de intervalos */}
              <div className="rounded-lg border border-border/70 bg-background/60">
                <div className="px-4 pt-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Comparação de intervalos (para esta pessoa)
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Predição de pico, vale e tempo na faixa eugonádica para diferentes
                    espaçamentos entre doses, mantendo a dose atual.
                  </p>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="p-2 text-left font-medium">Intervalo</th>
                        <th className="p-2 text-right font-medium">Pico</th>
                        <th className="p-2 text-right font-medium">Vale</th>
                        <th className="p-2 text-right font-medium">Média</th>
                        <th className="p-2 text-right font-medium">% faixa</th>
                        <th className="p-2 text-center font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recomendacao.intervalosAvaliados.map((a) => {
                        const eRecomendado =
                          a.intervaloDias === recomendacao.intervaloRecomendadoDias;
                        const statusBadge =
                          a.status === "ideal" ? (
                            <Badge variant="secondary">ideal</Badge>
                          ) : a.status === "aceitavel" ? (
                            <Badge variant="outline">aceitável</Badge>
                          ) : a.status === "vale_baixo" ? (
                            <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300">
                              vale baixo
                            </Badge>
                          ) : a.status === "pico_alto" ? (
                            <Badge variant="destructive">pico alto</Badge>
                          ) : (
                            <Badge variant="destructive">fora</Badge>
                          );
                        return (
                          <tr
                            key={a.intervaloDias}
                            className={`border-t border-border/60 ${
                              eRecomendado ? "bg-[color:var(--color-system-body)]/8" : ""
                            }`}
                          >
                            <td className="p-2 font-medium">
                              {eRecomendado ? (
                                <span className="mr-1 text-[color:var(--color-system-body)]">
                                  →
                                </span>
                              ) : null}
                              {a.intervaloSemanas.toFixed(0)} sem
                            </td>
                            <td
                              className={`p-2 text-right font-mono ${
                                a.cmaxSSNgdl > EUGONADAL_MAX_NGDL
                                  ? "text-destructive"
                                  : ""
                              }`}
                            >
                              {Math.round(a.cmaxSSNgdl)}
                            </td>
                            <td
                              className={`p-2 text-right font-mono ${
                                a.cminSSNgdl < EUGONADAL_MIN_NGDL
                                  ? "text-amber-600 dark:text-amber-400"
                                  : ""
                              }`}
                            >
                              {Math.round(a.cminSSNgdl)}
                            </td>
                            <td className="p-2 text-right font-mono">
                              {Math.round(a.cavgSSNgdl)}
                            </td>
                            <td className="p-2 text-right font-mono">
                              {a.percentEugonadal.toFixed(0)}%
                            </td>
                            <td className="p-2 text-center">{statusBadge}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
                  Faixa eugonádica: {EUGONADAL_MIN_NGDL}–{EUGONADAL_MAX_NGDL} ng/dL
                  (Travison JCEM 2017) · vale ≥ {EUGONADAL_MIN_NGDL} = sem hipogonadismo
                  entre doses.
                </div>
              </div>

              <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                <strong>Importante:</strong> a recomendação assume que as medidas foram
                coletadas em estado estacionário (≥ 4ª–5ª injeção no mesmo esquema).
                Antes disso os valores ainda estão a subir e não reflectem a
                sensibilidade real. Qualquer ajuste deve ser validado com nova análise e
                avaliação clínica.
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricSmall({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-background p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
