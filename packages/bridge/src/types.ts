/**
 * @file types.ts
 * @description Core TypeScript type definitions for the NovWrite cross-domain communication bridge.
 * Block Standard: BLOCK_COMM_BRIDGE_TYPES_001
 */

export type EntityCategory =
  | "CHARACTER"
  | "LOCATION"
  | "ARTIFACT"
  | "FACTION"
  | "LORE_CONCEPT"
  | "General"
  | "Characters"
  | "Relics & Armaments"
  | "Cosmology & Geography"
  | "Factions & Sects"
  | "Sub-Systems & Gauges";

export type BlueprintClass = "FIRST_CLASS" | "SECOND_CLASS";

export type BlueprintFieldType =
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "ENUM"
  | "VALUE_TYPE"
  | "ARRAY"
  | "BLUEPRINT_REF"
  | "ARRAY_REF"
  | "FORMULA";

export interface ValueTypeOption {
  label: string;
  value: string;
  power?: number;
  numericValue?: number;
  description?: string;
}

// Backwards-compatible aliases
export type EnumOption = ValueTypeOption;
export type ValueTypeOptionItem = ValueTypeOption;
export type EnumOptionItem = ValueTypeOption;

export interface DynamicFieldDef {
  id: string;
  name: string;
  key?: string; // Compatibility alias for machine name
  label?: string;
  fieldType: BlueprintFieldType;
  description?: string;
  required?: boolean;
  isRequired?: boolean;
  defaultValue?: any;
  options?: (string | EnumOption)[];
  optionPowers?: Record<string, number>; // Mobile enum power mapping
  targetBlueprintId?: string;
  targetBlueprintName?: string;
  referenceCardinality?: "ONE" | "MANY";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  formulaExpression?: string;
  formulaDependencies?: string[];
  orderIndex?: number;
}

export interface BlueprintDef {
  id: string;
  projectId?: string;
  name: string;
  slug?: string;
  blueprintClass: BlueprintClass;
  category: string;
  description?: string;
  iconName?: string;
  fields: DynamicFieldDef[];
  isBuiltIn?: boolean;
  isSystemDefault?: boolean;
}

export interface EntityItem {
  id: string;
  projectId?: string;
  blueprintId: string;
  blueprintName?: string;
  name: string;
  aliases?: string[];
  category?: string;
  description?: string;
  properties: Record<string, any>;
  computedFormulas?: Record<string, number>;
  status?: string;
  lastMutatedSeqNumber?: number;
}

export interface EntityRelationshipItem {
  id: string;
  projectId?: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  isBidirectional?: boolean;
  metadata?: Record<string, unknown>;
}

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
  category: string;
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
  categoryLimit?: string[];
}

