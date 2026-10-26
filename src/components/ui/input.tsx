/**
 * shadcn Input and Textarea, as the editor's fields: a shallow well with a ring, a breath lighter
 * than its panel at rest, the accent inside its edge with a halo outside when focused. The Field
 * wrapper sets a label (12/500, dim) over it and a hint under it.
 */
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export const fieldSurface = "rounded-md bg-input text-sm text-strong shadow-surface outline-none transition-[box-shadow,background-color] duration-150 ease-in-out placeholder:text-dim hover:not-focus-visible:bg-[color-mix(in_srgb,var(--bg-input)_70%,var(--bg-hover))] focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input data-slot="input" className={cn(fieldSurface, "h-input w-full px-3 text-field tabular-nums sm:text-sm", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(fieldSurface, "min-h-[120px] w-full resize-none rounded-lg px-3 py-1.5 text-field sm:text-sm", className)} {...props} />;
}

export function Field({ label, htmlFor, hint, action, className, children }: { label: ReactNode; htmlFor?: string; hint?: ReactNode; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div data-slot="field" className={cn("flex w-full flex-col gap-1", className)}>
      <div className="flex h-6 items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-xs font-medium text-dim">{label}</label>
        {action}
      </div>
      {children}
      {hint && <span className="text-xs leading-4 text-dim">{hint}</span>}
    </div>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label data-slot="label" className={cn("text-xs font-medium text-dim select-none", className)} {...props} />;
}
