/**
 * @file ruleEvaluator.ts
 * @description Invariant Rule Evaluation Engine with RFC 7807 problem detail generation.
 * Block Standard: BLOCK_WORLD_STATE_FOLD_001
 */

import {
  FoldedEntityState,
  DraftProseEvent,
  ContinuityViolation,
  InvariantViolationCode,
} from "@novwrite/bridge";
import { InvariantRuleDef, InvariantRulePredicate } from "./ruleTypes.js";

/**
 * Formulates an RFC 7807 compliant problem URI.
 */
function toRfc7807Uri(code: InvariantViolationCode): string {
  const slug = code.toLowerCase().replace(/_/g, "-");
  return `https://novwrite.io/errors/invariants/${slug}`;
}

/**
 * Evaluates an Invariant Rule against a folded entity state and optional draft prose mutation.
 */
export function evaluateRule(
  rule: InvariantRuleDef,
  state: FoldedEntityState,
  draftAction?: DraftProseEvent,
): ContinuityViolation | null {
  const { predicate } = rule;

  // Category filter check
  if (predicate.targetCategory && predicate.targetCategory !== state.category) {
    return null;
  }

  switch (predicate.type) {
    case "NUMERIC_BOUNDS": {
      const propKey = predicate.propertyKey;
      const rawVal = state.computedProperties[propKey];
      if (rawVal === undefined || rawVal === null) return null;

      const numVal = Number(rawVal);
      if (isNaN(numVal)) return null;

      if (predicate.min !== undefined && numVal < predicate.min) {
        return {
          code: "INVARIANT_NUMERIC_MIN_VIOLATED",
          ruleName: rule.name,
          entityId: state.entityId,
          entityName: state.entityName,
          property: propKey,
          expectedValue: `>= ${predicate.min}`,
          calculatedValue: numVal,
          message: `Rule '${rule.name}' violated: ${state.entityName}.${propKey} is ${numVal}, which is below minimum bound (${predicate.min}).`,
          rfc7807Uri: toRfc7807Uri("INVARIANT_NUMERIC_MIN_VIOLATED"),
        };
      }

      if (predicate.max !== undefined && numVal > predicate.max) {
        return {
          code: "INVARIANT_NUMERIC_MAX_VIOLATED",
          ruleName: rule.name,
          entityId: state.entityId,
          entityName: state.entityName,
          property: propKey,
          expectedValue: `<= ${predicate.max}`,
          calculatedValue: numVal,
          message: `Rule '${rule.name}' violated: ${state.entityName}.${propKey} is ${numVal}, which exceeds maximum bound (${predicate.max}).`,
          rfc7807Uri: toRfc7807Uri("INVARIANT_NUMERIC_MAX_VIOLATED"),
        };
      }
      break;
    }

    case "STATE_GUARD": {
      const propKey = predicate.propertyKey;
      const curVal = state.computedProperties[propKey];

      // Check if entity is in the guarded state (e.g. status === 'DEAD')
      const isGuardedState =
        typeof predicate.guardedValue === "object"
          ? JSON.stringify(curVal) === JSON.stringify(predicate.guardedValue)
          : String(curVal).toUpperCase() ===
            String(predicate.guardedValue).toUpperCase();

      if (isGuardedState && draftAction) {
        // Check forbidden actions
        if (
          predicate.forbiddenActions &&
          predicate.forbiddenActions.some(
            (act) => act.toUpperCase() === draftAction.eventType.toUpperCase(),
          )
        ) {
          return {
            code: "INVARIANT_STATE_ILLEGAL_ACTION",
            ruleName: rule.name,
            entityId: state.entityId,
            entityName: state.entityName,
            property: propKey,
            expectedValue: `Action '${draftAction.eventType}' forbidden when ${propKey} is ${predicate.guardedValue}`,
            calculatedValue: {
              currentState: curVal,
              attemptedAction: draftAction.eventType,
            },
            message: `Rule '${rule.name}' violated: ${state.entityName} is ${curVal} and cannot execute action '${draftAction.eventType}'.`,
            rfc7807Uri: toRfc7807Uri("INVARIANT_STATE_ILLEGAL_ACTION"),
          };
        }

        // Check prohibited mutations
        if (predicate.prohibitedMutations && draftAction.delta) {
          for (const mutatedKey of Object.keys(draftAction.delta)) {
            if (predicate.prohibitedMutations.includes(mutatedKey)) {
              return {
                code: "INVARIANT_STATE_ILLEGAL_ACTION",
                ruleName: rule.name,
                entityId: state.entityId,
                entityName: state.entityName,
                property: mutatedKey,
                expectedValue: `Mutation on '${mutatedKey}' forbidden when ${propKey} is ${predicate.guardedValue}`,
                calculatedValue: draftAction.delta[mutatedKey],
                message: `Rule '${rule.name}' violated: Mutation of '${mutatedKey}' on ${curVal} entity ${state.entityName} is prohibited.`,
                rfc7807Uri: toRfc7807Uri("INVARIANT_STATE_ILLEGAL_ACTION"),
              };
            }
          }
        }
      }
      break;
    }

    case "PREREQUISITE": {
      const currentProp = state.computedProperties[predicate.propertyKey];
      if (currentProp !== undefined && currentProp !== null) {
        const prereqProp =
          state.computedProperties[predicate.requiredPropertyKey];
        const satisfies =
          typeof predicate.requiredValue === "object"
            ? JSON.stringify(prereqProp) ===
              JSON.stringify(predicate.requiredValue)
            : String(prereqProp) === String(predicate.requiredValue);

        if (!satisfies) {
          return {
            code: "INVARIANT_REQUIRED_PREREQUISITE_MISSING",
            ruleName: rule.name,
            entityId: state.entityId,
            entityName: state.entityName,
            property: predicate.propertyKey,
            expectedValue: `${predicate.requiredPropertyKey} = ${predicate.requiredValue}`,
            calculatedValue: prereqProp,
            message: `Rule '${rule.name}' violated: ${state.entityName} requires ${predicate.requiredPropertyKey} to be '${predicate.requiredValue}' to have ${predicate.propertyKey}.`,
            rfc7807Uri: toRfc7807Uri("INVARIANT_REQUIRED_PREREQUISITE_MISSING"),
          };
        }
      }
      break;
    }

    case "MUTUAL_EXCLUSION": {
      const valA = state.computedProperties[predicate.propertyKeyA];
      const valB = state.computedProperties[predicate.propertyKeyB];

      const matchA =
        typeof predicate.valueA === "object"
          ? JSON.stringify(valA) === JSON.stringify(predicate.valueA)
          : String(valA) === String(predicate.valueA);

      const matchB =
        typeof predicate.valueB === "object"
          ? JSON.stringify(valB) === JSON.stringify(predicate.valueB)
          : String(valB) === String(predicate.valueB);

      if (matchA && matchB) {
        return {
          code: "INVARIANT_MUTUAL_EXCLUSION_CONTRADICTION",
          ruleName: rule.name,
          entityId: state.entityId,
          entityName: state.entityName,
          property: `${predicate.propertyKeyA} & ${predicate.propertyKeyB}`,
          expectedValue: `Mutually exclusive states`,
          calculatedValue: {
            [predicate.propertyKeyA]: valA,
            [predicate.propertyKeyB]: valB,
          },
          message: `Rule '${rule.name}' violated: ${state.entityName} cannot simultaneously hold ${predicate.propertyKeyA}='${valA}' and ${predicate.propertyKeyB}='${valB}'.`,
          rfc7807Uri: toRfc7807Uri("INVARIANT_MUTUAL_EXCLUSION_CONTRADICTION"),
        };
      }
      break;
    }
  }

  return null;
}
