/**
 * @file projectEngine.test.ts
 * @description Unit tests for project validation, ID generation, and scaffolding.
 * Block Standard: BLOCK_TEST_WEB_PROJECT_ENGINE_001
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateProjectInput, generateProjectId } from "../projectEngine.ts";

describe("BLOCK_TEST_WEB_PROJECT_ENGINE_001: Novel Project Validation and Scaffolding Engine", () => {
  it("should validate and sanitize valid project inputs", () => {
    const res = validateProjectInput({
      name: "  The Heavenly Sword Realm  ",
      genre: "  Xianxia / Cultivation  ",
      description: "  A grand realm of ancient daoists and flying immortals.  ",
    });

    assert.equal(res.valid, true);
    assert.deepEqual(res.errors, {});
    assert.ok(res.sanitized);
    assert.equal(res.sanitized.name, "The Heavenly Sword Realm");
    assert.equal(res.sanitized.genre, "Xianxia / Cultivation");
    assert.equal(
      res.sanitized.description,
      "A grand realm of ancient daoists and flying immortals.",
    );
  });

  it("should reject empty project name with clear error message", () => {
    const res = validateProjectInput({
      name: "   ",
      genre: "Fantasy",
    });

    assert.equal(res.valid, false);
    assert.ok(res.errors.name);
    assert.equal(
      res.errors.name,
      "Project name is required and cannot be empty.",
    );
  });

  it("should reject excessively long fields", () => {
    const longName = "A".repeat(300);
    const longGenre = "G".repeat(150);
    const res = validateProjectInput({
      name: longName,
      genre: longGenre,
    });

    assert.equal(res.valid, false);
    assert.ok(res.errors.name);
    assert.ok(res.errors.genre);
  });

  it("should fallback to default genre if not provided", () => {
    const res = validateProjectInput({
      name: "Untitled Novel",
    });

    assert.equal(res.valid, true);
    assert.ok(res.sanitized);
    assert.equal(res.sanitized.genre, "General Fiction");
  });

  it("should generate formatted project IDs with proj- prefix", () => {
    const id1 = generateProjectId();
    const id2 = generateProjectId();

    assert.ok(id1.startsWith("proj-"));
    assert.ok(id2.startsWith("proj-"));
    assert.notEqual(id1, id2);
  });
});
