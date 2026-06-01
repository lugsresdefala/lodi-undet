import { cn } from "@/lib/utils";

type Props = { className?: string; size?: number };

/**
 * Decorative SVG instrument ring inspired by the L.O.D.I logo:
 * concentric circles, dense tick marks, and a crosshair — the
 * "precision + organic" language of the brand.
 */
export function InstrumentRing({ className, size = 600 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const R1 = size * 0.364;
  const R2 = size * 0.397;
  const R3 = size * 0.430;
  const N = 72; // 5° per tick

  const ticks = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * 2 * Math.PI - Math.PI / 2;
    const major = i % 6 === 0; // long tick every 30°
    const inner = R3 - (major ? size * 0.028 : size * 0.013);
    return {
      x1: cx + R3 * Math.cos(a),
      y1: cy + R3 * Math.sin(a),
      x2: cx + inner * Math.cos(a),
      y2: cy + inner * Math.sin(a),
      major,
    };
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn("pointer-events-none select-none text-foreground", className)}
      aria-hidden
    >
      {/* Crosshair */}
      <line x1={cx} y1={size * 0.04} x2={cx} y2={size * 0.96}
        stroke="currentColor" strokeWidth="0.6" opacity="0.2" />
      <line x1={size * 0.04} y1={cy} x2={size * 0.96} y2={cy}
        stroke="currentColor" strokeWidth="0.6" opacity="0.2" />

      {/* Concentric rings */}
      <circle cx={cx} cy={cy} r={R1}
        fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.14" />
      <circle cx={cx} cy={cy} r={R2}
        fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.17" />
      <circle cx={cx} cy={cy} r={R3}
        fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.25" />

      {/* Tick marks */}
      {ticks.map((t, i) => (
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
      className={cn("pointer-events-none select-none text-current", className)}
      aria-hidden
    >
      <circle cx="5" cy="5" r="3.8" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.5" />
      <circle cx="5" cy="5" r="1.4" fill="currentColor" opacity="0.38" />
    </svg>
  );
}

/**
 * Ring + crosshair dot (14 × 14 viewBox) — system-colour indicator.
 * Pass a CSS variable ref ("var(--color-system-skin)") or "currentColor".
 * Uses inline style so CSS custom properties resolve correctly.
 */
export function SystemRingDot({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 14 14"
      className={cn("pointer-events-none select-none", className)}
      aria-hidden
      style={{ color }}
    >
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="7" y1="1.5" x2="7" y2="12.5" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      <line x1="1.5" y1="7" x2="12.5" y2="7" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      <circle cx="7" cy="7" r="2.1" fill="currentColor" />
    </svg>
  );
}
