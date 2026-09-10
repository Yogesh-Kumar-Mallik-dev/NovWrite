/**
 * @file proseEngine.test.ts
 * @description Unit tests for Prose Studio calculations, word counting, reading speed estimations, and chapter ordering.
 * Block Standard: BLOCK_TEST_PROSE_ENGINE_001
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

function countWords(text: string): number {
  if (!text || typeof text !== "string") return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

function calculateReadingTimeMinutes(
  words: number,
  wordsPerMinute = 200,
): number {
  if (words <= 0) return 0;
  return Math.ceil(words / wordsPerMinute);
}

function calculatePacingScore(wordCount: number, targetCount: number): number {
  if (targetCount <= 0) return 0;
  return Math.min(100, Math.round((wordCount / targetCount) * 100));
}

describe("BLOCK_TEST_PROSE_ENGINE_001: Prose Studio Calculation & Telemetry Engine", () => {
  it("should accurately count words ignoring extra whitespace, newlines and tabs", () => {
    const sample = `   Chapter 1: The   Ascent of\n\nthe Heavenly   Sovereign.\t\tThe wind howled.   `;
    const count = countWords(sample);
    assert.equal(count, 11);
  });

  it("should return 0 words for empty, null, or whitespace-only strings", () => {
    assert.equal(countWords(""), 0);
    assert.equal(countWords("   \n\t  "), 0);
    assert.equal(countWords(null as any), 0);
  });

  it("should calculate reading time correctly using standard 200 wpm cadence", () => {
    assert.equal(calculateReadingTimeMinutes(0), 0);
    assert.equal(calculateReadingTimeMinutes(100), 1);
    assert.equal(calculateReadingTimeMinutes(200), 1);
    assert.equal(calculateReadingTimeMinutes(201), 2);
    assert.equal(calculateReadingTimeMinutes(10000), 50);
  });

  it("should calculate pacing and target milestone completion percentages", () => {
    assert.equal(calculatePacingScore(500, 1000), 50);
    assert.equal(calculatePacingScore(1000, 1000), 100);
    assert.equal(calculatePacingScore(1500, 1000), 100); // capped at 100%
    assert.equal(calculatePacingScore(0, 1500), 0);
  });
});
