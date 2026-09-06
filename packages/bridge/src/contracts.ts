/**
 * @file contracts.ts
 * @description Zod runtime validation schemas for NovWrite cross-domain RPC payloads.
 * Block Standard: BLOCK_COMM_BRIDGE_CONTRACT_001
 */

import { z } from "zod";

export const EntityCategorySchema = z.enum([
  "CHARACTER",
  "LOCATION",
  "ARTIFACT",
  "FACTION",
  "LORE_CONCEPT",
]);

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
  entityId: z.string().uuid(),
  entityName: z.string().min(1),
  category: EntityCategorySchema,
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
  entityId: z.string().uuid(),
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
  categoryLimit: z.array(EntityCategorySchema).optional(),
});

export const EntityCandidateMatchSchema = z.object({
  entityId: z.string().uuid(),
  name: z.string().min(1),
  category: EntityCategorySchema,
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
