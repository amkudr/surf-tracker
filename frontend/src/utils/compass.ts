const COMPASS_TO_DEGREES: Record<string, number> = {
  // 16-point compass (also covers 8-point values)
  N: 0,
  NNE: 22.5,
  NE: 45,
  ENE: 67.5,
  E: 90,
  ESE: 112.5,
  SE: 135,
  SSE: 157.5,
  S: 180,
  SSW: 202.5,
  SW: 225,
  WSW: 247.5,
  W: 270,
  WNW: 292.5,
  NW: 315,
  NNW: 337.5,
};

/**
 * Maps compass letter(s) (N, NE, E, SE, S, SW, W, NW) to degrees (0-315).
 * Accepts legacy numeric strings (e.g. "180") and returns them as degrees.
 * Returns undefined for empty or unknown values.
 */
export function compassLetterToDegrees(value: string | undefined | null): number | undefined {
  if (value == null || value === '') return undefined;
  // Remove arrows, degree symbols, spaces, etc., keeping only letters/numbers
  const normalized = value.toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (COMPASS_TO_DEGREES[normalized] !== undefined) return COMPASS_TO_DEGREES[normalized];

  // Accept numeric degrees (e.g. "180" or "225.5")
  const n = Number(normalized);
  if (!Number.isNaN(n) && n >= 0 && n < 360) return n;
  return undefined;
}
