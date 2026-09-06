/**
 * @file types.ts
 * @description Core TypeScript type definitions for the NovWrite cross-domain communication bridge.
 * Block Standard: BLOCK_COMM_BRIDGE_TYPES_001
 */

export type EntityCategory =
  "CHARACTER" | "LOCATION" | "ARTIFACT" | "FACTION" | "LORE_CONCEPT";

export type InvariantSeverity = "BLOCKING_ERROR" | "WARNING" | "ADVISORY_NOTE";

export type InvariantViolationCode =
  | "INVARIANT_NUMERIC_MIN_VIOLATED"
  | "INVARIANT_NUMERIC_MAX_VIOLATED"
  | "INVARIANT_STATE_ILLEGAL_ACTION"
  | "INVARIANT_REQUIRED_PREREQUISITE_MISSING"
  | "INVARIANT_MUTUAL_EXCLUSION_CONTRADICTION";

export interface FoldedEntityState {
  entityId: string;
  entityName: string;
  category: EntityCategory;
  computedProperties: Record<string, unknown>;
  lastMutatedSeqNumber: number;
}

export interface ActiveConstraint {
  ruleId: string;
  ruleName: string;
  severity: InvariantSeverity;
  scope: string;
}

export interface SceneGroundingRequest {
  projectId: string;
  sceneId: string;
  targetSequenceNumber: number;
  mentionedEntityIds: string[];
}

export interface SceneGroundingResponse {
  sceneId: string;
  sequenceNumber: number;
  foldedStates: FoldedEntityState[];
  activeConstraints: ActiveConstraint[];
}

export interface DraftProseEvent {
  entityId: string;
  eventType: string;
  delta: Record<string, unknown>;
  claimedState?: Record<string, unknown>;
}

export interface ContinuityAuditRequest {
  projectId: string;
  sceneId: string;
  sequenceNumber: number;
  draftEvents: DraftProseEvent[];
}

export interface ContinuityViolation {
  code: InvariantViolationCode;
  ruleName: string;
  entityId: string;
  entityName: string;
  property: string;
  expectedValue: unknown;
  calculatedValue: unknown;
  message: string;
  rfc7807Uri: string;
}

export interface ContinuityAuditResponse {
  sceneId: string;
  sequenceNumber: number;
  status: "CLEAN" | "VIOLATION_DETECTED";
  violations: ContinuityViolation[];
}

export interface EntityMentionQuery {
  projectId: string;
  queryToken: string;
  categoryLimit?: EntityCategory[];
}

export interface EntityCandidateMatch {
  entityId: string;
  name: string;
  category: EntityCategory;
  snippet: string;
  currentRealmOrStatus?: string;
}

export interface EntityMentionResponse {
  queryToken: string;
  matches: EntityCandidateMatch[];
}

export interface CanonStateChangedEvent {
  projectId: string;
  eventId: string;
  sequenceNumber: number;
  mutatedEntityIds: string[];
  timestamp: string;
}

export interface RuleInvalidatedEvent {
  projectId: string;
  ruleId: string;
  affectedSceneIds: string[];
  reason: string;
}

export interface DevSeedResponse {
  success: boolean;
  projectId: string;
  projectName: string;
  universeName: string;
  seededEntitiesCount: number;
  seededEventsCount: number;
  seededRulesCount: number;
  seededScenesCount: number;
  message: string;
}
