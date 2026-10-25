/** shadcn Switch on Radix: a sunken track that takes the accent when on, a white thumb with its own shadow. */
import { Switch as SwitchPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root data-slot="switch" className={cn("peer coarse:before:absolute coarse:before:-inset-3 coarse:before:content-[''] relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-well p-0.5 shadow-sunken transition-colors duration-150 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary", className)} {...props}>
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className="pointer-events-none block size-4 rounded-full bg-thumb shadow-[0_1px_2px_var(--ink-3),inset_0_-1px_0_var(--ink-1)] transition-transform duration-200 ease-smooth data-[state=checked]:translate-x-4 motion-reduce:transition-none" />
    </SwitchPrimitive.Root>
  );
}
