/**
 * shadcn Tabs on Radix, drawn as the editor's segmented tabs: a sunken well, the chosen tab a
 * raised face in it, the others quiet words. Also the lens switch and every segmented choice.
 */
import { Tabs as TabsPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn("inline-flex w-fit items-center gap-0.5 rounded-[calc(var(--radius-md)+1px)] bg-well p-px shadow-sunken", className)} {...props} />;
}

export const tabTrigger = "relative inline-flex h-[calc(var(--control-h)-2px)] cursor-pointer select-none items-center justify-center gap-1 whitespace-nowrap rounded-[calc(var(--radius-md)-1px)] px-3 text-sm font-medium text-dim outline-none transition-[background-color,color,box-shadow] duration-150 ease-in-out hover:text-text focus-visible:ring-2 focus-visible:ring-accent/60 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-elevated data-[state=active]:bg-raised data-[state=active]:font-semibold data-[state=active]:text-strong data-[state=active]:shadow-tab data-[state=active]:[text-shadow:0_1px_8px_var(--edge-light-strong)] [&_svg]:size-[15px] [&_svg]:shrink-0 data-[state=active]:[&_svg]:text-accent";

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return <TabsPrimitive.Trigger data-slot="tabs-trigger" className={cn(tabTrigger, className)} {...props} />;
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />;
}
