/**
 * @file mock.ts
 * @description In-memory mock implementation of the NovWrite cross-domain bridge.
 * Block Standard: BLOCK_COMM_BRIDGE_MOCK_001
 */

import {
  SceneGroundingRequest,
  SceneGroundingResponse,
  ContinuityAuditRequest,
  ContinuityAuditResponse,
  EntityMentionQuery,
  EntityMentionResponse,
  FoldedEntityState,
  ContinuityViolation,
} from "./types.js";

export const DEMO_PROJECT_ID = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d";
export const ELDRIN_ENTITY_ID = "e1111111-1111-1111-1111-111111111111";
export const LYRA_ENTITY_ID = "e2222222-2222-2222-2222-222222222222";
export const MALAKOR_ENTITY_ID = "e3333333-3333-3333-3333-333333333333";
export const CITADEL_LOCATION_ID = "e4444444-4444-4444-4444-444444444444";

export class MockBridgeService {
  private foldedEntities: Map<string, FoldedEntityState> = new Map();

  constructor() {
    this.initDefaultEntities();
  }

  private initDefaultEntities() {
    this.foldedEntities.set(ELDRIN_ENTITY_ID, {
      entityId: ELDRIN_ENTITY_ID,
      entityName: "Eldrin the Spellblade",
      category: "CHARACTER",
      computedProperties: {
        status: "ALIVE",
        mana_capacity: 500,
        cultivation_realm: "Foundation Establishment",
        faction: "Astral Order",
      },
      lastMutatedSeqNumber: 50,
    });

    this.foldedEntities.set(LYRA_ENTITY_ID, {
      entityId: LYRA_ENTITY_ID,
      entityName: "Lyra of the Astral Veil",
      category: "CHARACTER",
      computedProperties: {
        status: "ALIVE",
        mana_capacity: 800,
        cultivation_realm: "Core Formation",
        faction: "Astral Order",
      },
      lastMutatedSeqNumber: 80,
    });

    this.foldedEntities.set(MALAKOR_ENTITY_ID, {
      entityId: MALAKOR_ENTITY_ID,
      entityName: "Lord Malakor",
      category: "CHARACTER",
      computedProperties: {
        status: "DEAD",
        mana_capacity: 0,
        cultivation_realm: "Core Formation",
        faction: "Void Harbingers",
      },
      lastMutatedSeqNumber: 150,
    });
  }

  async getSceneGrounding(
    req: SceneGroundingRequest,
  ): Promise<SceneGroundingResponse> {
    const states: FoldedEntityState[] = [];

    for (const id of req.mentionedEntityIds) {
      const entity = this.foldedEntities.get(id);
      if (entity) {
        states.push(entity);
      }
    }

    return {
      sceneId: req.sceneId,
      sequenceNumber: req.targetSequenceNumber,
      foldedStates: states,
      activeConstraints: [
        {
          ruleId: "r001-mana-non-negativity",
          ruleName: "Mana Non-Negativity Invariant",
          severity: "BLOCKING_ERROR",
          scope: "GLOBAL",
        },
        {
          ruleId: "r002-deceased-no-spells",
          ruleName: "Deceased Entity Action Constraint",
          severity: "BLOCKING_ERROR",
          scope: "GLOBAL",
        },
      ],
    };
  }

  async validateProseContinuity(
    req: ContinuityAuditRequest,
  ): Promise<ContinuityAuditResponse> {
    const violations: ContinuityViolation[] = [];

    for (const draft of req.draftEvents) {
      if (draft.entityId === MALAKOR_ENTITY_ID) {
        violations.push({
          code: "INVARIANT_STATE_ILLEGAL_ACTION",
          ruleName: "Deceased Entity Action Constraint",
          entityId: MALAKOR_ENTITY_ID,
          entityName: "Lord Malakor",
          property: "status",
          expectedValue: "ALIVE",
          calculatedValue: "DEAD",
          message:
            "BLOCK_COMM_BRIDGE_MOCK_001: Lord Malakor is marked DEAD at Seq #150 and cannot execute CAST_SPELL.",
          rfc7807Uri:
            "https://api.novwrite.com/errors/INVARIANT_STATE_ILLEGAL_ACTION",
        });
      }

      if (draft.delta && typeof draft.delta["mana_cost"] === "number") {
        const cost = draft.delta["mana_cost"] as number;
        if (cost > 500 && draft.entityId === ELDRIN_ENTITY_ID) {
          violations.push({
            code: "INVARIANT_NUMERIC_MIN_VIOLATED",
            ruleName: "Mana Non-Negativity Invariant",
            entityId: ELDRIN_ENTITY_ID,
            entityName: "Eldrin the Spellblade",
            property: "mana_capacity",
            expectedValue: ">= 0",
            calculatedValue: 500 - cost,
            message: `BLOCK_COMM_BRIDGE_MOCK_001: Spell cost (${cost}) exceeds Eldrin's remaining mana (500), causing underflow.`,
            rfc7807Uri:
              "https://api.novwrite.com/errors/INVARIANT_NUMERIC_MIN_VIOLATED",
          });
        }
      }
    }

    return {
      sceneId: req.sceneId,
      sequenceNumber: req.sequenceNumber,
      status: violations.length > 0 ? "VIOLATION_DETECTED" : "CLEAN",
      violations,
    };
  }

  async suggestEntityMentions(
    req: EntityMentionQuery,
  ): Promise<EntityMentionResponse> {
    const query = req.queryToken.toLowerCase();
    const matches = [];

    for (const entity of this.foldedEntities.values()) {
      if (entity.entityName.toLowerCase().includes(query)) {
        matches.push({
          entityId: entity.entityId,
          name: entity.entityName,
          category: entity.category,
          snippet: `Faction: ${entity.computedProperties["faction"]} · Status: ${entity.computedProperties["status"]}`,
          currentRealmOrStatus: entity.computedProperties[
            "cultivation_realm"
          ] as string,
        });
      }
    }

    return {
      queryToken: req.queryToken,
      matches,
    };
  }
}
