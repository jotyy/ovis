/** shadcn's class joiner: clsx for the conditionals, tailwind-merge so a caller's utility wins over a variant's. */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
