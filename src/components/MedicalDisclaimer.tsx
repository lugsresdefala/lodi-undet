export function MedicalDisclaimer() {
  return (
    <aside
      role="note"
      aria-label="Aviso"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm leading-relaxed text-foreground"
    >
      <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-destructive">
        <span aria-hidden>●</span> Aviso
      </div>
      <p>
        Esta página é uma <strong>referência educativa</strong>. Não substitui avaliação,
        prescrição ou acompanhamento por profissionais de saúde com experiência em
        cuidados a pessoas trans. O modelo farmacocinético e as janelas temporais aqui
        apresentados são aproximações baseadas em literatura agregada (WPATH SOC-8,
        Endocrine Society 2017) e ignoram variações individuais significativas.
      </p>
    </aside>
  );
}
