/**
 * @file types.ts
 * @description Mobile domain types matching the web application's authoritative data models and contracts.
 * Block Standard: BLOCK_MOBILE_TYPES_001
 */

export * from "@novwrite/bridge";

export interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface EnumOptionDef {
  label: string;
  value: string;
  name?: string;
  power?: number;
  numericValue?: number;
}

export interface DynamicFieldDef {
  id: string;
  name: string;
  key?: string;
  label?: string;
  fieldType: BlueprintFieldType;
  description?: string;
  required?: boolean;
  isRequired?: boolean;
  defaultValue?: any;
  options?: (string | EnumOptionDef)[];
  optionPowers?: Record<string, number>;
  targetBlueprintId?: string;
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
  name: string;
  blueprintClass: BlueprintClass;
  category: string;
  description: string;
  fields: DynamicFieldDef[];
  isSystemDefault?: boolean;
}

export interface EntityItem {
  id: string;
  name: string;
  blueprintId: string;
  blueprintName: string;
  category: string;
  description: string;
  properties: Record<string, any>;
  computedFormulas?: Record<string, number>;
  lastMutatedSeqNumber: number;
}

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
  sceneId?: string;
  sceneTitle?: string;
  sequenceNumber?: number;
  entityId?: string;
  entityName?: string;
  property?: string;
  expectedValue?: string;
  calculatedValue?: string;
  historicalCausalEventId?: string;
  historicalCausalEventTitle?: string;
  historicalCausalSequence?: number;
  message: string;
  rfc7807Uri: string;
  suggestedResolution?: string;
  overridden?: boolean;
  overrideJustification?: string;
  overriddenBy?: string;
  overriddenAt?: string;
}
