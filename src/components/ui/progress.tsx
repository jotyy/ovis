/** shadcn Progress on Radix: a sunken track, the value a bar of the given tone with a light edge. */
import { Progress as ProgressPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

export function Progress({ className, value, indicatorClassName, ...props }: ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  return (
    <ProgressPrimitive.Root data-slot="progress" className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-well shadow-[inset_0_1px_1px_var(--ink-2)]", className)} {...props}>
      <ProgressPrimitive.Indicator data-slot="progress-indicator" className={cn("h-full w-full flex-1 rounded-full bg-accent shadow-[inset_0_1px_0_var(--edge-light-strong)] transition-transform duration-300 ease-out", indicatorClassName)} style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }} />
    </ProgressPrimitive.Root>
  );
}
