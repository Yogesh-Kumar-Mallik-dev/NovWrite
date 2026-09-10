/**
 * @file proseEngine.ts
 * @description Pure functions for Prose Studio manuscript calculation, word counting, reading speed estimations, and pacing telemetry.
 * Block Standard: BLOCK_PROSE_ENGINE_001
 */

/**
 * Accurately counts words in a prose string, ignoring extraneous whitespace, newlines, and tabs.
 */
export function countWords(text: string | null | undefined): number {
  if (!text || typeof text !== "string") return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Calculates estimated reading time in minutes using standard reading cadence.
 * @param words Total word count.
 * @param wordsPerMinute Average reading speed (defaults to standard 200 WPM).
 */
export function calculateReadingTimeMinutes(
  words: number,
  wordsPerMinute = 200,
): number {
  if (words <= 0) return 0;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Calculates pacing score percentage relative to a target milestone word count.
 * Clamped between 0 and 100%.
 */
export function calculatePacingScore(
  wordCount: number,
  targetCount: number,
): number {
  if (targetCount <= 0) return 0;
  return Math.min(100, Math.round((wordCount / targetCount) * 100));
}
