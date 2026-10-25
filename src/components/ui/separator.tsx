/** shadcn Separator as the editor's Divider: etched, a dark line and the light that falls past it, never a drawn rule. */
import { Separator as SeparatorPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

export function Separator({ className, orientation = "horizontal", decorative = true, ...props }: ComponentProps<typeof SeparatorPrimitive.Root>) {
  return <SeparatorPrimitive.Root data-slot="separator" decorative={decorative} orientation={orientation} className={cn("shrink-0 bg-[image:var(--divider)]", orientation === "horizontal" ? "h-0.5 w-full" : "h-full w-0.5 bg-[image:linear-gradient(to_right,var(--ink-3)_0,var(--ink-3)_1px,var(--edge-light)_1px)]", className)} {...props} />;
}