export interface EntityCandidateMatch {
  entityId: string;
  name: string;
  category: string;
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

// =====================================
// Bitemporal & Dual-Axis Revision Types
// =====================================

export type RevisionType =
  "TYPO_FIX" | "BASELINE_EDIT" | "RETROACTIVE_PLOT_FIX" | "REVERT";

export interface JSONPatchOp {
  op: "add" | "remove" | "replace";
  path: string;
  value?: unknown;
  from?: string;
}

export interface EntityRevisionPatch {
  name?: { before: string; after: string };
  description?: { before: string; after: string };
  category?: { before: string; after: string };
  propertiesChanged?: Record<string, { before: unknown; after: unknown }>;
  formulasChanged?: Record<string, { before: number; after: number }>;
}

export interface EntityRevision {
  id: string;
  entityId: string;
  projectId?: string;
  parentRevisionId: string | null;
  revisionNumber: number;
  createdAt: string;
  type: RevisionType;
  authorNote?: string;
  patch: EntityRevisionPatch;
  snapshot: EntityItem;
}

export interface TimelineEventRevision {
  id: string;
  eventId: string;
  projectId?: string;
  parentRevisionId: string | null;
  revisionNumber: number;
  createdAt: string;
  type: RevisionType;
  authorNote?: string;
  patch: {
    title?: { before: string; after: string };
    sequenceNumber?: { before: number; after: number };
    effectsChanged?: { before: unknown[]; after: unknown[] };
  };
  snapshot: {
    id: string;
    narrativeSequenceNumber: number;
    chronologicalOrder: number;
    title: string;
    description?: string | null;
    anchorSceneId?: string | null;
  };
}

export interface BitemporalCoordinateQuery {
  entityId: string;
  projectId?: string;
  targetSequenceNumber?: number; // T_narrative (Plot Time)
  targetRevisionId?: string; // T_revision (Authorial Revision)
}

export interface BitemporalEntityState {
  entityId: string;
  entityName: string;
  category: string;
  narrativeSequenceNumber: number;
  revisionId: string;
  revisionNumber: number;
  revisionType: RevisionType;
  properties: Record<string, unknown>;
  computedFormulas?: Record<string, number>;
  appliedEventsCount: number;
  activeMutations: Array<{
    eventId: string;
    eventTitle: string;
    sequenceNumber: number;
    propertyKey: string;
    operation: string;
    value: unknown;
  }>;
}

// =====================================
// Hanging Edit Tree & Pipe Models
// =====================================

export interface EditNode<T = unknown> {
  id: string;
  parentId: string | null;
  childrenIds: string[];
  revisionNumber: number;
  label?: string;
  authorNote?: string;
  type: RevisionType;
  createdAt: string;
  patch?: unknown;
  snapshot: T;
}

export interface EditTree<T = unknown> {
  rootId: string;
  activeEditId: string; // Current EDIT Head
  nodes: Record<string, EditNode<T>>;
}

// =====================================
// Multi-User Hierarchy & Identity Types
// =====================================

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface UserAccount {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  isPlatformAdmin: boolean;
  mfaEnabled: boolean;
  accountStatus: "ACTIVE" | "SUSPENDED" | "LOCKED";
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password?: string;
  role?: UserRole;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
  reason?: string;
}

export interface AuthLoginRequest {
  emailOrUsername: string;
  password?: string;
}

export interface AuthLoginResponse {
  token: string;
  user: UserAccount;
  expiresIn: number;
}

// =====================================
// Project & Creative Workspace Models
// =====================================

export interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectParams {
  name: string;
  description?: string;
  genre?: string;
}

// =====================================
// Novel Prose Manuscript Models
// =====================================

export type SceneStatus = "DRAFT" | "IN_PROGRESS" | "REVISED" | "COMPLETED";

export interface ChapterItem {
  id: string;
  projectId: string;
  title: string;
  orderIndex: number;
  synopsis?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SceneItem {
  id: string;
  chapterId: string;
  projectId: string;
  title: string;
  orderIndex: number;
  proseContent: string;
  wordCount: number;
  status: SceneStatus;
  povCharacterId?: string;
  timelineSequenceNumber?: number;
  targetWordCount?: number;
  synopsis?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChapterParams {
  title: string;
  synopsis?: string;
}

export interface CreateSceneParams {
  chapterId: string;
  title: string;
  synopsis?: string;
  targetWordCount?: number;
  povCharacterId?: string;
  timelineSequenceNumber?: number;
}

export interface SceneLeaseInfo {
  sceneId: string;
  active: boolean;
  authorId?: string;
  remainingSeconds: number;
}

export interface AcquireSceneLeaseParams {
  authorId: string;
}

export interface SceneLeaseResponse {
  sceneId: string;
  authorId?: string;
  expiresInSeconds?: number;
  acquired?: boolean;
  renewed?: boolean;
  released?: boolean;
}

// =====================================
// Timeline & Event Sourcing Models
// =====================================

export type EffectOperation =
  "SET" | "INCREMENT" | "DECREMENT" | "APPEND" | "REMOVE" | "TRANSFER";

export interface TimelineEffectItem {
  id?: string;
  targetEntityId: string;
  entityName?: string;
  propertyKey: string;
  operation: EffectOperation;
  value: any;
}

export interface TimelineEventItem {
  id: string;
  narrativeSequenceNumber: number;
  chronologicalOrder: number;
  title: string;
  description: string;
  anchorChapterTitle?: string;
  anchorSceneTitle?: string;
  anchorSceneId?: string;
  effects: TimelineEffectItem[];
  createdAt?: string;
}

export interface TimelineEventWithTree {
  event: TimelineEventItem;
  editTree: EditTree<TimelineEventItem>;
}

// =====================================
// Invariant Rules & Continuity Audit Models
// =====================================

export type RuleSeverity = "BLOCKING_ERROR" | "WARNING" | "ADVISORY_NOTE";

export type RuleType =
  | "STATE_GUARD"
  | "NUMERIC_BOUNDS"
  | "PREREQUISITE"
  | "RELATIONAL_GUARD"
  | "FORMULA_BOUNDARY";

export interface InvariantRuleItem {
  id: string;
  name: string;
  severity: RuleSeverity;
  type: RuleType;
  targetBlueprintId?: string;
  targetBlueprintName?: string;
  targetCategory?: string;
  predicateExpression: string;
  predicateSummary: string;
  description: string;
  enabled: boolean;
  suggestedResolution?: string;
}

export interface ContinuityViolationItem {
  id: string;
  code: string;
  ruleId?: string;
  ruleName: string;
  severity: RuleSeverity;
  sceneId: string;
  sceneTitle: string;
  sequenceNumber: number;
  entityId: string;
  entityName: string;
  property: string;
  expectedValue: string;
  calculatedValue: string;
  historicalCausalEventId?: string;
  historicalCausalEventTitle?: string;
  historicalCausalSequence?: number;
  message: string;
  rfc7807Uri: string;
  suggestedResolution: string;
  overridden?: boolean;
  overrideJustification?: string;
  overriddenBy?: string;
  overriddenAt?: string;
}
