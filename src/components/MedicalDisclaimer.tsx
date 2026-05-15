export function MedicalDisclaimer() {
  return (
    <aside
      role="note"
      aria-label="Nota"
      className="rounded-xl border border-border bg-muted/40 p-5 text-sm leading-relaxed text-foreground"
    >
      <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span aria-hidden>●</span> Nota
      </div>
      <p>
        Página de <strong>referência educativa</strong>, complementar — e não substituta — do
        acompanhamento clínico. As janelas temporais e o modelo farmacocinético são
        aproximações baseadas em literatura agregada (WPATH SOC-8, Endocrine Society
        2017); a variação individual é grande. Os efeitos descritos não são
        intrinsecamente bons ou maus: o significado de cada um depende dos objetivos
        e expectativas de cada pessoa.
      </p>
    </aside>
  );
}
