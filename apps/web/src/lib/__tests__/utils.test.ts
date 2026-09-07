/**
 * @file utils.test.ts
 * @description Unit tests for frontend UI class merging utility.
 * Block Standard: BLOCK_TEST_WEB_UTILS_001
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cn } from "../utils.ts";

describe("BLOCK_TEST_WEB_UTILS_001: Frontend Class Utility", () => {
  it("should merge tailwind class names and resolve conflicts", () => {
    const result = cn("px-2 py-1 bg-red-500", "px-4 bg-blue-500");
    assert.strictEqual(result, "py-1 px-4 bg-blue-500");
  });

  it("should handle conditional and falsy values cleanly", () => {
    const isHidden = false;
    const isPrimary = true;
    const result = cn(
      "base-btn",
      isHidden && "hidden",
      isPrimary ? "btn-primary" : "btn-secondary",
      null,
      undefined,
    );
    assert.strictEqual(result, "base-btn btn-primary");
  });
});
