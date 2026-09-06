/**
 * @file bridge.test.ts
 * @description Unit tests for @novwrite/bridge contract validators and MockBridgeService.
 * Block Standard: BLOCK_TEST_BRIDGE_001
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  MockBridgeService,
  DEMO_PROJECT_ID,
  ELDRIN_ENTITY_ID,
  MALAKOR_ENTITY_ID,
  validateSceneGroundingRequest,
  validateContinuityAuditRequest,
  validateEntityMentionQuery,
} from "../index.js";

describe("NovWrite Bridge Contracts & Mock Service", () => {
  const bridge = new MockBridgeService();
  const validSceneId = "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f";

  it("BLOCK_TEST_BRIDGE_001: should validate and process SceneGroundingRequest", async () => {
    const rawReq = {
      projectId: DEMO_PROJECT_ID,
      sceneId: validSceneId,
      targetSequenceNumber: 50,
      mentionedEntityIds: [ELDRIN_ENTITY_ID],
    };

    const validated = validateSceneGroundingRequest(rawReq);
    assert.strictEqual(validated.projectId, DEMO_PROJECT_ID);

    const res = await bridge.getSceneGrounding(validated);
    assert.strictEqual(res.sceneId, validSceneId);
    assert.strictEqual(res.foldedStates.length, 1);
    assert.strictEqual(res.foldedStates[0].entityName, "Eldrin the Spellblade");
    assert.strictEqual(
      res.foldedStates[0].computedProperties.mana_capacity,
      500,
    );
    assert.strictEqual(res.activeConstraints.length, 2);
  });

  it("BLOCK_TEST_BRIDGE_001: should reject invalid SceneGroundingRequest with block ID", () => {
    const invalidReq = {
      projectId: "not-a-uuid",
      sceneId: validSceneId,
      targetSequenceNumber: -5,
      mentionedEntityIds: [],
    };

    assert.throws(
      () => validateSceneGroundingRequest(invalidReq),
      /BLOCK_COMM_BRIDGE_CONTRACT_001/,
    );
  });

  it("BLOCK_TEST_BRIDGE_001: should detect intentional continuity violations on deceased entity", async () => {
    const rawAuditReq = {
      projectId: DEMO_PROJECT_ID,
      sceneId: validSceneId,
      sequenceNumber: 160,
      draftEvents: [
        {
          entityId: MALAKOR_ENTITY_ID,
          eventType: "CAST_SPELL",
          delta: { spell_name: "Void Siphon", mana_cost: 300 },
        },
      ],
    };

    const validated = validateContinuityAuditRequest(rawAuditReq);
    const auditRes = await bridge.validateProseContinuity(validated);

    assert.strictEqual(auditRes.status, "VIOLATION_DETECTED");
    assert.strictEqual(auditRes.violations.length, 1);
    assert.strictEqual(
      auditRes.violations[0].code,
      "INVARIANT_STATE_ILLEGAL_ACTION",
    );
    assert.strictEqual(auditRes.violations[0].entityName, "Lord Malakor");
    assert.ok(
      auditRes.violations[0].message.includes("BLOCK_COMM_BRIDGE_MOCK_001"),
    );
  });

  it("BLOCK_TEST_BRIDGE_001: should query entity autocomplete mentions", async () => {
    const query = {
      projectId: DEMO_PROJECT_ID,
      queryToken: "eldrin",
    };

    const validated = validateEntityMentionQuery(query);
    const res = await bridge.suggestEntityMentions(validated);

    assert.strictEqual(res.matches.length, 1);
    assert.strictEqual(res.matches[0].name, "Eldrin the Spellblade");
    assert.strictEqual(
      res.matches[0].currentRealmOrStatus,
      "Foundation Establishment",
    );
  });
});
