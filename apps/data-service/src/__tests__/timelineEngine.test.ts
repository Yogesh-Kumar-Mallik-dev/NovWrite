/**
 * @file timelineEngine.test.ts
 * @description Co-located unit tests for Causal Timeline and Event Sourcing Engine.
 * Block Standard: BLOCK_TEST_TIMELINE_ENGINE_001
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyEffectToEntityState,
  applyEffectsToUniverse,
  TimelineEngine,
  TimelineEventInput,
  DatabaseTimelineClient,
} from "../index.js";

describe("Causal Timeline & Event Sourcing Engine (Phase W2)", () => {
  const eldrinId = "a1111111-1111-4111-a111-111111111111";
  const lyraId = "b2222222-2222-4222-a222-222222222222";
  const malakorId = "c3333333-3333-4333-a333-333333333333";
  const projectId = "00000000-0000-4000-a000-000000000001";

  it("BLOCK_TEST_TIMELINE_ENGINE_001: should apply SET, INCREMENT, and DECREMENT effects deterministically", () => {
    let state: Record<string, unknown> = {
      mana_capacity: 500,
      status: "ALIVE",
    };

    // SET
    state = applyEffectToEntityState(state, {
      targetEntity: eldrinId,
      propertyKey: "status",
      operation: "SET",
      value: "MEDITATING",
    });
    assert.strictEqual(state.status, "MEDITATING");

    // INCREMENT
    state = applyEffectToEntityState(state, {
      targetEntity: eldrinId,
      propertyKey: "mana_capacity",
      operation: "INCREMENT",
      value: 250,
    });
    assert.strictEqual(state.mana_capacity, 750);

    // DECREMENT
    state = applyEffectToEntityState(state, {
      targetEntity: eldrinId,
      propertyKey: "mana_capacity",
      operation: "DECREMENT",
      value: 300,
    });
    assert.strictEqual(state.mana_capacity, 450);
  });

  it("BLOCK_TEST_TIMELINE_ENGINE_001: should handle APPEND and REMOVE array effects cleanly", () => {
    let state: Record<string, unknown> = {
      inventory: ["Iron Sword", "Healing Salve"],
    };

    // APPEND single item
    state = applyEffectToEntityState(state, {
      targetEntity: eldrinId,
      propertyKey: "inventory",
      operation: "APPEND",
      value: "Astral Compass",
    });
    assert.deepStrictEqual(state.inventory, [
      "Iron Sword",
      "Healing Salve",
      "Astral Compass",
    ]);

    // APPEND array of items
    state = applyEffectToEntityState(state, {
      targetEntity: eldrinId,
      propertyKey: "inventory",
      operation: "APPEND",
      value: ["Mana Crystal", "Teleport Rune"],
    });
    assert.deepStrictEqual(state.inventory, [
      "Iron Sword",
      "Healing Salve",
      "Astral Compass",
      "Mana Crystal",
      "Teleport Rune",
    ]);

    // REMOVE single item
    state = applyEffectToEntityState(state, {
      targetEntity: eldrinId,
      propertyKey: "inventory",
      operation: "REMOVE",
      value: "Healing Salve",
    });
    assert.deepStrictEqual(state.inventory, [
      "Iron Sword",
      "Astral Compass",
      "Mana Crystal",
      "Teleport Rune",
    ]);
  });

  it("BLOCK_TEST_TIMELINE_ENGINE_001: should apply TRANSFER effect between entities across universe", () => {
    const universe = new Map<string, Record<string, unknown>>([
      [eldrinId, { mana_capacity: 500, gold: 100 }],
      [lyraId, { mana_capacity: 800, gold: 50 }],
    ]);

    applyEffectsToUniverse(universe, [
      {
        targetEntity: eldrinId,
        propertyKey: "gold",
        operation: "TRANSFER",
        value: {
          toEntityId: lyraId,
          amount: 40,
        },
      },
    ]);

    assert.strictEqual(universe.get(eldrinId)?.gold, 60);
    assert.strictEqual(universe.get(lyraId)?.gold, 90);
  });

  it("BLOCK_TEST_TIMELINE_ENGINE_001: should throw error on invalid numeric increment/decrement", () => {
    assert.throws(
      () =>
        applyEffectToEntityState(
          { mana: 100 },
          {
            targetEntity: eldrinId,
            propertyKey: "mana",
            operation: "INCREMENT",
            value: "invalid_not_a_number",
          },
        ),
      /requires numeric value/,
    );
  });

  it("BLOCK_TEST_TIMELINE_ENGINE_001: should manage 5 chained events and assert dual-index causal ordering", async () => {
    // In-memory mock database store
    const storedEvents: any[] = [];
    const storedEffects: any[] = [];

    const mockDb: DatabaseTimelineClient = {
      timelineEvent: {
        findMany: async (args: any) => {
          let list = [...storedEvents];
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
          if (args?.where?.chronologicalOrder?.lte !== undefined) {
            list = list.filter(
              (e) => e.chronologicalOrder <= args.where.chronologicalOrder.lte,
            );
          }
          if (args?.where?.effects?.some?.targetEntity) {
            const target = args.where.effects.some.targetEntity;
            list = list.filter((e) =>
              e.effects.some((eff: any) => eff.targetEntity === target),
            );
          }

          if (args?.orderBy?.narrativeSequenceNumber) {
            const dir =
              args.orderBy.narrativeSequenceNumber === "desc" ? -1 : 1;
            list.sort(
              (a, b) =>
                (a.narrativeSequenceNumber - b.narrativeSequenceNumber) * dir,
            );
          } else if (args?.orderBy?.chronologicalOrder) {
            const dir = args.orderBy.chronologicalOrder === "desc" ? -1 : 1;
            list.sort(
              (a, b) => (a.chronologicalOrder - b.chronologicalOrder) * dir,
            );
          }

          return list;
        },
        findUnique: async (args: any) => {
          return storedEvents.find((e) => e.id === args.where.id) || null;
        },
        create: async (args: any) => {
          const eventId = `event-${storedEvents.length + 1}`;
          const newEffects = (args.data.effects?.create || []).map(
            (eff: any, idx: number) => ({
              id: `effect-${eventId}-${idx + 1}`,
              eventId,
              targetEntity: eff.targetEntity,
              propertyKey: eff.propertyKey,
              operation: eff.operation,
              value: eff.value,
              createdAt: new Date(),
            }),
          );
          storedEffects.push(...newEffects);

          const newEvent = {
            id: eventId,
            projectId: args.data.projectId,
            narrativeSequenceNumber: args.data.narrativeSequenceNumber,
            chronologicalOrder: args.data.chronologicalOrder,
            title: args.data.title,
            description: args.data.description,
            anchorSceneId: args.data.anchorSceneId,
            createdAt: new Date(),
            effects: newEffects,
          };
          storedEvents.push(newEvent);
          return newEvent;
        },
        update: async (args: any) => {
          const idx = storedEvents.findIndex((e) => e.id === args.where.id);
          if (idx === -1) throw new Error("Event not found");
          const target = storedEvents[idx];

          if (args.data.title !== undefined) target.title = args.data.title;
          if (args.data.description !== undefined)
            target.description = args.data.description;
          if (args.data.narrativeSequenceNumber !== undefined) {
            target.narrativeSequenceNumber = args.data.narrativeSequenceNumber;
          }
          if (args.data.chronologicalOrder !== undefined) {
            target.chronologicalOrder = args.data.chronologicalOrder;
          }
          if (args.data.effects?.create) {
            target.effects = args.data.effects.create.map(
              (eff: any, i: number) => ({
                id: `effect-${target.id}-new-${i + 1}`,
                eventId: target.id,
                targetEntity: eff.targetEntity,
                propertyKey: eff.propertyKey,
                operation: eff.operation,
                value: eff.value,
                createdAt: new Date(),
              }),
            );
          }
          return target;
        },
        delete: async (args: any) => {
          const idx = storedEvents.findIndex((e) => e.id === args.where.id);
          if (idx !== -1) {
            storedEvents.splice(idx, 1);
          }
          return true;
        },
        deleteMany: async () => ({ count: 0 }),
      },
      eventEffect: {
        findMany: async () => storedEffects,
        create: async (args: any) => args.data,
        createMany: async () => ({ count: 0 }),
        deleteMany: async (args: any) => {
          if (args?.where?.eventId) {
            const rem = storedEffects.filter(
              (e) => e.eventId !== args.where.eventId,
            );
            storedEffects.length = 0;
            storedEffects.push(...rem);
          }
          return { count: 1 };
        },
      },
      $transaction: async (fn: any) => {
        return await fn(mockDb);
      },
    };

    const engine = new TimelineEngine(mockDb);

    // Create 5 chained events
    // Event 1 (Narrative Seq 10, Chrono 100): Awakening
    await engine.createEvent({
      projectId,
      narrativeSequenceNumber: 10,
      chronologicalOrder: 100,
      title: "Awakening at the Citadel",
      description: "Eldrin awakes with surge of mana",
      effects: [
        {
          targetEntity: eldrinId,
          propertyKey: "mana_capacity",
          operation: "SET",
          value: 500,
        },
        {
          targetEntity: eldrinId,
          propertyKey: "status",
          operation: "SET",
          value: "ALIVE",
        },
      ],
    });

    // Event 2 (Narrative Seq 50, Chrono 150): Duel at Crimson Ridge
    await engine.createEvent({
      projectId,
      narrativeSequenceNumber: 50,
      chronologicalOrder: 150,
      title: "Duel at Crimson Ridge",
      description: "Eldrin spends 200 mana in duel",
      effects: [
        {
          targetEntity: eldrinId,
          propertyKey: "mana_capacity",
          operation: "DECREMENT",
          value: 200,
        },
      ],
    });

    // Event 3 (Narrative Seq 80, Chrono 50): Flashback to Ancient Treaty (Out of chronological order!)
    await engine.createEvent({
      projectId,
      narrativeSequenceNumber: 80,
      chronologicalOrder: 50,
      title: "Flashback: The Ancient Covenant",
      description: "Malakor seals treaty in the past",
      effects: [
        {
          targetEntity: malakorId,
          propertyKey: "faction",
          operation: "SET",
          value: "Ancient Order",
        },
      ],
    });

    // Event 4 (Narrative Seq 150, Chrono 200): Fall of Malakor
    await engine.createEvent({
      projectId,
      narrativeSequenceNumber: 150,
      chronologicalOrder: 200,
      title: "Fall of Malakor",
      description: "Lord Malakor is slain",
      effects: [
        {
          targetEntity: malakorId,
          propertyKey: "status",
          operation: "SET",
          value: "DEAD",
        },
      ],
    });

    // Event 5 (Narrative Seq 200, Chrono 250): Lyra's Discovery
    await engine.createEvent({
      projectId,
      narrativeSequenceNumber: 200,
      chronologicalOrder: 250,
      title: "Discovery of Astral Veil",
      description: "Lyra gains realm breakthrough",
      effects: [
        {
          targetEntity: lyraId,
          propertyKey: "cultivation_realm",
          operation: "SET",
          value: "Core Formation",
        },
      ],
    });

    // Verify narrative ordering
    const narrativeEvents = await engine.getEvents(projectId, {
      orderBy: "narrative",
      orderDirection: "asc",
    });
    assert.strictEqual(narrativeEvents.length, 5);
    assert.deepStrictEqual(
      narrativeEvents.map((e) => e.narrativeSequenceNumber),
      [10, 50, 80, 150, 200],
    );
    assert.strictEqual(
      narrativeEvents[2].title,
      "Flashback: The Ancient Covenant",
    );

    // Verify chronological ordering (Flashback appears first because chrono=50 < 100)
    const chronoEvents = await engine.getEvents(projectId, {
      orderBy: "chronological",
      orderDirection: "asc",
    });
    assert.strictEqual(chronoEvents.length, 5);
    assert.deepStrictEqual(
      chronoEvents.map((e) => e.chronologicalOrder),
      [50, 100, 150, 200, 250],
    );
    assert.strictEqual(
      chronoEvents[0].title,
      "Flashback: The Ancient Covenant",
    );

    // Verify range filtering up to narrative sequence 50
    const filteredEvents = await engine.getEvents(projectId, {
      orderBy: "narrative",
      upToNarrativeSeq: 50,
    });
    assert.strictEqual(filteredEvents.length, 2);
    assert.strictEqual(filteredEvents[0].narrativeSequenceNumber, 10);
    assert.strictEqual(filteredEvents[1].narrativeSequenceNumber, 50);

    // Verify entity history filtering for Malakor
    const malakorEvents = await engine.getEventsForEntity(projectId, malakorId);
    assert.strictEqual(malakorEvents.length, 2);
    assert.strictEqual(
      malakorEvents[0].title,
      "Flashback: The Ancient Covenant",
    );
    assert.strictEqual(malakorEvents[1].title, "Fall of Malakor");

    // Test update event
    const updated = await engine.updateEvent("event-2", {
      title: "Duel at Crimson Ridge (Extended)",
    });
    assert.strictEqual(updated.title, "Duel at Crimson Ridge (Extended)");

    // Test resequencing
    await engine.resequenceEvents(projectId, [
      { eventId: "event-1", narrativeSequenceNumber: 15 },
    ]);
    const rechecked = await engine.getEventById("event-1");
    assert.strictEqual(rechecked?.narrativeSequenceNumber, 15);

    // Test delete event
    await engine.deleteEvent("event-5");
    const remaining = await engine.getEvents(projectId);
    assert.strictEqual(remaining.length, 4);
  });

  it("BLOCK_TEST_TIMELINE_ENGINE_001: should reject invalid event inputs", async () => {
    const mockDb: any = {
      timelineEvent: {},
      eventEffect: {},
    };
    const engine = new TimelineEngine(mockDb);

    // Missing project ID
    await assert.rejects(
      async () =>
        engine.createEvent({
          projectId: "",
          narrativeSequenceNumber: 1,
          chronologicalOrder: 1,
          title: "Title",
          effects: [],
        }),
      /Project ID is required/,
    );

    // Empty title
    await assert.rejects(
      async () =>
        engine.createEvent({
          projectId,
          narrativeSequenceNumber: 1,
          chronologicalOrder: 1,
          title: "   ",
          effects: [],
        }),
      /Event title cannot be empty/,
    );

    // Negative narrativeSequenceNumber
    await assert.rejects(
      async () =>
        engine.createEvent({
          projectId,
          narrativeSequenceNumber: -5,
          chronologicalOrder: 1,
          title: "Title",
          effects: [],
        }),
      /must be a non-negative integer/,
    );

    // Invalid effect operation
    await assert.rejects(
      async () =>
        engine.createEvent({
          projectId,
          narrativeSequenceNumber: 1,
          chronologicalOrder: 1,
          title: "Title",
          effects: [
            {
              targetEntity: eldrinId,
              propertyKey: "mana",
              operation: "UNSUPPORTED_OP" as any,
              value: 100,
            },
          ],
        }),
      /Invalid effect operation/,
    );
  });
});
