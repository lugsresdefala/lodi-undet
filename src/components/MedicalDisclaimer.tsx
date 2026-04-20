export function MedicalDisclaimer() {
  return (
    <aside
      role="note"
      aria-label="Aviso clínico"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm leading-relaxed text-foreground"
    >
      <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-destructive">
        <span aria-hidden>●</span> Aviso clínico
      </div>
      <p>
        Esta página é uma <strong>ferramenta educativa</strong>. Não substitui
        avaliação, prescrição ou seguimento por profissionais de saúde com experiência em
        cuidados a pessoas trans. Os modelos farmacocinéticos e janelas temporais aqui
        apresentados são aproximações baseadas em literatura agregada (WPATH SOC-8,
        Endocrine Society 2017) e ignoram variações individuais significativas.
      </p>
      <p className="mt-2 text-muted-foreground">
        Em caso de crise emocional, contacta a linha SOS Saúde Mental{" "}
        <a className="underline underline-offset-2" href="tel:+351808242424">
          808 24 24 24
        </a>
        .
      </p>
    </aside>
  );
}
