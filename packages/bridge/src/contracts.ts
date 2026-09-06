/**
 * @file contracts.ts
 * @description Zod runtime validation schemas for NovWrite cross-domain RPC payloads.
 * Block Standard: BLOCK_COMM_BRIDGE_CONTRACT_001
 */

import { z } from "zod";

export const BlueprintClassSchema = z.enum(["FIRST_CLASS", "SECOND_CLASS"]);

export const BlueprintFieldTypeSchema = z.enum([
  "STRING",
  "NUMBER",
  "BOOLEAN",
  "ENUM",
  "VALUE_TYPE",
  "BLUEPRINT_REF",
  "FORMULA",
]);

export const ValueTypeOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
  power: z.number().optional(),
});

export const EnumOptionSchema = ValueTypeOptionSchema;

export const DynamicFieldDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  fieldType: BlueprintFieldTypeSchema,
  options: z.array(z.union([z.string(), EnumOptionSchema])).optional(),
  targetBlueprintId: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  unit: z.string().optional(),
  formulaExpression: z.string().optional(),
  isRequired: z.boolean().optional(),
  orderIndex: z.number().optional(),
});

export const BlueprintDefSchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  name: z.string().min(1),
  slug: z.string().optional(),
  blueprintClass: BlueprintClassSchema,
  category: z.string().min(1),
  description: z.string().optional(),
  iconName: z.string().optional(),
  fields: z.array(DynamicFieldDefSchema),
  isBuiltIn: z.boolean().optional(),
});

export const EntityItemSchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  blueprintId: z.string(),
  name: z.string().min(1),
  aliases: z.array(z.string()).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  properties: z.record(z.unknown()),
  computedFormulas: z.record(z.number()).optional(),
  status: z.string().optional(),
  lastMutatedSeqNumber: z.number().int().nonnegative().optional(),
});

export const EntityCategorySchema = z.string();

export const InvariantSeveritySchema = z.enum([
  "BLOCKING_ERROR",
  "WARNING",
  "ADVISORY_NOTE",
]);

export const InvariantViolationCodeSchema = z.enum([
  "INVARIANT_NUMERIC_MIN_VIOLATED",
  "INVARIANT_NUMERIC_MAX_VIOLATED",
  "INVARIANT_STATE_ILLEGAL_ACTION",
  "INVARIANT_REQUIRED_PREREQUISITE_MISSING",
  "INVARIANT_MUTUAL_EXCLUSION_CONTRADICTION",
]);

export const FoldedEntityStateSchema = z.object({
  entityId: z.string(),
  entityName: z.string().min(1),
  category: z.string(),
  computedProperties: z.record(z.unknown()),
  lastMutatedSeqNumber: z.number().int().nonnegative(),
});

export const ActiveConstraintSchema = z.object({
  ruleId: z.string().min(1),
  ruleName: z.string().min(1),
  severity: InvariantSeveritySchema,
  scope: z.string(),
});

export const SceneGroundingRequestSchema = z.object({
  projectId: z.string().uuid(),
  sceneId: z.string().uuid(),
  targetSequenceNumber: z.number().int().nonnegative(),
  mentionedEntityIds: z.array(z.string().uuid()),
});

export const SceneGroundingResponseSchema = z.object({
  sceneId: z.string().uuid(),
  sequenceNumber: z.number().int().nonnegative(),
  foldedStates: z.array(FoldedEntityStateSchema),
  activeConstraints: z.array(ActiveConstraintSchema),
});

export const DraftProseEventSchema = z.object({
  entityId: z.string().uuid(),
  eventType: z.string().min(1),
  delta: z.record(z.unknown()),
  claimedState: z.record(z.unknown()).optional(),
});

export const ContinuityAuditRequestSchema = z.object({
  projectId: z.string().uuid(),
  sceneId: z.string().uuid(),
  sequenceNumber: z.number().int().nonnegative(),
  draftEvents: z.array(DraftProseEventSchema),
});

export const ContinuityViolationSchema = z.object({
  code: InvariantViolationCodeSchema,
  ruleName: z.string().min(1),
  entityId: z.string(),
  entityName: z.string().min(1),
  property: z.string().min(1),
  expectedValue: z.unknown(),
  calculatedValue: z.unknown(),
  message: z.string().min(1),
  rfc7807Uri: z.string().url(),
});

export const ContinuityAuditResponseSchema = z.object({
  sceneId: z.string().uuid(),
  sequenceNumber: z.number().int().nonnegative(),
  status: z.enum(["CLEAN", "VIOLATION_DETECTED"]),
  violations: z.array(ContinuityViolationSchema),
});

export const EntityMentionQuerySchema = z.object({
  projectId: z.string().uuid(),
  queryToken: z.string().min(1),
  categoryLimit: z.array(z.string()).optional(),
});

export const EntityCandidateMatchSchema = z.object({
  entityId: z.string().uuid(),
  name: z.string().min(1),
  category: z.string(),
  snippet: z.string(),
  currentRealmOrStatus: z.string().optional(),
});

export const EntityMentionResponseSchema = z.object({
  queryToken: z.string().min(1),
  matches: z.array(EntityCandidateMatchSchema),
});

/**
 * Validate incoming SceneGroundingRequest with structured error details
 */
export function validateSceneGroundingRequest(payload: unknown) {
  const result = SceneGroundingRequestSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(
      `BLOCK_COMM_BRIDGE_CONTRACT_001: Invalid SceneGroundingRequest: ${result.error.message}`,
    );
  }
  return result.data;
}

/**
 * Validate incoming ContinuityAuditRequest with structured error details
 */
export function validateContinuityAuditRequest(payload: unknown) {
  const result = ContinuityAuditRequestSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(
      `BLOCK_COMM_BRIDGE_CONTRACT_001: Invalid ContinuityAuditRequest: ${result.error.message}`,
    );
  }
  return result.data;
}

/**
 * Validate incoming EntityMentionQuery with structured error details
 */
export function validateEntityMentionQuery(payload: unknown) {
  const result = EntityMentionQuerySchema.safeParse(payload);
  if (!result.success) {
    throw new Error(
      `BLOCK_COMM_BRIDGE_CONTRACT_001: Invalid EntityMentionQuery: ${result.error.message}`,
    );
  }
  return result.data;
}
