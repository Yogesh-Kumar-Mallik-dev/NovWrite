/**
 * @file revisionEngine.test.ts
 * @description Unit tests for Bitemporal & Dual-Axis Revision Engine (Phase W6).
 * Block Standard: BLOCK_TEST_REVISION_ENGINE_001
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RevisionEngine } from "../world/revisionEngine.js";
import { EntityItem } from "@novwrite/bridge";
import { TimelineEventHydrated } from "../world/timelineTypes.js";

describe("Bitemporal & Dual-Axis Entity Revision Engine", () => {
  const eldrinId = "ent-eldrin-1";

  const initialEntity: EntityItem = {
    id: eldrinId,
    projectId: "proj-1",
    blueprintId: "bp-character",
    name: "Eldrin",
    category: "Character",
    description: "Young swordsman from North",
    properties: {
      strength: 10,
      agility: 12,
      eyes: "Green",
      titles: ["Apprentice"],
    },
    computedFormulas: {
      combat_power: 22,
    },
  };

  it("BLOCK_TEST_REVISION_ENGINE_001: should record initial revision and compute full baseline patch", () => {
    const engine = new RevisionEngine();
    const rev0 = engine.recordRevision(initialEntity, "BASELINE_EDIT", "Initial character profile");

    assert.equal(rev0.revisionNumber, 0);
    assert.equal(rev0.parentRevisionId, null);
    assert.equal(rev0.type, "BASELINE_EDIT");
    assert.equal(rev0.authorNote, "Initial character profile");
    assert.equal(rev0.patch.name?.after, "Eldrin");
    assert.equal(rev0.snapshot.properties.eyes, "Green");
  });

  it("BLOCK_TEST_REVISION_ENGINE_001: should track TYPO_FIX and BASELINE_EDIT revisions with precise deltas", () => {
    const engine = new RevisionEngine();
    const rev0 = engine.recordRevision(initialEntity, "BASELINE_EDIT", "Initial profile");

    // Rev 1: Typo fix in description
    const entityRev1: EntityItem = {
      ...initialEntity,
      description: "Young swordsman from the Northern Frostlands",
    };
    const rev1 = engine.recordRevision(entityRev1, "TYPO_FIX", "Fixed typo in origin description");

    assert.equal(rev1.revisionNumber, 1);
    assert.equal(rev1.parentRevisionId, rev0.id);
    assert.equal(rev1.type, "TYPO_FIX");
    assert.equal(rev1.patch.description?.before, "Young swordsman from North");
    assert.equal(rev1.patch.description?.after, "Young swordsman from the Northern Frostlands");

    // Rev 2: Baseline stat adjustment (eyes to Blue, strength to 15)
    const entityRev2: EntityItem = {
      ...entityRev1,
      properties: {
        ...entityRev1.properties,
        eyes: "Blue",
        strength: 15,
      },
      computedFormulas: {
        combat_power: 27,
      },
    };
    const rev2 = engine.recordRevision(entityRev2, "BASELINE_EDIT", "Changed eye color and buffed base strength");

    assert.equal(rev2.revisionNumber, 2);
    assert.equal(rev2.parentRevisionId, rev1.id);
    assert.equal(rev2.patch.propertiesChanged?.eyes.before, "Green");
    assert.equal(rev2.patch.propertiesChanged?.eyes.after, "Blue");
    assert.equal(rev2.patch.propertiesChanged?.strength.before, 10);
    assert.equal(rev2.patch.propertiesChanged?.strength.after, 15);
    assert.equal(rev2.patch.formulasChanged?.combat_power.before, 22);
    assert.equal(rev2.patch.formulasChanged?.combat_power.after, 27);

    const history = engine.getRevisions(eldrinId);
    assert.equal(history.length, 3);
  });

  it("BLOCK_TEST_REVISION_ENGINE_001: should support infinite reversibility via immutable REVERT revisions", () => {
    const engine = new RevisionEngine();
    const rev0 = engine.recordRevision(initialEntity, "BASELINE_EDIT", "Initial profile");

    const entityRev1: EntityItem = {
      ...initialEntity,
      name: "Eldrin the Vanguard",
      properties: { ...initialEntity.properties, strength: 50 },
    };
    const rev1 = engine.recordRevision(entityRev1, "BASELINE_EDIT", "Overpowered boost");

    // Revert back to rev0
    const { restoredEntity, revision: rev2 } = engine.revertToRevision(
      eldrinId,
      rev0.id,
      "Reverting accidental stat inflation",
    );

    assert.equal(rev2.revisionNumber, 2);
    assert.equal(rev2.type, "REVERT");
    assert.equal(rev2.parentRevisionId, rev1.id);
    assert.equal(restoredEntity.name, "Eldrin");
    assert.equal(restoredEntity.properties.strength, 10);
    assert.equal(rev2.patch.name?.before, "Eldrin the Vanguard");
    assert.equal(rev2.patch.name?.after, "Eldrin");

    // Check full history remains intact
    const all = engine.getRevisions(eldrinId);
    assert.equal(all.length, 3);
  });

  it("BLOCK_TEST_REVISION_ENGINE_001: should resolve deterministic bitemporal state at (T_narrative, T_revision)", () => {
    const engine = new RevisionEngine();
    const rev0 = engine.recordRevision(initialEntity, "BASELINE_EDIT", "Rev 0: Base Eldrin (Strength: 10, Eyes: Green)");

    const entityRev1: EntityItem = {
      ...initialEntity,
      properties: { ...initialEntity.properties, eyes: "Azure Blue", strength: 14 },
    };
    const rev1 = engine.recordRevision(entityRev1, "BASELINE_EDIT", "Rev 1: Visual tweak (Strength: 14, Eyes: Azure Blue)");

    // Plot Events (Narrative Time Axis)
    const events: TimelineEventHydrated[] = [
      {
        id: "ev-10",
        projectId: "proj-1",
        narrativeSequenceNumber: 10,
        chronologicalOrder: 10,
        title: "Chapter 1: Trial of Winds",
        createdAt: new Date(),
        effects: [
          {
            id: "eff-1",
            eventId: "ev-10",
            targetEntity: eldrinId,
            propertyKey: "strength",
            operation: "INCREMENT",
            value: 5,
          },
        ],
      },
      {
        id: "ev-50",
        projectId: "proj-1",
        narrativeSequenceNumber: 50,
        chronologicalOrder: 50,
        title: "Chapter 5: Severing of Arm",
        createdAt: new Date(),
        effects: [
          {
            id: "eff-2",
            eventId: "ev-50",
            targetEntity: eldrinId,
            propertyKey: "status",
            operation: "SET",
            value: "INJURED",
          },
          {
            id: "eff-3",
            eventId: "ev-50",
            targetEntity: eldrinId,
            propertyKey: "titles",
            operation: "APPEND",
            value: "One-Armed Swordsman",
          },
        ],
      },
    ];

    // Coordinate 1: Plot Seq 0, Rev 0
    const coord1 = engine.resolveAtCoordinate(eldrinId, 0, rev0.id, events);
    assert.equal(coord1.properties.strength, 10);
    assert.equal(coord1.properties.eyes, "Green");
    assert.equal(coord1.appliedEventsCount, 0);

    // Coordinate 2: Plot Seq 10, Rev 0 (Strength 10 + 5 = 15)
    const coord2 = engine.resolveAtCoordinate(eldrinId, 10, rev0.id, events);
    assert.equal(coord2.properties.strength, 15);
    assert.equal(coord2.properties.eyes, "Green");
    assert.equal(coord2.appliedEventsCount, 1);

    // Coordinate 3: Plot Seq 10, Rev 1 (Strength 14 + 5 = 19, Eyes: Azure Blue)
    const coord3 = engine.resolveAtCoordinate(eldrinId, 10, rev1.id, events);
    assert.equal(coord3.properties.strength, 19);
    assert.equal(coord3.properties.eyes, "Azure Blue");
    assert.equal(coord3.appliedEventsCount, 1);

    // Coordinate 4: Plot Seq 50, Rev 1 (Strength 19, Status: INJURED, Titles includes One-Armed Swordsman)
    const coord4 = engine.resolveAtCoordinate(eldrinId, 50, rev1.id, events);
    assert.equal(coord4.properties.strength, 19);
    assert.equal(coord4.properties.status, "INJURED");
    assert.deepEqual(coord4.properties.titles, ["Apprentice", "One-Armed Swordsman"]);
    assert.equal(coord4.appliedEventsCount, 3);
  });
});
