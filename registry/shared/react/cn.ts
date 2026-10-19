import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Joins class names, and when two Tailwind classes set the same thing (p-2 and
// p-4), keeps the last one.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
