import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[linear-gradient(to_right,color-mix(in_oklab,var(--color-chart-2)_25%,transparent),color-mix(in_oklab,var(--color-chart-3)_22%,transparent),color-mix(in_oklab,var(--color-chart-1)_28%,transparent))] shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]">
      <SliderPrimitive.Range className="absolute h-full bg-[linear-gradient(to_right,var(--color-chart-2),var(--color-chart-3),var(--color-chart-1))] shadow-[0_0_8px_color-mix(in_oklab,var(--color-chart-1)_45%,transparent)]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border border-border/70 bg-[radial-gradient(circle_at_30%_30%,var(--color-background),color-mix(in_oklab,var(--color-chart-1)_18%,var(--color-background)))] shadow-[0_2px_4px_rgba(0,0,0,0.12),0_0_0_1px_color-mix(in_oklab,var(--color-chart-1)_30%,transparent),inset_0_1px_0_rgba(255,255,255,0.6)] transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-chart-1)]/50 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
