/** A keyboard key: a small raised cap, its bottom edge a shade deeper. */
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return <kbd data-slot="kbd" className={cn("inline-flex h-[18px] items-center rounded-sm bg-fill-2 px-[5px] font-mono text-2xs leading-none text-dim shadow-[0_0_0_1px_var(--ink-2),inset_0_-1px_0_var(--ink-2),inset_0_1px_0_var(--edge-light)]", className)} {...props} />;
}
