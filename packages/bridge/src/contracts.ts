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
  "ARRAY",
  "BLUEPRINT_REF",
  "ARRAY_REF",
  "FORMULA",
]);

export const ValueTypeOptionSchema = z.object({
  label: z.string(),
  value: z.preprocess(
    (val) =>
      typeof val === "string"
        ? val
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_\.]/g, "_")
        : val,
    z.string().min(1),
  ),
  power: z.number().optional(),
});

export const EnumOptionSchema = ValueTypeOptionSchema;

export const DynamicFieldDefSchema = z.object({
  id: z.string(),
  name: z.preprocess(
    (val) =>
      typeof val === "string"
        ? val
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_\.]/g, "")
        : val,
    z.string().min(1),
  ),
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
  fields: z.array(DynamicFieldDefSchema).refine(
    (fields) => {
      const names = fields.map((f) => f.name.toLowerCase().trim());
      return new Set(names).size === names.length;
    },
    {
      message:
        "Duplicate field machine keys are not allowed in a blueprint schema",
    },
  ),
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

// =====================================
// Bitemporal & Dual-Axis Zod Schemas
// =====================================

export const RevisionTypeSchema = z.enum([
  "TYPO_FIX",
  "BASELINE_EDIT",
  "RETROACTIVE_PLOT_FIX",
  "REVERT",
]);

export const EntityRevisionPatchSchema = z.object({
  name: z.object({ before: z.string(), after: z.string() }).optional(),
  description: z.object({ before: z.string(), after: z.string() }).optional(),
  category: z.object({ before: z.string(), after: z.string() }).optional(),
  propertiesChanged: z
    .record(z.object({ before: z.unknown(), after: z.unknown() }))
    .optional(),
  formulasChanged: z
    .record(z.object({ before: z.number(), after: z.number() }))
    .optional(),
});

export const EntityRevisionSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  projectId: z.string().optional(),
  parentRevisionId: z.string().nullable(),
  revisionNumber: z.number().int().nonnegative(),
  createdAt: z.string(),
  type: RevisionTypeSchema,
  authorNote: z.string().optional(),
  patch: EntityRevisionPatchSchema,
  snapshot: EntityItemSchema,
});

export const BitemporalCoordinateQuerySchema = z.object({
  entityId: z.string(),
  projectId: z.string().optional(),
  targetSequenceNumber: z.number().int().nonnegative().optional(),
  targetRevisionId: z.string().optional(),
});

export const BitemporalEntityStateSchema = z.object({
  entityId: z.string(),
  entityName: z.string(),
  category: z.string(),
  narrativeSequenceNumber: z.number().int().nonnegative(),
  revisionId: z.string(),
  revisionNumber: z.number().int().nonnegative(),
  revisionType: RevisionTypeSchema,
  properties: z.record(z.unknown()),
  computedFormulas: z.record(z.number()).optional(),
  appliedEventsCount: z.number().int().nonnegative(),
  activeMutations: z.array(
    z.object({
      eventId: z.string(),
      eventTitle: z.string(),
      sequenceNumber: z.number().int().nonnegative(),
      propertyKey: z.string(),
      operation: z.string(),
      value: z.unknown(),
    }),
  ),
});

export function validateEntityRevision(payload: unknown) {
  const result = EntityRevisionSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(
      `BLOCK_COMM_BRIDGE_CONTRACT_001: Invalid EntityRevision: ${result.error.message}`,
    );
  }
  return result.data;
}

export function validateBitemporalCoordinateQuery(payload: unknown) {
  const result = BitemporalCoordinateQuerySchema.safeParse(payload);
  if (!result.success) {
    throw new Error(
      `BLOCK_COMM_BRIDGE_CONTRACT_001: Invalid BitemporalCoordinateQuery: ${result.error.message}`,
    );
  }
  return result.data;
}

export const EditNodeSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  childrenIds: z.array(z.string()),
  revisionNumber: z.number().int().nonnegative(),
  label: z.string().optional(),
  authorNote: z.string().optional(),
  type: RevisionTypeSchema,
  createdAt: z.string(),
  patch: z.unknown().optional(),
  snapshot: z.unknown(),
});

export const EditTreeSchema = z.object({
  rootId: z.string(),
  activeEditId: z.string(),
  nodes: z.record(EditNodeSchema),
});

// =====================================
// Differential State Patching Helpers
// =====================================

export const JSONPatchOpSchema = z.object({
  op: z.enum(["add", "remove", "replace"]),
  path: z.string(),
  value: z.unknown().optional(),
  from: z.string().optional(),
});

export const JSONPatchSchema = z.array(JSONPatchOpSchema);

/**
 * Compute differential state patches between two property maps (RFC 6902-style).
 */
export function diffEntityProperties(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): Array<{ op: "add" | "remove" | "replace"; path: string; value?: unknown }> {
  const patches: Array<{
    op: "add" | "remove" | "replace";
    path: string;
    value?: unknown;
  }> = [];
  const b = before || {};
  const a = after || {};
  const allKeys = new Set([...Object.keys(b), ...Object.keys(a)]);

  for (const key of allKeys) {
    const hasBefore = Object.prototype.hasOwnProperty.call(b, key);
    const hasAfter = Object.prototype.hasOwnProperty.call(a, key);

    if (!hasBefore && hasAfter) {
      patches.push({ op: "add", path: `/${key}`, value: a[key] });
    } else if (hasBefore && !hasAfter) {
      patches.push({ op: "remove", path: `/${key}` });
    } else if (hasBefore && hasAfter) {
      if (JSON.stringify(b[key]) !== JSON.stringify(a[key])) {
        patches.push({ op: "replace", path: `/${key}`, value: a[key] });
      }
    }
  }

  return patches;
}

/**
 * Apply differential state patches to a property map.
 */
export function applyEntityPatch(
  target: Record<string, unknown> | null | undefined,
  patches: Array<{
    op: "add" | "remove" | "replace";
    path: string;
    value?: unknown;
  }>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...(target || {}) };

  for (const patch of patches) {
    const key = patch.path.replace(/^\//, "");
    if (patch.op === "remove") {
      delete result[key];
    } else if (patch.op === "add" || patch.op === "replace") {
      result[key] = patch.value;
    }
  }

  return result;
}

// =====================================
// Multi-User Hierarchy & Auth Zod Schemas
// =====================================

export const UserRoleSchema = z.enum(["USER", "ADMIN", "SUPER_ADMIN"]);

export const UserAccountSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(2),
  role: UserRoleSchema,
  isPlatformAdmin: z.boolean(),
  mfaEnabled: z.boolean(),
  accountStatus: z.enum(["ACTIVE", "SUSPENDED", "LOCKED"]),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const CreateUserRequestSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2),
  password: z.string().min(6).optional(),
  role: UserRoleSchema.optional(),
});

export const UpdateUserRoleRequestSchema = z.object({
  role: UserRoleSchema,
  reason: z.string().optional(),
});

export const AuthLoginRequestSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().optional(),
});

export const AuthLoginResponseSchema = z.object({
  token: z.string().min(1),
  user: UserAccountSchema,
  expiresIn: z.number().int().positive(),
});

export function validateUserAccount(payload: unknown) {
  const result = UserAccountSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(
      `BLOCK_COMM_BRIDGE_CONTRACT_001: Invalid UserAccount: ${result.error.message}`,
    );
  }
  return result.data;
}

export function validateCreateUserRequest(payload: unknown) {
  const result = CreateUserRequestSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(
      `BLOCK_COMM_BRIDGE_CONTRACT_001: Invalid CreateUserRequest: ${result.error.message}`,
    );
  }
  return result.data;
}
