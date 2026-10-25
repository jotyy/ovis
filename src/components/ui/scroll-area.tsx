/** shadcn ScrollArea on Radix: the thin quiet bar of styles.css, drawn by Radix where the native one cannot be styled. */
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

export function ScrollArea({ className, children, ...props }: ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root data-slot="scroll-area" className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport className="size-full rounded-[inherit] outline-none">{children}</ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

export function ScrollBar({ className, orientation = "vertical", ...props }: ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar data-slot="scroll-area-scrollbar" orientation={orientation} className={cn("flex touch-none select-none p-0.5 transition-colors", orientation === "vertical" ? "h-full w-2" : "h-2 flex-col", className)} {...props}>
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-fill-4 hover:bg-[color-mix(in_srgb,var(--fill-4)_60%,var(--text-dim))]" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}
