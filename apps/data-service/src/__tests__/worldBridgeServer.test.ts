/**
 * @file worldBridgeServer.test.ts
 * @description Co-located unit tests for World Bridge Server RPC binding.
 * Block Standard: BLOCK_TEST_WORLD_BRIDGE_001
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  WorldBridgeServer,
  WorldBridgeDataSource,
  StateFoldEngine,
  BaseEntityInput,
} from "../index.js";

describe("World Domain Bridge Server RPC Handlers (Phase W5)", () => {
  const projectId = "00000000-0000-4000-a000-000000000001";
  const eldrinId = "a1111111-1111-4111-a111-111111111111";
  const lyraId = "b2222222-2222-4222-a222-222222222222";
  const malakorId = "c3333333-3333-4333-a333-333333333333";
  const sceneId = "d4444444-4444-4444-a444-444444444444";

  const baseEntities: BaseEntityInput[] = [
    {
      id: eldrinId,
      name: "Eldrin the Spellblade",
      category: "CHARACTER",
      baseProperties: {
        mana_capacity: 500,
        status: "ALIVE",
        cultivation_realm: "Foundation",
      },
    },
    {
      id: lyraId,
      name: "Lyra of the Astral Veil",
      category: "CHARACTER",
      baseProperties: {
        mana_capacity: 800,
        status: "ALIVE",
        cultivation_realm: "Core Formation",
      },
    },
    {
      id: malakorId,
      name: "Lord Malakor",
      category: "CHARACTER",
      baseProperties: {
        mana_capacity: 1200,
        status: "DEAD",
        cultivation_realm: "Core Formation",
      },
    },
  ];

  const mockDb: any = {
    timelineEvent: {
      findMany: async () => [],
    },
    invariantRule: {
      findMany: async () => [
        {
          id: "rule-1",
          projectId,
          name: "Non-Negative Mana",
          severity: "BLOCKING_ERROR",
          predicate: {
            type: "NUMERIC_BOUNDS",
            propertyKey: "mana_capacity",
            min: 0,
            targetCategory: "CHARACTER",
          },
        },
        {
          id: "rule-2",
          projectId,
          name: "Dead Entity No Spells",
          severity: "BLOCKING_ERROR",
          predicate: {
            type: "STATE_GUARD",
            propertyKey: "status",
            guardedValue: "DEAD",
            forbiddenActions: ["CAST_SPELL"],
            targetCategory: "CHARACTER",
          },
        },
      ],
    },
  };

  const stateFoldEngine = new StateFoldEngine(mockDb);

  const mockDataSource: WorldBridgeDataSource = {
    stateFoldEngine,
    getBaseEntities: async () => baseEntities,
    searchEntities: async (_pId, token, catLimit) => {
      return baseEntities.filter((e) => {
        const matchesToken = e.name.toLowerCase().includes(token.toLowerCase());
        const matchesCat = !catLimit || catLimit.includes(e.category);
        return matchesToken && matchesCat;
      });
    },
  };

  it("BLOCK_TEST_WORLD_BRIDGE_001: should handle scene grounding requests via bridge contract", async () => {
    const server = new WorldBridgeServer(mockDataSource);

    const response = await server.handleSceneGrounding({
      projectId,
      sceneId,
      targetSequenceNumber: 50,
      mentionedEntityIds: [eldrinId, lyraId],
    });

    assert.strictEqual(response.sceneId, sceneId);
    assert.strictEqual(response.sequenceNumber, 50);
    assert.strictEqual(response.foldedStates.length, 2);
    assert.strictEqual(response.activeConstraints.length, 2);
  });

  it("BLOCK_TEST_WORLD_BRIDGE_001: should handle continuity audit and flag Malakor contradiction", async () => {
    const server = new WorldBridgeServer(mockDataSource);

    const auditResponse = await server.handleContinuityAudit({
      projectId,
      sceneId,
      sequenceNumber: 160,
      draftEvents: [
        {
          entityId: malakorId,
          eventType: "CAST_SPELL",
          delta: {},
        },
      ],
    });

    assert.strictEqual(auditResponse.status, "VIOLATION_DETECTED");
    assert.strictEqual(auditResponse.violations.length, 1);
    assert.strictEqual(
      auditResponse.violations[0].code,
      "INVARIANT_STATE_ILLEGAL_ACTION",
    );
    assert.strictEqual(auditResponse.violations[0].entityId, malakorId);
  });

  it("BLOCK_TEST_WORLD_BRIDGE_001: should handle entity mention queries for auto-complete", async () => {
    const server = new WorldBridgeServer(mockDataSource);

    const mentionResponse = await server.handleEntityMentionQuery({
      projectId,
      queryToken: "Eldrin",
    });

    assert.strictEqual(mentionResponse.queryToken, "Eldrin");
    assert.strictEqual(mentionResponse.matches.length, 1);
    assert.strictEqual(
      mentionResponse.matches[0].name,
      "Eldrin the Spellblade",
    );
    assert.strictEqual(
      mentionResponse.matches[0].currentRealmOrStatus,
      "Foundation",
    );
  });

  it("BLOCK_TEST_WORLD_BRIDGE_001: should publish canon state changed event successfully", async () => {
    const server = new WorldBridgeServer(mockDataSource);

    const pubResult = await server.publishCanonStateChanged({
      projectId,
      eventId: "ev-100",
      sequenceNumber: 50,
      mutatedEntityIds: [eldrinId],
      timestamp: new Date().toISOString(),
    });

    assert.strictEqual(pubResult.published, true);
    assert.strictEqual(pubResult.eventId, "ev-100");
  });

  it("BLOCK_TEST_WORLD_BRIDGE_001: should reject invalid RPC payloads via Zod validation", async () => {
    const server = new WorldBridgeServer(mockDataSource);

    // Invalid UUID for scene grounding
    await assert.rejects(
      async () =>
        server.handleSceneGrounding({
          projectId: "invalid-uuid",
          sceneId,
          targetSequenceNumber: 50,
          mentionedEntityIds: [],
        }),
      /Invalid UUID/i,
    );
  });
});
