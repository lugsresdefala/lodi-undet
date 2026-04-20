import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { EFFECTS, SYSTEMS, type System } from "@/data/effects";
import { cn } from "@/lib/utils";

const SYSTEM_KEYS = Object.keys(SYSTEMS) as System[];

export function EffectCards() {
  const [active, setActive] = useState<System | "all">("all");

  const groups = useMemo(() => {
    if (active === "all") {
      return SYSTEM_KEYS.map((s) => ({
        system: s,
        items: EFFECTS.filter((e) => e.system === s),
      })).filter((g) => g.items.length > 0);
    }
    return [{ system: active, items: EFFECTS.filter((e) => e.system === active) }];
  }, [active]);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-medium tracking-tight md:text-3xl">
            Efeitos por sistema
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Cada card resume o efeito esperado, a janela temporal e a reversibilidade.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActive("all")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              active === "all"
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
          >
            Tudo
          </button>
          {SYSTEM_KEYS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActive(s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                active === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              )}
            >
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                style={{ backgroundColor: SYSTEMS[s].tokenVar }}
              />
              {SYSTEMS[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {groups.map((g) => (
          <div key={g.system}>
            <div className="mb-3 flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: SYSTEMS[g.system].tokenVar }}
              />
              <h3 className="font-serif text-lg font-medium tracking-tight">
                {SYSTEMS[g.system].label}
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {g.items.length} {g.items.length === 1 ? "efeito" : "efeitos"}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((e) => (
                <Card
                  key={e.id}
                  className="group relative overflow-hidden border-border/70 bg-card/80 p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-0.5"
                    style={{ backgroundColor: SYSTEMS[e.system].tokenVar }}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-serif text-base font-medium leading-snug text-foreground">
                      {e.title}
                    </h4>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em]",
                        e.reversible
                          ? "bg-muted text-muted-foreground"
                          : "bg-foreground/90 text-background",
                      )}
                    >
                      {e.reversible ? "rev." : "perm."}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 font-mono text-[11px]">
                    <div>
                      <dt className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                        Início
                      </dt>
                      <dd className="tabular-nums text-foreground">
                        {e.onsetMonths[0]}–{e.onsetMonths[1]} m
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                        Plateau
                      </dt>
                      <dd className="tabular-nums text-foreground">
                        {e.maxMonths[0]}–{e.maxMonths[1]} m
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{e.notes}</p>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
