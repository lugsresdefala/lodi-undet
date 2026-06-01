import { cn } from "@/lib/utils";

// Computed once at module level — size is always 600 and CSS width/height drive rendering
const CX = 300;
const CY = 300;
const R1 = 218.4;
const R2 = 238.2;
const R3 = 258;
const N = 72; // 5° per tick

const TICKS = Array.from({ length: N }, (_, i) => {
  const a = (i / N) * 2 * Math.PI - Math.PI / 2;
  const major = i % 6 === 0; // long tick every 30°
  const inner = R3 - (major ? 16.8 : 7.8);
  return {
    x1: CX + R3 * Math.cos(a),
    y1: CY + R3 * Math.sin(a),
    x2: CX + inner * Math.cos(a),
    y2: CY + inner * Math.sin(a),
    major,
  };
});

/**
 * Decorative SVG instrument ring inspired by the L.O.D.I logo:
 * concentric circles, dense tick marks, and a crosshair — the
 * "precision + organic" language of the brand.
 */
export function InstrumentRing({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 600"
      className={cn("pointer-events-none select-none text-foreground", className)}
      aria-hidden="true"
    >
      {/* Crosshair */}
      <line x1={CX} y1={24} x2={CX} y2={576}
        stroke="currentColor" strokeWidth="0.6" opacity="0.2" />
      <line x1={24} y1={CY} x2={576} y2={CY}
        stroke="currentColor" strokeWidth="0.6" opacity="0.2" />

      {/* Concentric rings */}
      <circle cx={CX} cy={CY} r={R1}
        fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.14" />
      <circle cx={CX} cy={CY} r={R2}
        fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.17" />
      <circle cx={CX} cy={CY} r={R3}
        fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.25" />

      {/* Tick marks */}
      {TICKS.map((t, i) => (
        <line key={i}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke="currentColor"
          strokeWidth={t.major ? "1.1" : "0.6"}
          opacity={t.major ? "0.34" : "0.18"}
        />
      ))}
    </svg>
  );
}

/** Tiny ring glyph (10 × 10 viewBox) — used as an inline separator/marker. */
export function RingGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 10 10"
      className={cn("pointer-events-none select-none", className)}
      aria-hidden="true"
    >
      <circle cx="5" cy="5" r="3.8" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.5" />
      <circle cx="5" cy="5" r="1.4" fill="currentColor" opacity="0.38" />
    </svg>
  );
}

/**
 * Ring + crosshair dot (14 × 14 viewBox) — system-colour indicator.
 * color: CSS custom-property ref ("var(--color-system-skin)") or "currentColor".
 * Uses inline style so the browser resolves the custom property at paint time.
 */
export function SystemRingDot({
  color,
  className,
}: {
  /** CSS custom-property ref or "currentColor" — e.g. "var(--color-system-skin)". */
  color: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 14 14"
      className={cn("pointer-events-none select-none", className)}
      aria-hidden="true"
      style={{ color }}
    >
      {/* Crosshair rendered before the ring so the ring stroke sits in front at the four cardinal intersections */}
      <line x1="7" y1="1.5" x2="7" y2="12.5" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      <line x1="1.5" y1="7" x2="12.5" y2="7" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="7" r="2.1" fill="currentColor" />
    </svg>
  );
}
