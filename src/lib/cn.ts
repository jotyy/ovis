/**
 * shadcn's class joiner: clsx for the conditionals, tailwind-merge so a caller's utility wins over
 * a variant's. The merge is taught the token colours of src/tailwind.css and no other: by default
 * it takes any `bg-…`, `text-…` or `border-…` for a colour utility, so a legacy class such as
 * `bg-tasks` or `text-engraved` passed as className would knock the variant's `bg-elevated` out.
 */
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const COLORS = [
  "transparent", "current", "bg", "panel", "elevated", "hover", "input", "well", "border", "border-strong", "text", "dim", "strong",
  "accent", "accent-tint", "primary", "primary-hover", "primary-text", "primary-tint", "idle", "working", "blocked", "done",
  "working-tint", "blocked-tint", "done-tint", "danger-tint", "danger-text", "notice", "scrim", "fill-1", "fill-2", "fill-3", "fill-4",
  "ink-1", "ink-2", "ink-3", "edge",
];

const twMerge = extendTailwindMerge({ override: { theme: { color: COLORS } } });

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
