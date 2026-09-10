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
  validateEntityRevision,
  validateBitemporalCoordinateQuery,
  DynamicFieldDefSchema,
  BlueprintDefSchema,
  EntityItemSchema,
  ValueTypeOptionSchema,
  EditTreeSchema,
  EditNodeSchema,
  BitemporalEntityStateSchema,
  JSONPatchSchema,
  diffEntityProperties,
  applyEntityPatch,
  validateUserAccount,
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

  it("BLOCK_TEST_BRIDGE_001: should reject invalid ContinuityAuditRequest with block ID", () => {
    const invalidAudit = {
      projectId: "not-a-uuid",
      sceneId: "not-a-uuid",
      sequenceNumber: -1,
      draftEvents: [],
    };

    assert.throws(
      () => validateContinuityAuditRequest(invalidAudit),
      /BLOCK_COMM_BRIDGE_CONTRACT_001/,
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

  it("BLOCK_TEST_BRIDGE_001: should reject invalid EntityMentionQuery with block ID", () => {
    const invalidQuery = {
      projectId: "invalid-uuid",
      queryToken: "", // empty query token violates min(1)
    };

    assert.throws(
      () => validateEntityMentionQuery(invalidQuery),
      /BLOCK_COMM_BRIDGE_CONTRACT_001/,
    );
  });

  it("BLOCK_TEST_BRIDGE_001: should sanitize field name to lowercase in DynamicFieldDefSchema", () => {
    const parsed = DynamicFieldDefSchema.parse({
      id: "f-1",
      name: "Attack_Power",
      label: "Attack Power",
      fieldType: "NUMBER",
    });
    assert.strictEqual(parsed.name, "attack_power");
  });

  it("BLOCK_TEST_BRIDGE_001: should reject duplicate field names in BlueprintDefSchema", () => {
    assert.throws(() => {
      BlueprintDefSchema.parse({
        id: "bp-1",
        name: "Character",
        blueprintClass: "FIRST_CLASS",
        category: "Entity",
        fields: [
          { id: "f-1", name: "health", label: "Health", fieldType: "NUMBER" },
          {
            id: "f-2",
            name: "Health",
            label: "Health Duplicate",
            fieldType: "NUMBER",
          },
        ],
      });
    }, /Duplicate field machine keys/);
  });

  it("BLOCK_TEST_BRIDGE_001: should sanitize ValueTypeOption value to lowercase machine key", () => {
    const parsed = ValueTypeOptionSchema.parse({
      label: "Qi Condensation Peak",
      value: "Qi_Condensation_Peak",
      power: 99.5,
    });
    assert.strictEqual(parsed.value, "qi_condensation_peak");
    assert.strictEqual(parsed.power, 99.5);
  });

  it("BLOCK_TEST_BRIDGE_001: should validate EntityItemSchema correctly", () => {
    const entity = EntityItemSchema.parse({
      id: "ent-1",
      blueprintId: "bp-character",
      name: "Arthur",
      properties: {
        attack: 100,
        realm: "Foundation",
      },
      computedFormulas: {
        combat_power: 300,
      },
      lastMutatedSeqNumber: 5,
    });
    assert.strictEqual(entity.name, "Arthur");
    assert.strictEqual(entity.computedFormulas?.combat_power, 300);
  });

  it("BLOCK_TEST_BRIDGE_001: should validate EntityRevision and BitemporalCoordinateQuery contracts", () => {
    const validRev = {
      id: "rev-1",
      entityId: "ent-1",
      parentRevisionId: null,
      revisionNumber: 0,
      createdAt: new Date().toISOString(),
      type: "BASELINE_EDIT",
      patch: {
        name: { before: "Old", after: "New" },
      },
      snapshot: {
        id: "ent-1",
        blueprintId: "bp-1",
        name: "New",
        properties: {},
      },
    };
    const parsedRev = validateEntityRevision(validRev);
    assert.strictEqual(parsedRev.type, "BASELINE_EDIT");

    const validCoord = {
      entityId: "ent-1",
      targetSequenceNumber: 10,
      targetRevisionId: "rev-1",
    };
    const parsedCoord = validateBitemporalCoordinateQuery(validCoord);
    assert.strictEqual(parsedCoord.targetSequenceNumber, 10);
  });

  it("BLOCK_TEST_BRIDGE_001: should validate EditTreeSchema and EditNodeSchema structures", () => {
    const validTree = {
      rootId: "node-0",
      activeEditId: "node-1",
      nodes: {
        "node-0": {
          id: "node-0",
          parentId: null,
          childrenIds: ["node-1"],
          revisionNumber: 0,
          type: "BASELINE_EDIT",
          createdAt: new Date().toISOString(),
          snapshot: { id: "ent-1", name: "Base" },
        },
        "node-1": {
          id: "node-1",
          parentId: "node-0",
          childrenIds: [],
          revisionNumber: 1,
          type: "TYPO_FIX",
          createdAt: new Date().toISOString(),
          snapshot: { id: "ent-1", name: "Base Fixed" },
        },
      },
    };

    const parsedTree = EditTreeSchema.parse(validTree);
    assert.strictEqual(parsedTree.activeEditId, "node-1");
    assert.strictEqual(Object.keys(parsedTree.nodes).length, 2);
  });

  it("BLOCK_TEST_BRIDGE_001: should compute and apply differential state patches (RFC 6902)", () => {
    const beforeState = {
      realm: "Foundation Establishment",
      spiritual_energy: 1000,
      status: "MEDITATING",
      obsolete_field: "remove_me",
    };

    const afterState = {
      realm: "Core Formation",
      spiritual_energy: 3500,
      status: "MEDITATING",
      new_core_grade: "Golden Core",
    };

    const patches = diffEntityProperties(beforeState, afterState);
    const parsedPatches = JSONPatchSchema.parse(patches);
    assert.strictEqual(parsedPatches.length, 4);

    const applied = applyEntityPatch(beforeState, patches);
    assert.deepStrictEqual(applied, afterState);
    assert.strictEqual(applied.realm, "Core Formation");
    assert.strictEqual(applied.spiritual_energy, 3500);
    assert.strictEqual(applied.new_core_grade, "Golden Core");
    assert.strictEqual(
      (applied as Record<string, unknown>).obsolete_field,
      undefined,
    );
  });

  it("BLOCK_TEST_BRIDGE_001: should validate User, Admin, and Super Admin accounts and roles", () => {
    // 1. Standard User
    const standardUser = {
      id: "a1111111-1111-1111-1111-111111111111",
      email: "author@novwrite.dev",
      username: "creative_author",
      role: "USER" as const,
      isPlatformAdmin: false,
      mfaEnabled: false,
      accountStatus: "ACTIVE" as const,
      createdAt: new Date().toISOString(),
    };
    const parsedUser = validateUserAccount(standardUser);
    assert.strictEqual(parsedUser.role, "USER");
    assert.strictEqual(parsedUser.isPlatformAdmin, false);

    // 2. Platform Admin
    const adminUser = {
      id: "a2222222-2222-2222-2222-222222222222",
      email: "admin@novwrite.dev",
      username: "novwrite_admin",
      role: "ADMIN" as const,
      isPlatformAdmin: true,
      mfaEnabled: true,
      accountStatus: "ACTIVE" as const,
      createdAt: new Date().toISOString(),
    };
    const parsedAdmin = validateUserAccount(adminUser);
    assert.strictEqual(parsedAdmin.role, "ADMIN");
    assert.strictEqual(parsedAdmin.isPlatformAdmin, true);

    // 3. Super Admin
    const superAdmin = {
      id: "a3333333-3333-3333-3333-333333333333",
      email: "root@novwrite.dev",
      username: "super_admin",
      role: "SUPER_ADMIN" as const,
      isPlatformAdmin: true,
      mfaEnabled: true,
      accountStatus: "ACTIVE" as const,
      createdAt: new Date().toISOString(),
    };
    const parsedSuperAdmin = validateUserAccount(superAdmin);
    assert.strictEqual(parsedSuperAdmin.role, "SUPER_ADMIN");
  });
});
