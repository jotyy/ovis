/** shadcn RadioGroup on Radix: a sunken ring, the chosen one lit by an accent dot. */
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

export function RadioGroup({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("grid gap-2", className)} {...props} />;
}

export function RadioGroupItem({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item data-slot="radio-group-item" className={cn("flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full bg-input shadow-[inset_0_0_0_1px_var(--fill-4),0_0_0_1px_var(--ink-1)] outline-none transition-[box-shadow] duration-150 ease-in-out focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:shadow-[inset_0_0_0_1px_var(--accent),0_0_0_1px_var(--ink-1)]", className)} {...props}>
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center"><span className="block size-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" /></RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}
