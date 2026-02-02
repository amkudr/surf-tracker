const COMPASS_TO_DEGREES: Record<string, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
};

/**
 * Maps compass letter(s) (N, NE, E, SE, S, SW, W, NW) to degrees (0–315).
 * Accepts legacy numeric strings (e.g. "180") and returns them as degrees.
 * Returns undefined for empty or unknown values.
 */
export function compassLetterToDegrees(value: string | undefined | null): number | undefined {
  if (value == null || value === '') return undefined;
  const normalized = value.toString().trim().toUpperCase();
  if (COMPASS_TO_DEGREES[normalized] !== undefined) return COMPASS_TO_DEGREES[normalized];
  const n = Number(normalized);
  if (!Number.isNaN(n) && n >= 0 && n < 360) return n;
  return undefined;
}
