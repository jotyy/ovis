/**
 * shadcn NativeSelect: the browser's own <select> on the field surface, a chevron over its end.
 * For the rows the browser regression scripts choose from as a select's (selectOption, option,
 * optgroup, inputValue), which a Radix Select has no equivalent of; the Select component is for
 * every other list.
 */
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";
import { ChevronDown } from "../../lib/icons.ts";
import { fieldSurface } from "./input.tsx";

export const nativeSelect = cn(fieldSurface, "m-0 h-input w-full cursor-pointer appearance-none border-0 px-3 pr-9 font-sans text-field font-regular sm:text-sm coarse:h-touch");

/** `className` sizes the box (the select fills it); `selectClassName` dresses the select itself */
export function NativeSelect({ className, selectClassName, children, ...props }: ComponentProps<"select"> & { selectClassName?: string }) {
  return (
    <span data-slot="native-select" className={cn("relative inline-flex min-w-0", className)}>
      <select className={cn(nativeSelect, selectClassName)} {...props}>{children}</select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-dim" />
    </span>
  );
}
