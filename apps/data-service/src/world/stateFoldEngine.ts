/**
 * @file stateFoldEngine.ts
 * @description 4-Step Deterministic State Fold Engine and Continuity Auditor.
 * Block Standard: BLOCK_WORLD_STATE_FOLD_001
 */

import {
  EntityCategory,
  FoldedEntityState,
  ActiveConstraint,
  SceneGroundingRequest,
  SceneGroundingResponse,
  ContinuityAuditRequest,
  ContinuityAuditResponse,
  ContinuityViolation,
  DraftProseEvent,
} from "@novwrite/bridge";
import { applyEffectToEntityState } from "./effectApplier.js";
import { InvariantRuleDef } from "./ruleTypes.js";
import { evaluateRule } from "./ruleEvaluator.js";
import { EventEffectPayload } from "./timelineTypes.js";

export interface BaseEntityInput {
  id: string;
  name: string;
  category: EntityCategory;
  baseProperties?: Record<string, unknown>;
}

export interface DatabaseStateFoldClient {
  timelineEvent: {
    findMany: (args: any) => Promise<any[]>;
  };
  invariantRule: {
    findMany: (args: any) => Promise<any[]>;
    create?: (args: any) => Promise<any>;
    delete?: (args: any) => Promise<any>;
  };
}

export class StateFoldEngine {
  private db: DatabaseStateFoldClient;

  constructor(dbClient: DatabaseStateFoldClient) {
    if (!dbClient) {
      throw new Error(
        "BLOCK_WORLD_STATE_FOLD_001: Database client is required for StateFoldEngine",
      );
    }
    this.db = dbClient;
  }

  /**
   * 4-Step State Fold: Replays timeline event deltas up to targetSequenceNumber.
   */
  async foldStateAtSequence(
    projectId: string,
    targetSequenceNumber: number,
    baseEntities: BaseEntityInput[],
  ): Promise<Map<string, FoldedEntityState>> {
    // 1. Initialize entity state accumulator
    const stateMap = new Map<string, FoldedEntityState>();
    for (const entity of baseEntities) {
      stateMap.set(entity.id, {
        entityId: entity.id,
        entityName: entity.name,
        category: entity.category,
        computedProperties: { ...(entity.baseProperties || {}) },
        lastMutatedSeqNumber: 0,
      });
    }

    // 2. Fetch timeline events up to target sequence number in narrative order
    const events = await this.db.timelineEvent.findMany({
      where: {
        projectId,
        narrativeSequenceNumber: {
          lte: targetSequenceNumber,
        },
      },
      orderBy: {
        narrativeSequenceNumber: "asc",
      },
      include: {
        effects: true,
      },
    });

    // 3. Sequentially fold event effects
    for (const event of events) {
      const seqNum = event.narrativeSequenceNumber;
      for (const eff of event.effects || []) {
        const entityId = eff.targetEntity;
        let entityState = stateMap.get(entityId);
        if (!entityState) {
          // If entity was not in base list, dynamically initialize it
          entityState = {
            entityId,
            entityName: `Entity_${entityId.substring(0, 8)}`,
            category: "CHARACTER",
            computedProperties: {},
            lastMutatedSeqNumber: seqNum,
          };
          stateMap.set(entityId, entityState);
        }

        const effectPayload: EventEffectPayload = {
          id: eff.id,
          eventId: eff.eventId,
          targetEntity: eff.targetEntity,
          propertyKey: eff.propertyKey,
          operation: eff.operation,
          value: eff.value,
        };

        entityState.computedProperties = applyEffectToEntityState(
          entityState.computedProperties,
          effectPayload,
        );
        entityState.lastMutatedSeqNumber = seqNum;
      }
    }

    return stateMap;
  }

  /**
   * Grounds a scene by folding state at targetSequenceNumber and returning active constraints.
   */
  async groundScene(
    request: SceneGroundingRequest,
    baseEntities: BaseEntityInput[],
  ): Promise<SceneGroundingResponse> {
    const foldedMap = await this.foldStateAtSequence(
      request.projectId,
      request.targetSequenceNumber,
      baseEntities,
    );

    // Retrieve active invariant rules
    const rules = await this.getActiveRules(request.projectId);

    // Filter folded states for mentioned entities (or all if mentioned list is empty)
    const filteredStates: FoldedEntityState[] = [];
    if (request.mentionedEntityIds && request.mentionedEntityIds.length > 0) {
      for (const id of request.mentionedEntityIds) {
        const state = foldedMap.get(id);
        if (state) filteredStates.push(state);
      }
    } else {
      filteredStates.push(...Array.from(foldedMap.values()));
    }

    const activeConstraints: ActiveConstraint[] = rules.map((r) => ({
      ruleId: r.id,
      ruleName: r.name,
      severity: r.severity,
      scope: r.predicate.type,
    }));

    return {
      sceneId: request.sceneId,
      sequenceNumber: request.targetSequenceNumber,
      foldedStates: filteredStates,
      activeConstraints,
    };
  }

  /**
   * Audits continuity for drafted prose events against universe state and invariant rules.
   */
  async auditContinuity(
    request: ContinuityAuditRequest,
    baseEntities: BaseEntityInput[],
  ): Promise<ContinuityAuditResponse> {
    const foldedMap = await this.foldStateAtSequence(
      request.projectId,
      request.sequenceNumber,
      baseEntities,
    );

    const rules = await this.getActiveRules(request.projectId);
    const violations: ContinuityViolation[] = [];

    // 1. Audit current folded state against all invariant rules
    for (const state of foldedMap.values()) {
      for (const rule of rules) {
        const violation = evaluateRule(rule, state);
        if (violation) {
          violations.push(violation);
        }
      }
    }

    // 2. Audit draft prose events against active state & simulate post-draft state
    for (const draft of request.draftEvents || []) {
      const entityState = foldedMap.get(draft.entityId);
      if (!entityState) continue;

      // Check state guard violations on the attempted action
      for (const rule of rules) {
        const actionViolation = evaluateRule(rule, entityState, draft);
        if (actionViolation) {
          violations.push(actionViolation);
        }
      }

      // Simulate proposed delta mutations onto a candidate simulated state
      if (draft.delta && Object.keys(draft.delta).length > 0) {
        const simulatedProps = { ...entityState.computedProperties };
        for (const [key, val] of Object.entries(draft.delta)) {
          if (
            typeof val === "number" &&
            typeof simulatedProps[key] === "number"
          ) {
            // If delta is relative subtraction / addition
            simulatedProps[key] = (Number(simulatedProps[key]) || 0) + val;
          } else {
            simulatedProps[key] = val;
          }
        }

        const simulatedState: FoldedEntityState = {
          ...entityState,
          computedProperties: simulatedProps,
        };

        // Check rules against candidate simulated state (e.g. numeric underflow)
        for (const rule of rules) {
          const simViolation = evaluateRule(rule, simulatedState);
          if (simViolation) {
            violations.push(simViolation);
          }
        }
      }
    }

    return {
      sceneId: request.sceneId,
      sequenceNumber: request.sequenceNumber,
      status: violations.length > 0 ? "VIOLATION_DETECTED" : "CLEAN",
      violations,
    };
  }

  private async getActiveRules(projectId: string): Promise<InvariantRuleDef[]> {
    const records = await this.db.invariantRule.findMany({
      where: { projectId },
    });

    return records.map((r: any) => ({
      id: r.id,
      projectId: r.projectId,
      name: r.name,
      severity: r.severity,
      predicate: r.predicate,
      description: r.description,
    }));
  }
}
