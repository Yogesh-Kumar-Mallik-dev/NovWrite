/**
 * @file ruleTypes.ts
 * @description Domain types and predicates for universe invariant rules and continuity validation.
 * Block Standard: BLOCK_WORLD_STATE_FOLD_001
 */

import {
  EntityCategory,
  InvariantSeverity,
  InvariantViolationCode,
  ContinuityViolation,
} from "@novwrite/bridge";

export type PredicateType =
  "NUMERIC_BOUNDS" | "STATE_GUARD" | "PREREQUISITE" | "MUTUAL_EXCLUSION";

export interface NumericBoundsPredicate {
  type: "NUMERIC_BOUNDS";
  propertyKey: string;
  min?: number;
  max?: number;
  targetCategory?: EntityCategory;
}

export interface StateGuardPredicate {
  type: "STATE_GUARD";
  propertyKey: string;
  guardedValue: unknown; // e.g. status === 'DEAD'
  forbiddenActions?: string[]; // e.g. ['CAST_SPELL', 'ATTACK']
  prohibitedMutations?: string[]; // e.g. ['mana_capacity']
  targetCategory?: EntityCategory;
}

export interface PrerequisitePredicate {
  type: "PREREQUISITE";
  propertyKey: string;
  requiredPropertyKey: string;
  requiredValue: unknown;
  targetCategory?: EntityCategory;
}

export interface MutualExclusionPredicate {
  type: "MUTUAL_EXCLUSION";
  propertyKeyA: string;
  valueA: unknown;
  propertyKeyB: string;
  valueB: unknown;
  targetCategory?: EntityCategory;
}

export type InvariantRulePredicate =
  | NumericBoundsPredicate
  | StateGuardPredicate
  | PrerequisitePredicate
  | MutualExclusionPredicate;

export interface InvariantRuleDef {
  id: string;
  projectId: string;
  name: string;
  severity: InvariantSeverity;
  predicate: InvariantRulePredicate;
  description?: string | null;
}
