import { randomBytes } from "node:crypto";

/**
 * Generate a short, URL-safe unique ID.
 * Format: prefix_<12 random hex chars>
 */
export function generateId(prefix: string = "alp"): string {
  const hex = randomBytes(6).toString("hex");
  return `${prefix}_${hex}`;
}
