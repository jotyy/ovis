/** shadcn Alert as the editor's notice: one sentence and the control that acts on it, on a tinted surface with a drawn hairline edge of its tone (never an outside ring: what stands against it, the chips under a notice, paints over a ring). */
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

export const alertVariants = cva(
  "relative flex w-full items-start gap-3 rounded-lg px-4 py-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "bg-fill-1 text-text border border-border shadow-[inset_0_0_0_1px_var(--edge-light)] [&>svg]:text-dim",
        notice: "bg-[color-mix(in_srgb,var(--notice)_8%,transparent)] text-text border [border-color:color-mix(in_srgb,var(--notice)_40%,transparent)] [&>svg]:text-notice",
        danger: "bg-danger-tint text-danger-text border [border-color:var(--status-blocked)] [&>svg]:text-blocked",
        done: "bg-done-tint text-text border [border-color:color-mix(in_srgb,var(--status-done)_40%,transparent)] [&>svg]:text-done",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Alert({ className, tone, ...props }: ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ tone }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="alert-title" className={cn("font-medium text-strong", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("text-dim [&_p]:m-0", className)} {...props} />;
}
