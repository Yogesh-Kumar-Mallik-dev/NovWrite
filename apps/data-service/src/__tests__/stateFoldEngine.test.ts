/**
 * @file stateFoldEngine.test.ts
 * @description Co-located unit tests for Deterministic State Fold Engine & Invariant Rule Auditor.
 * Block Standard: BLOCK_TEST_STATE_FOLD_001
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  StateFoldEngine,
  BaseEntityInput,
  DatabaseStateFoldClient,
  InvariantRuleDef,
} from "../index.js";

describe("Deterministic State Fold Engine & Invariant Rules (Phase W3)", () => {
  const projectId = "00000000-0000-4000-a000-000000000001";
  const eldrinId = "a1111111-1111-4111-a111-111111111111";
  const lyraId = "b2222222-2222-4222-a222-222222222222";
  const malakorId = "c3333333-3333-4333-a333-333333333333";

  const baseEntities: BaseEntityInput[] = [
    {
      id: eldrinId,
      name: "Eldrin the Spellblade",
      category: "CHARACTER",
      baseProperties: {
        mana_capacity: 0,
        status: "ALIVE",
        cultivation_realm: "Foundation",
        faction: "Silver Vanguard",
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
        faction: "Astral Covenant",
      },
    },
    {
      id: malakorId,
      name: "Lord Malakor",
      category: "CHARACTER",
      baseProperties: {
        mana_capacity: 1200,
        status: "ALIVE",
        cultivation_realm: "Core Formation",
        faction: "Shadow Syndicate",
      },
    },
  ];

  const timelineEvents = [
    {
      id: "ev-1",
      projectId,
      narrativeSequenceNumber: 10,
      chronologicalOrder: 100,
      title: "Awakening at the Citadel",
      effects: [
        {
          id: "eff-1",
          eventId: "ev-1",
          targetEntity: eldrinId,
          propertyKey: "mana_capacity",
          operation: "SET",
          value: 500,
        },
      ],
    },
    {
      id: "ev-2",
      projectId,
      narrativeSequenceNumber: 50,
      chronologicalOrder: 150,
      title: "Duel at Crimson Ridge",
      effects: [
        {
          id: "eff-2",
          eventId: "ev-2",
          targetEntity: eldrinId,
          propertyKey: "mana_capacity",
          operation: "DECREMENT",
          value: 200,
        },
      ],
    },
    {
      id: "ev-3",
      projectId,
      narrativeSequenceNumber: 150,
      chronologicalOrder: 200,
      title: "Fall of Malakor",
      effects: [
        {
          id: "eff-3",
          eventId: "ev-3",
          targetEntity: malakorId,
          propertyKey: "status",
          operation: "SET",
          value: "DEAD",
        },
      ],
    },
  ];

  const rules: InvariantRuleDef[] = [
    {
      id: "rule-1",
      projectId,
      name: "Non-Negative Mana Invariant",
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
      name: "Deceased Entity Action Restriction",
      severity: "BLOCKING_ERROR",
      predicate: {
        type: "STATE_GUARD",
        propertyKey: "status",
        guardedValue: "DEAD",
        forbiddenActions: ["CAST_SPELL", "MELEE_ATTACK", "SPEAK_IN_COUNCIL"],
        prohibitedMutations: ["mana_capacity"],
        targetCategory: "CHARACTER",
      },
    },
  ];

  const mockDb: DatabaseStateFoldClient = {
    timelineEvent: {
      findMany: async (args: any) => {
        let list = [...timelineEvents];
        if (args?.where?.projectId) {
          list = list.filter((e) => e.projectId === args.where.projectId);
        }
        if (args?.where?.narrativeSequenceNumber?.lte !== undefined) {
          list = list.filter(
            (e) =>
              e.narrativeSequenceNumber <=
              args.where.narrativeSequenceNumber.lte,
          );
        }
        list.sort(
          (a, b) => a.narrativeSequenceNumber - b.narrativeSequenceNumber,
        );
        return list;
      },
    },
    invariantRule: {
      findMany: async (args: any) => {
        return rules.filter((r) => r.projectId === args?.where?.projectId);
      },
    },
  };

  it("BLOCK_TEST_STATE_FOLD_001: should fold universe state at historical narrative points", async () => {
    const engine = new StateFoldEngine(mockDb);

    // Fold state at Sequence #50 (after Duel)
    const stateAt50 = await engine.foldStateAtSequence(
      projectId,
      50,
      baseEntities,
    );

    const eldrinAt50 = stateAt50.get(eldrinId);
    assert.ok(eldrinAt50);
    assert.strictEqual(eldrinAt50.computedProperties.mana_capacity, 300);
    assert.strictEqual(eldrinAt50.computedProperties.status, "ALIVE");
    assert.strictEqual(eldrinAt50.lastMutatedSeqNumber, 50);

    const malakorAt50 = stateAt50.get(malakorId);
    assert.ok(malakorAt50);
    assert.strictEqual(malakorAt50.computedProperties.status, "ALIVE");

    // Fold state at Sequence #160 (after Fall of Malakor)
    const stateAt160 = await engine.foldStateAtSequence(
      projectId,
      160,
      baseEntities,
    );
    const malakorAt160 = stateAt160.get(malakorId);
    assert.ok(malakorAt160);
    assert.strictEqual(malakorAt160.computedProperties.status, "DEAD");
    assert.strictEqual(malakorAt160.lastMutatedSeqNumber, 150);
  });

  it("BLOCK_TEST_STATE_FOLD_001: should ground a scene with folded entities and active constraints", async () => {
    const engine = new StateFoldEngine(mockDb);

    const response = await engine.groundScene(
      {
        projectId,
        sceneId: "scene-duel-50",
        targetSequenceNumber: 50,
        mentionedEntityIds: [eldrinId, lyraId],
      },
      baseEntities,
    );

    assert.strictEqual(response.sceneId, "scene-duel-50");
    assert.strictEqual(response.sequenceNumber, 50);
    assert.strictEqual(response.foldedStates.length, 2);
    assert.strictEqual(
      response.foldedStates.find((s) => s.entityId === eldrinId)
        ?.computedProperties.mana_capacity,
      300,
    );
    assert.strictEqual(response.activeConstraints.length, 2);
  });

  it("BLOCK_TEST_STATE_FOLD_001: should audit clean draft actions and return CLEAN status", async () => {
    const engine = new StateFoldEngine(mockDb);

    const cleanAudit = await engine.auditContinuity(
      {
        projectId,
        sceneId: "scene-1",
        sequenceNumber: 50,
        draftEvents: [
          {
            entityId: eldrinId,
            eventType: "MEDITATE",
            delta: { mana_capacity: 50 },
          },
        ],
      },
      baseEntities,
    );

    assert.strictEqual(cleanAudit.status, "CLEAN");
    assert.strictEqual(cleanAudit.violations.length, 0);
  });

  it("BLOCK_TEST_STATE_FOLD_001: should detect intentional Malakor DEAD entity casting spell violation", async () => {
    const engine = new StateFoldEngine(mockDb);

    // Contradiction Test Scene at Sequence #160 where Malakor (DEAD) attempts to CAST_SPELL
    const auditResponse = await engine.auditContinuity(
      {
        projectId,
        sceneId: "scene-contradiction-160",
        sequenceNumber: 160,
        draftEvents: [
          {
            entityId: malakorId,
            eventType: "CAST_SPELL",
            delta: {},
          },
        ],
      },
      baseEntities,
    );

    assert.strictEqual(auditResponse.status, "VIOLATION_DETECTED");
    assert.strictEqual(auditResponse.violations.length, 1);

    const violation = auditResponse.violations[0];
    assert.strictEqual(violation.code, "INVARIANT_STATE_ILLEGAL_ACTION");
    assert.strictEqual(
      violation.ruleName,
      "Deceased Entity Action Restriction",
    );
    assert.strictEqual(violation.entityId, malakorId);
    assert.strictEqual(violation.entityName, "Lord Malakor");
    assert.strictEqual(
      violation.rfc7807Uri,
      "https://novwrite.io/errors/invariants/invariant-state-illegal-action",
    );
    assert.match(violation.message, /cannot execute action 'CAST_SPELL'/);
  });

  it("BLOCK_TEST_STATE_FOLD_001: should detect mana underflow numeric bounds violation", async () => {
    const engine = new StateFoldEngine(mockDb);

    // At seq #50, Eldrin has 300 mana. Attempting to spend 500 mana (-500 delta) causes underflow (-200 < 0)
    const auditResponse = await engine.auditContinuity(
      {
        projectId,
        sceneId: "scene-underflow-50",
        sequenceNumber: 50,
        draftEvents: [
          {
            entityId: eldrinId,
            eventType: "CAST_ULTIMATE_SPELL",
            delta: { mana_capacity: -500 },
          },
        ],
      },
      baseEntities,
    );

    assert.strictEqual(auditResponse.status, "VIOLATION_DETECTED");
    assert.ok(auditResponse.violations.length >= 1);

    const underflowViolation = auditResponse.violations.find(
      (v) => v.code === "INVARIANT_NUMERIC_MIN_VIOLATED",
    );
    assert.ok(underflowViolation);
    assert.strictEqual(underflowViolation?.entityId, eldrinId);
    assert.strictEqual(underflowViolation?.property, "mana_capacity");
    assert.strictEqual(underflowViolation?.calculatedValue, -200);
    assert.strictEqual(underflowViolation?.expectedValue, ">= 0");
  });
});
