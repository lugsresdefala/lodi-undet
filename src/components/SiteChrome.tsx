import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import lodiLogo from "@/assets/lodi-logo.png";

const nav = [
  { to: "/calculadora", label: "Calculadora" },
  { to: "/cronologia", label: "Cronologia" },
  { to: "/efeitos", label: "Efeitos" },
  { to: "/sobre", label: "Sobre" },
  { to: "/api-docs", label: "API" },
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
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8 md:py-4">
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="group flex min-w-0 items-center gap-2 md:gap-3"
        >
          <img
            src={lodiLogo}
            alt="lodi-t"
            className="h-9 w-9 shrink-0 select-none object-contain md:h-10 md:w-10"
            draggable={false}
          />

          <span className="whitespace-nowrap font-serif text-lg font-medium tracking-tight md:text-xl">
            lodi-t
          </span>
          <span className="hidden whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground xl:inline">
            v2 · referência clínica
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
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

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/60 text-foreground transition-colors hover:border-foreground/30 md:hidden"
        >
          <span className="relative block h-3.5 w-4">
            <span
              className={
                "absolute left-0 top-0 h-px w-full bg-current transition-transform " +
                (open ? "translate-y-[7px] rotate-45" : "")
              }
            />
            <span
              className={
                "absolute left-0 top-[7px] h-px w-full bg-current transition-opacity " +
                (open ? "opacity-0" : "opacity-100")
              }
            />
            <span
              className={
                "absolute left-0 top-[14px] h-px w-full bg-current transition-transform " +
                (open ? "-translate-y-[7px] -rotate-45" : "")
              }
            />
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-nav"
        className={
          "overflow-hidden border-t border-border/60 md:hidden " +
          (open ? "max-h-[80vh]" : "max-h-0")
        }
        style={{ transition: "max-height 240ms ease" }}
      >
        <nav className="flex flex-col gap-1 px-4 py-4">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={
                  "rounded-xl px-3 py-2.5 text-sm transition-colors " +
                  (active
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground")
                }
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            to="/calculadora"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background"
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
