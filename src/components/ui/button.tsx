/**
 * shadcn Button, in the editor's variants (components/_ui/button.tsx of
 * github.com/kargulstudio/workflow-editor, adapted: the tokens of styles.css for its literals).
 * Every variant is a surface: a ring of shadow outside, a pixel of light inside its top edge,
 * its words set into it. Always pass a variant.
 */
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

export const buttonVariants = cva(
  "group inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium outline-none transition-[background-color,color,box-shadow,opacity] duration-150 ease-in-out focus-visible:ring-2 focus-visible:ring-accent/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** the editor's toolbar button: a field-like face */
        field: "bg-elevated text-text shadow-surface text-engraved hover:bg-hover hover:text-strong active:bg-[color-mix(in_srgb,var(--bg-elevated)_80%,var(--bg))] [&_svg]:text-dim hover:[&_svg]:text-text",
        /** the one accent action on a surface: lit from above, a glow of its own colour */
        accent: "bg-primary bg-primary-sheen text-primary-text shadow-primary text-engraved hover:bg-primary-hover active:bg-[color-mix(in_srgb,var(--primary)_88%,black)]",
        /** a raised face in a gradient, the chosen nav row's and a card's own button */
        raised: "bg-elevated bg-raised text-strong shadow-raised hover:brightness-110 disabled:text-dim",
        /** no box at rest, a fill of light under the pointer */
        ghost: "bg-transparent text-text hover:bg-fill-2 active:bg-fill-3",
        /** a quiet word in a path (a breadcrumb) */
        crumb: "rounded-sm font-regular text-dim text-engraved hover:text-text",
        /** a destructive action: neutral until hovered, then its tint and ring */
        danger: "bg-danger-tint text-danger-text shadow-[0_0_0_1px_var(--status-blocked)] hover:shadow-[0_0_0_1px_var(--status-blocked),inset_0_0_0_1px_var(--status-blocked)]",
        /** the editor's pill buttons (a marketing page's): bold words on the ink */
        primary: "rounded-full bg-strong text-bg font-bold transition-[scale] active:scale-[0.98]",
        secondary: "rounded-full font-bold shadow-[inset_0_0_0_2px_var(--text-strong)] transition-[scale] active:scale-[0.98]",
        bare: "",
      },
      size: {
        xs: "h-6 px-2 text-xs",
        sm: "h-control px-3 text-sm coarse:h-touch",
        md: "h-input px-4 text-sm coarse:h-touch",
        lg: "h-10 px-5 text-md coarse:h-touch",
        /** a glyph alone, a square the control's size; on a touch screen a finger's square */
        icon: "size-control [&_svg]:size-icon coarse:size-touch",
        /** a small glyph in a dense row: its box stays, an invisible expander reaches the finger's target */
        "icon-sm": "relative size-6 [&_svg]:size-4 coarse:before:absolute coarse:before:-inset-2.5 coarse:before:content-['']",
        "icon-lg": "size-9 [&_svg]:size-5 coarse:size-touch",
        /** the editor's field button: a glyph with a word, tighter on the glyph's side */
        field: "h-control gap-2 pl-1.5 pr-2 text-sm [&_svg]:size-[18px] coarse:h-touch",
        block: "h-input w-full gap-2 px-2 text-sm [&_svg]:size-[18px] coarse:h-touch",
        bare: "",
      },
    },
    defaultVariants: { variant: "field", size: "sm" },
  },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants> & {
  /** render the child element with the button's classes (a link, a menu trigger) */
  asChild?: boolean;
};

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" type={asChild ? undefined : (type ?? "button")} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
