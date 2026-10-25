/**
 * shadcn ToggleGroup on Radix, drawn as the segmented control: a sunken well, the chosen option a
 * raised face in it. For a choice among a few words or glyphs (density, theme, a lens).
 */
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

export function ToggleGroup({ className, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return <ToggleGroupPrimitive.Root data-slot="toggle-group" className={cn("inline-flex w-fit items-center gap-0.5 rounded-[calc(var(--radius-md)+1px)] bg-well p-px shadow-sunken", className)} {...props} />;
}

export const toggleItem = "relative inline-flex h-[calc(var(--control-h)-2px)] min-w-[calc(var(--control-h)-2px)] cursor-pointer select-none items-center justify-center gap-1 whitespace-nowrap rounded-[calc(var(--radius-md)-1px)] px-3 text-sm font-medium text-dim outline-none transition-[background-color,color,box-shadow] duration-150 ease-in-out hover:text-text focus-visible:ring-2 focus-visible:ring-accent/60 coarse:min-w-touch coarse:before:absolute coarse:before:-inset-y-[7px] coarse:before:inset-x-0 coarse:before:content-[''] disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-elevated data-[state=on]:bg-raised data-[state=on]:font-semibold data-[state=on]:text-strong data-[state=on]:shadow-tab data-[state=on]:[text-shadow:0_1px_8px_var(--edge-light-strong)] [&_svg]:size-4 [&_svg]:shrink-0 data-[state=on]:[&_svg]:text-accent";

export function ToggleGroupItem({ className, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return <ToggleGroupPrimitive.Item data-slot="toggle-group-item" className={cn(toggleItem, className)} {...props} />;
}
