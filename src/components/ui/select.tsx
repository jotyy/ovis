/** shadcn Select on Radix: a field that opens the menu surface, the chosen option marked with the accent dot. */
import { Select as SelectPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";
import { Check, ChevronDown, ChevronUp } from "../../lib/icons.ts";
import { fieldSurface } from "./input.tsx";
import { menuSurface } from "./dropdown-menu.tsx";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger data-slot="select-trigger" className={cn(fieldSurface, "group flex h-input w-full cursor-pointer items-center justify-between gap-2 px-3 text-left data-[placeholder]:text-dim data-[state=open]:shadow-focus [&_svg]:shrink-0", className)} {...props}>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <SelectPrimitive.Icon asChild><ChevronDown className="size-4 text-dim transition-transform duration-200 ease-in-out group-data-[state=open]:-rotate-180" /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({ className, children, position = "popper", ...props }: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content data-slot="select-content" position={position} className={cn(menuSurface, "max-h-(--radix-select-content-available-height) origin-(--radix-select-content-transform-origin)", position === "popper" && "w-full min-w-(--radix-select-trigger-width) data-[side=bottom]:translate-y-1.5 data-[side=top]:-translate-y-1.5", className)} {...props}>
        <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center text-dim"><ChevronUp className="size-4" /></SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center text-dim"><ChevronDown className="size-4" /></SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectLabel({ className, ...props }: ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label data-slot="select-label" className={cn("px-2 pt-1 pb-1.5 text-xs font-medium text-dim", className)} {...props} />;
}

export function SelectItem({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item data-slot="select-item" className={cn("relative flex h-control w-full cursor-pointer select-none items-center gap-2 rounded-md pr-2 pl-8 text-sm text-text outline-none transition-colors duration-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-fill-3 data-[highlighted]:text-strong", className)} {...props}>
      <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator><Check className="size-4 text-accent" /></SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export function SelectSeparator({ className, ...props }: ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator data-slot="select-separator" className={cn("-mx-1.5 my-1.5 h-0.5 bg-[image:var(--divider)]", className)} {...props} />;
}
