import { Card } from "@/components/ui/card";
import { SUPPORT_ORGS } from "@/data/support";

export function SupportNetwork() {
  return (
    <section>
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-medium tracking-tight md:text-3xl">
          Rede de apoio
        </h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Organizações comunitárias, linhas de escuta e serviços de saúde em Portugal.
          Confirma sempre os contactos antes de procurar atendimento.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SUPPORT_ORGS.map((o) => (
          <a
            key={o.name}
            href={o.url}
            target={o.url.startsWith("http") ? "_blank" : undefined}
            rel={o.url.startsWith("http") ? "noreferrer noopener" : undefined}
            className="group block focus:outline-none"
          >
            <Card className="h-full border-border/70 bg-card/80 p-5 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:border-foreground/40 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <span>{o.category}</span>
                <span>{o.region}</span>
              </div>
              <h3 className="mt-2 font-serif text-lg font-medium leading-snug text-foreground">
                {o.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {o.description}
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-foreground">
                Aceder
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
            </Card>
          </a>
        ))}
      </div>
    </section>
  );
}
