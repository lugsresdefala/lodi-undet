/**
 * Utilitários de exportação de resultados do simulador PK.
 * Formatos suportados: JSON estruturado e CSV da série temporal.
 */

import { MODEL_VERSION, type PkMetrics, type PkParams, type PkSeriesPoint } from "./pk";

// ── Tipos de exportação ──────────────────────────────────────────────────────

export interface ExportMetadata {
  tool: "lodi-t";
  modelVersion: string;
  exportedAt: string;
  disclaimer: string;
}

export interface ExportData {
  metadata: ExportMetadata;
  params: PkParams;
  metrics: PkMetrics;
  /** Incluso apenas se solicitado (pode ser omitido para reduzir tamanho). */
  series?: PkSeriesPoint[];
}

// ── Criação de metadados ─────────────────────────────────────────────────────

export function createExportMetadata(): ExportMetadata {
  return {
    tool: "lodi-t",
    modelVersion: MODEL_VERSION,
    exportedAt: new Date().toISOString(),
    disclaimer:
      "Resultado de simulação educativa. Não constitui prescrição, orientação posológica nem diagnóstico médico. Gerado por lodi-t (https://lodi-undet.lovable.app).",
  };
}

// ── Serialização ─────────────────────────────────────────────────────────────

/**
 * Serializa os dados de exportação para JSON formatado.
 */
export function serializeToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Serializa a série temporal para CSV.
 * Colunas: dia, concentracao_ngdl, concentracao_nmolL, marcador_dose
 */
export function serializeSeriesToCSV(series: PkSeriesPoint[]): string {
  const MW_T = 288.43; // g/mol
  const header = "dia,concentracao_ngdl,concentracao_nmolL,marcador_dose";
  const rows = series.map((pt) => {
    const nmol = ((pt.concentration * 10) / MW_T).toFixed(3);
    return `${pt.day},${pt.concentration.toFixed(2)},${nmol},${pt.doseMarker ? "1" : "0"}`;
  });
  return [header, ...rows].join("\n");
}

/**
 * Serializa as métricas para CSV de uma linha.
 */
export function serializeMetricsToCSV(metrics: PkMetrics, params: PkParams): string {
  const MW_T = 288.43;
  const toNmol = (v: number) => ((v * 10) / MW_T).toFixed(3);
  const header =
    "dose_mg,intervalo_dias,peso_kg,cmax_ngdl,cmax_nmolL,dia_cmax,ctrough_ngdl,ctrough_nmolL,dia_ctrough,cmean_ngdl,cmean_nmolL,no_intervalo_referencia";
  const row = [
    params.doseMg,
    params.intervalDays,
    params.weightKg,
    metrics.cmax.toFixed(1),
    toNmol(metrics.cmax),
    metrics.cmaxDay,
    metrics.ctrough.toFixed(1),
    toNmol(metrics.ctrough),
    metrics.ctroughDay,
    metrics.cmean.toFixed(1),
    toNmol(metrics.cmean),
    metrics.inRange ? "sim" : "não",
  ].join(",");
  return [header, row].join("\n");
}

// ── Download no navegador ─────────────────────────────────────────────────────

/**
 * Inicia o download de um ficheiro de texto no navegador.
 * Compatível com todos os browsers modernos.
 */
export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Gera um nome de ficheiro com timestamp para exportação.
 * Exemplo: "lodi-t_simulacao_2025-05-16T14-30.json"
 */
export function generateFilename(ext: "json" | "csv"): string {
  const ts = new Date().toISOString().slice(0, 16).replace(":", "-");
  return `lodi-t_simulacao_${ts}.${ext}`;
}
