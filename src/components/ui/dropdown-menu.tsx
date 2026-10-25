/** shadcn DropdownMenu on Radix: glass a step above its panel under a deep shadow, items on a fill of light. */
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";
import { Check, ChevronRight } from "../../lib/icons.ts";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const menuSurface = "z-30 min-w-[180px] overflow-x-hidden overflow-y-auto rounded-lg bg-[color-mix(in_srgb,var(--bg-elevated)_92%,transparent)] p-1.5 text-text shadow-popover backdrop-popover outline-none data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out";

export const menuItem = "relative flex h-control cursor-pointer select-none items-center gap-2 rounded-md px-2 text-sm text-text outline-none transition-colors duration-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-fill-3 data-[highlighted]:text-strong [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-dim data-[highlighted]:[&_svg]:text-text";

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content data-slot="dropdown-menu-content" sideOffset={sideOffset} className={cn(menuSurface, "max-h-(--radix-dropdown-menu-content-available-height) origin-(--radix-dropdown-menu-content-transform-origin)", className)} {...props} />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, variant = "default", inset, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Item> & { variant?: "default" | "destructive"; inset?: boolean }) {
  return <DropdownMenuPrimitive.Item data-slot="dropdown-menu-item" data-variant={variant} className={cn(menuItem, inset && "pl-8", variant === "destructive" && "text-danger-text data-[highlighted]:bg-danger-tint data-[highlighted]:text-danger-text [&_svg]:text-danger-text", className)} {...props} />;
}

export function DropdownMenuCheckboxItem({ className, children, checked, ...props }: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem data-slot="dropdown-menu-checkbox-item" className={cn(menuItem, "pl-8", className)} checked={checked} {...props}>
      <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center rounded-sm shadow-[inset_0_0_0_1px_var(--fill-4)]">
        <DropdownMenuPrimitive.ItemIndicator className="flex size-4 items-center justify-center rounded-sm bg-primary text-primary-text shadow-[inset_0_1px_0_var(--edge-light-strong)]"><Check className="size-3!" stroke={2.5} /></DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

export function DropdownMenuRadioItem({ className, children, ...props }: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem data-slot="dropdown-menu-radio-item" className={cn(menuItem, "pl-8", className)} {...props}>
      <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator><span className="block size-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" /></DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

export function DropdownMenuLabel({ className, inset, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }) {
  return <DropdownMenuPrimitive.Label data-slot="dropdown-menu-label" className={cn("px-2 pt-1 pb-1.5 text-xs font-medium text-dim", inset && "pl-8", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator data-slot="dropdown-menu-separator" className={cn("-mx-1.5 my-1.5 h-0.5 bg-[image:var(--divider)]", className)} {...props} />;
}

export function DropdownMenuShortcut({ className, ...props }: ComponentProps<"span">) {
  return <span data-slot="dropdown-menu-shortcut" className={cn("ml-auto text-xs text-dim", className)} {...props} />;
}

export function DropdownMenuSubTrigger({ className, children, inset, ...props }: ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.SubTrigger data-slot="dropdown-menu-sub-trigger" className={cn(menuItem, "data-[state=open]:bg-fill-3", inset && "pl-8", className)} {...props}>
      {children}
      <ChevronRight className="ml-auto text-dim" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

export function DropdownMenuSubContent({ className, ...props }: ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent data-slot="dropdown-menu-sub-content" className={cn(menuSurface, "origin-(--radix-dropdown-menu-content-transform-origin)", className)} {...props} />
    </DropdownMenuPrimitive.Portal>
  );
}
