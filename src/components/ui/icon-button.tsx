/**
 * A glyph-only control in a toolbar: shadcn's ghost icon Button under a Tooltip that says its
 * name. The name stays on the button as its aria-label, so assistive tech reads it there; the
 * native title is left off, or a hover would show two tooltips. Needs a TooltipProvider above it.
 */
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { Button, type ButtonProps } from "./button.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.tsx";

export type IconButtonProps = Omit<ButtonProps, "variant" | "size" | "children"> & {
  /** the button's name: its aria-label and its tooltip */
  label: string;
  /** another button variant than ghost (a field face in a bar of fields) */
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  /** where the tooltip opens */
  side?: ComponentProps<typeof TooltipContent>["side"];
  children: ReactNode;
};

export function IconButton({ label, variant = "ghost", size = "icon", side, className, children, ...props }: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={variant} size={size} aria-label={label} className={cn("text-dim hover:text-strong aria-pressed:bg-fill-3 aria-pressed:text-accent aria-expanded:bg-fill-3 aria-expanded:text-strong", className)} {...props}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
