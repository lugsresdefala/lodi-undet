import {
  createExportMetadata,
  downloadTextFile,
  generateFilename,
  serializeMetricsToCSV,
  serializeSeriesToCSV,
  serializeToJSON,
  type ExportData,
} from "@/lib/export";
import type { PkMetrics, PkParams, PkSeriesPoint } from "@/lib/pk";

interface ExportButtonProps {
  params: PkParams;
  metrics: PkMetrics;
  series: PkSeriesPoint[];
}

export function ExportButton({ params, metrics, series }: ExportButtonProps) {
  const handleJSON = () => {
    const data: ExportData = {
      metadata: createExportMetadata(),
      params,
      metrics,
      series,
    };
    downloadTextFile(serializeToJSON(data), generateFilename("json"), "application/json");
  };

  const handleCSVSeries = () => {
    downloadTextFile(serializeSeriesToCSV(series), generateFilename("csv"), "text/csv");
  };

  const handleCSVMetrics = () => {
    const ts = new Date().toISOString().slice(0, 16).replace(":", "-");
    downloadTextFile(
      serializeMetricsToCSV(metrics, params),
      `lodi-t_metricas_${ts}.csv`,
      "text/csv",
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        Exportar —
      </span>
      <button
        type="button"
        onClick={handleJSON}
        title="Exportar todos os dados (parâmetros, métricas e série temporal) em JSON"
        className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
      >
        JSON
      </button>
      <button
        type="button"
        onClick={handleCSVSeries}
        title="Exportar a série temporal (concentração por dia) em CSV"
        className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
      >
        CSV — série
      </button>
      <button
        type="button"
        onClick={handleCSVMetrics}
        title="Exportar apenas as métricas (Cmax, Ctrough, Cmédia) em CSV"
        className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
      >
        CSV — métricas
      </button>
    </div>
  );
}
