/** shadcn Checkbox on Radix: a small sunken square that fills with the accent and a white tick. */
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";
import { Check } from "../../lib/icons.ts";

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root data-slot="checkbox" className={cn("peer flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm bg-input shadow-[inset_0_0_0_1px_var(--fill-4),0_0_0_1px_var(--ink-1)] outline-none transition-[background-color,box-shadow] duration-150 ease-in-out focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-text data-[state=checked]:shadow-[inset_0_1px_0_var(--edge-light-strong),0_0_0_1px_var(--ink-1)]", className)} {...props}>
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current"><Check className="size-3" stroke={3} /></CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
