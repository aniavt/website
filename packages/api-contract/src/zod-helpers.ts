import { z } from "zod";

/** Non-empty trimmed string with a max length. */
export function nonEmptyMax(max: number) {
  return z.string().min(1).max(max);
}

export const urlString = z.string().max(2048);

export const hexColor = z
  .string()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
