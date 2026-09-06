/**
 * @file schemaTypes.ts
 * @description Domain types for dynamic entity definitions and property validation.
 * Block Standard: BLOCK_WORLD_DYNAMIC_SCHEMA_001
 */

import { EntityCategory } from "@novwrite/bridge";

export type PropertyType =
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "ENUM_SINGLE"
  | "ENUM_MULTI"
  | "ENTITY_REF"
  | "LADDER_TIER";

export interface PropertyValidationRules {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  allowedValues?: string[];
  required?: boolean;
  targetCategory?: EntityCategory;
  regexPattern?: string;
}

export interface DynamicPropertyDef {
  id: string;
  projectId: string;
  entityTypeId: string;
  name: string;
  propertyType: PropertyType;
  defaultValue?: unknown;
  validation?: PropertyValidationRules;
}

export interface EntityTypeDef {
  id: string;
  projectId: string;
  name: string;
  category: EntityCategory;
  description?: string;
  properties: DynamicPropertyDef[];
}

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
