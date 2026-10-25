/** shadcn Tooltip on Radix: a small dark card, 12px/500, that fades and grows in after a short wait. */
import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

export function TooltipProvider({ delayDuration = 400, skipDelayDuration = 300, ...props }: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} skipDelayDuration={skipDelayDuration} {...props} />;
}

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ className, sideOffset = 8, children, ...props }: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content data-slot="tooltip-content" sideOffset={sideOffset} className={cn("z-40 w-fit max-w-[280px] origin-(--radix-tooltip-content-transform-origin) rounded-md bg-hover px-2 py-1 text-xs font-medium text-strong shadow-tooltip data-[state=delayed-open]:animate-pop-in data-[state=closed]:animate-pop-out", className)} {...props}>
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
