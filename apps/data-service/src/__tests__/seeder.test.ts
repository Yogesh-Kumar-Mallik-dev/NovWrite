/**
 * @file seeder.test.ts
 * @description Co-located unit tests for Development Test Data Seeder using Mock DB client.
 * Block Standard: BLOCK_TEST_SEEDER_001
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { seedDevelopmentUniverse, SEED_DATASET } from "../seed/devSeeder.js";

describe("NovWrite Development Test Seeder Engine", () => {
  it("BLOCK_TEST_SEEDER_001: should populate demo dataset using mock prisma client", async () => {
    const upsertCalls: Record<string, number> = {};

    const mockPrisma = {
      user: {
        upsert: async (args: any) => {
          upsertCalls["user"] = (upsertCalls["user"] || 0) + 1;
          return args.create;
        },
      },
      project: {
        upsert: async (args: any) => {
          upsertCalls["project"] = (upsertCalls["project"] || 0) + 1;
          return args.create;
        },
      },
      projectMember: {
        upsert: async (args: any) => {
          upsertCalls["projectMember"] =
            (upsertCalls["projectMember"] || 0) + 1;
          return args.create;
        },
      },
      entityTypeDefinition: {
        upsert: async (args: any) => {
          upsertCalls["entityType"] = (upsertCalls["entityType"] || 0) + 1;
          return { id: "et-char-id", ...args.create };
        },
      },
      dynamicPropertyDefinition: {
        upsert: async (args: any) => {
          upsertCalls["property"] = (upsertCalls["property"] || 0) + 1;
          return args.create;
        },
      },
      invariantRule: {
        upsert: async (args: any) => {
          upsertCalls["rule"] = (upsertCalls["rule"] || 0) + 1;
          return args.create;
        },
      },
      manuscript: {
        upsert: async (args: any) => {
          upsertCalls["manuscript"] = (upsertCalls["manuscript"] || 0) + 1;
          return args.create;
        },
      },
      chapter: {
        upsert: async (args: any) => {
          upsertCalls["chapter"] = (upsertCalls["chapter"] || 0) + 1;
          return args.create;
        },
      },
      scene: {
        upsert: async (args: any) => {
          upsertCalls["scene"] = (upsertCalls["scene"] || 0) + 1;
          return args.create;
        },
      },
      sceneLease: {
        upsert: async (args: any) => {
          upsertCalls["lease"] = (upsertCalls["lease"] || 0) + 1;
          return args.create;
        },
      },
    };

    const result = await seedDevelopmentUniverse(mockPrisma);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.projectId, SEED_DATASET.project.id);
    assert.strictEqual(result.seededScenesCount, 3);
    assert.strictEqual(upsertCalls["user"], 3);
    assert.strictEqual(upsertCalls["project"], 1);
    assert.strictEqual(upsertCalls["projectMember"], 2);
    assert.strictEqual(upsertCalls["chapter"], 2);
    assert.strictEqual(upsertCalls["scene"], 3);
    assert.strictEqual(upsertCalls["lease"], 1);
  });

  it("BLOCK_TEST_SEEDER_001: should throw error when database client is null", async () => {
    await assert.rejects(
      async () => seedDevelopmentUniverse(null),
      /BLOCK_DEV_SEEDER_ENGINE_001/,
    );
  });
});
