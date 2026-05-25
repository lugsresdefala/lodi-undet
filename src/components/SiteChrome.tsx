import { Link, useRouterState } from "@tanstack/react-router";

const nav = [
  { to: "/calculadora", label: "Calculadora" },
  { to: "/cronologia", label: "Cronologia" },
  { to: "/efeitos", label: "Efeitos" },
] as const;

export function SiteBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-aurora opacity-70" />
      <div className="absolute inset-0 bg-grid-fine opacity-60" />
      <div className="absolute inset-0 bg-noise opacity-[0.18] mix-blend-multiply" />
    </div>
  );
}

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link to="/" className="group flex items-baseline gap-3">
          <span className="font-serif text-xl font-medium tracking-tight">lodi-t</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:inline">
            v2 · referência clínica
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "rounded-full px-3 py-1.5 text-sm transition-colors " +
                  (active
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground")
                }
              >
                {item.label}
              </Link>
            );
          })}
          <span className="mx-2 h-4 w-px bg-border" />
          <Link
            to="/calculadora"
            className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-transform hover:-translate-y-px"
          >
            Abrir simulador
            <span aria-hidden>→</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/70 bg-card/40 backdrop-blur-sm">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-lg font-medium tracking-tight">lodi-t</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              referência
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Página de referência educativa sobre hormonização com testosterona. Sem fim
            comercial.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Responsável
          </p>
          <p className="mt-2 text-foreground">Tiago José de Oliveira Gomes</p>
          <p className="text-muted-foreground">CRM 164375</p>
        </div>
        <div className="text-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Fontes
          </p>
          <p className="mt-2 text-foreground">WPATH SOC-8</p>
          <p className="text-foreground">Endocrine Society 2017</p>
          <a
            href="https://diversidadebarrafunda.org"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            diversidadebarrafunda.org ↗
          </a>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground md:px-8">
          <span>© lodi-t · {new Date().getFullYear()}</span>
          <span>feito com cuidado clínico</span>
        </div>
      </div>
    </footer>
  );
}

export function SectionEyebrow({ n, label }: { n: string; label: string }) {
  return (
    <div className="mb-6 flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
      <span className="text-foreground">{n}</span>
      <span className="h-px w-8 bg-border" />
      <span>{label}</span>
    </div>
  );
}
