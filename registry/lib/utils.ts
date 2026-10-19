/**
 * Stand-in for the `@/lib/utils` module shadcn-style projects have.
 *
 * The v7 Tailwind templates on `main` import `cn` from "@/lib/utils"; inside
 * this repo, registry/tsconfig.json maps `@/*` to `./*`, so it resolves here
 * for the registry typecheck. The v8 templates import the `cn` shared piece
 * (`~shared/react/cn`) instead, which `sublay add` installs with them, so
 * nothing on `v8` uses this file: delete it at graduation. No registry.json
 * lists it, so `sublay add` never copies it.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
