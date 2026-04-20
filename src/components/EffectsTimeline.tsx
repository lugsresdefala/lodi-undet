import { useState } from "react";

import { EFFECTS, SYSTEMS, type System } from "@/data/effects";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TIMELINE_MAX_MONTHS = 60;
const TICKS = [0, 6, 12, 24, 36, 48, 60];

export function EffectsTimeline() {
  const [active, setActive] = useState<System | "all">("all");

  const filtered = EFFECTS.filter((e) => active === "all" || e.system === active);

  return (
    <Card className="border-border/70 bg-card/80 p-6 shadow-sm md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-medium tracking-tight md:text-3xl">
            Cronologia clínica esperada
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Janelas aproximadas de início e estabilização. A variação individual é grande.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            label="Tudo"
            active={active === "all"}
            onClick={() => setActive("all")}
          />
          {(Object.keys(SYSTEMS) as System[]).map((s) => (
            <FilterChip
              key={s}
              label={SYSTEMS[s].label}
              color={SYSTEMS[s].tokenVar}
              active={active === s}
              onClick={() => setActive(s)}
            />
          ))}
        </div>
      </div>

      {/* Axis */}
      <div className="grid grid-cols-[180px_1fr] gap-x-4 border-b border-border pb-2 md:grid-cols-[220px_1fr]">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Efeito
        </div>
        <div className="relative h-4">
          {TICKS.map((m) => (
            <div
              key={m}
              className="absolute top-0 -translate-x-1/2 font-mono text-[10px] text-muted-foreground"
              style={{ left: `${(m / TIMELINE_MAX_MONTHS) * 100}%` }}
            >
              {m}m
            </div>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-border">
        {filtered.map((e) => {
          const onsetL = clamp(e.onsetMonths[0]);
          const onsetR = clamp(e.onsetMonths[1]);
          const maxL = clamp(e.maxMonths[0]);
          const maxR = clamp(e.maxMonths[1]);
          return (
            <li
              key={e.id}
              className="grid grid-cols-[180px_1fr] items-center gap-x-4 py-3 md:grid-cols-[220px_1fr]"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{e.title}</div>
                <div
                  className="mt-0.5 inline-block text-[10px] uppercase tracking-[0.16em]"
                  style={{ color: SYSTEMS[e.system].tokenVar }}
                >
                  {SYSTEMS[e.system].label}
                  {!e.reversible && (
                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-muted-foreground">
                      perm.
                    </span>
                  )}
                </div>
              </div>

              <div className="relative h-7">
                {/* base track */}
                <div className="absolute inset-y-3 left-0 right-0 rounded-full bg-muted" />
                {/* onset window — lighter */}
                <div
                  className="absolute inset-y-2 rounded-full opacity-40"
                  style={{
                    left: `${(onsetL / TIMELINE_MAX_MONTHS) * 100}%`,
                    width: `${((onsetR - onsetL) / TIMELINE_MAX_MONTHS) * 100}%`,
                    backgroundColor: SYSTEMS[e.system].tokenVar,
                  }}
                  title={`Início: ${onsetL}–${onsetR} meses`}
                />
                {/* max window — solid */}
                <div
                  className="absolute inset-y-1.5 rounded-full"
                  style={{
                    left: `${(maxL / TIMELINE_MAX_MONTHS) * 100}%`,
                    width: `${((maxR - maxL) / TIMELINE_MAX_MONTHS) * 100}%`,
                    backgroundColor: SYSTEMS[e.system].tokenVar,
                  }}
                  title={`Estabilização: ${maxL}–${maxR} meses`}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
        <LegendSwatch opacity={0.4} label="Janela de início" />
        <LegendSwatch opacity={1} label="Janela de estabilização" />
        <span className="font-mono">perm. = irreversível</span>
      </div>
    </Card>
  );
}

function clamp(m: number) {
  return Math.min(Math.max(m, 0), TIMELINE_MAX_MONTHS);
}

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground",
      )}
    >
      {color && (
        <span
          className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </button>
  );
}

function LegendSwatch({ opacity, label }: { opacity: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-6 rounded-full"
        style={{ backgroundColor: "var(--color-foreground)", opacity }}
      />
      {label}
    </span>
  );
}
