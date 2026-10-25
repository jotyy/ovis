/**
 * shadcn Badge as the editor's Tag: a small raised chip with a sheen down it, 12/550, its words
 * in the tone's colour with a glow of the colour under them. The agent states take their tones.
 */
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

export const badgeVariants = cva(
  "relative inline-flex h-6 shrink-0 items-center gap-1 overflow-clip whitespace-nowrap rounded-md bg-sheen px-1.5 text-xs font-medium tabular-nums shadow-chip [text-shadow:var(--text-shadow-engraved),0_4px_6px_color-mix(in_srgb,currentColor_40%,transparent)] [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "bg-fill-2 text-text [text-shadow:var(--text-shadow-engraved)]",
        accent: "bg-accent-tint text-accent",
        working: "bg-working-tint text-working",
        blocked: "bg-blocked-tint text-blocked",
        done: "bg-done-tint text-done",
        notice: "bg-[color-mix(in_srgb,var(--notice)_10%,transparent)] text-notice",
        idle: "bg-fill-2 text-dim [text-shadow:var(--text-shadow-engraved)]",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({ className, tone, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />;
}
