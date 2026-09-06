/**
 * @file schemaTypes.ts
 * @description Domain types for dynamic blueprints, fields, and property validation.
 * Block Standard: BLOCK_WORLD_DYNAMIC_SCHEMA_002
 */

import {
  BlueprintClass,
  BlueprintFieldType,
  EnumOption,
  DynamicFieldDef,
  BlueprintDef,
  EntityItem,
  EntityRelationshipItem,
} from "@novwrite/bridge";

export type {
  BlueprintClass,
  BlueprintFieldType,
  EnumOption,
  DynamicFieldDef,
  BlueprintDef,
  EntityItem,
  EntityRelationshipItem,
};

// Backwards-compatible aliases for legacy references
export type PropertyType =
  | BlueprintFieldType
  | "ENUM_SINGLE"
  | "ENUM_MULTI"
  | "ENTITY_REF"
  | "LADDER_TIER";

export interface DynamicPropertyDef {
  id: string;
  projectId?: string;
  blueprintId?: string;
  entityTypeId?: string;
  name: string;
  label?: string;
  fieldType?: BlueprintFieldType;
  propertyType?: PropertyType;
  options?: (string | EnumOption)[];
  targetBlueprintId?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  formulaExpression?: string;
  isRequired?: boolean;
  orderIndex?: number;
  defaultValue?: unknown;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    allowedValues?: string[];
    required?: boolean;
    targetCategory?: string;
    regexPattern?: string;
  };
}

export type EntityTypeDef = BlueprintDef & {
  properties?: DynamicPropertyDef[];
};

export interface PropertyValidationError {
  propertyKey: string;
  code: string;
  message: string;
  receivedValue?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  coercedProperties: Record<string, unknown>;
  errors: PropertyValidationError[];
}
