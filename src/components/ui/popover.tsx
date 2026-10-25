/** shadcn Popover on Radix, on the menu surface. */
import { Popover as PopoverPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";
import { menuSurface } from "./dropdown-menu.tsx";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export function PopoverContent({ className, align = "center", sideOffset = 6, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content data-slot="popover-content" align={align} sideOffset={sideOffset} className={cn(menuSurface, "w-72 origin-(--radix-popover-content-transform-origin) p-4", className)} {...props} />
    </PopoverPrimitive.Portal>
  );
}
