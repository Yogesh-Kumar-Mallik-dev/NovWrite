/**
 * @file propertyValidator.ts
 * @description Dynamic property validation and type coercion engine.
 * Block Standard: BLOCK_WORLD_DYNAMIC_SCHEMA_001
 */

import {
  DynamicPropertyDef,
  PropertyValidationError,
  ValidationResult,
} from "./schemaTypes.js";

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Validate a single property value against its definition.
 * Block Standard: BLOCK_WORLD_DYNAMIC_SCHEMA_001
 */
export function validateSingleProperty(
  def: DynamicPropertyDef,
  rawVal: unknown,
): { valid: boolean; coercedVal?: unknown; error?: PropertyValidationError } {
  const rules = def.validation || {};
  let val = rawVal;

  // Handle undefined / null: use defaultValue if available
  if (val === undefined || val === null) {
    if (def.defaultValue !== undefined && def.defaultValue !== null) {
      val = def.defaultValue;
    } else if (rules.required) {
      return {
        valid: false,
        error: {
          propertyKey: def.name,
          code: "REQUIRED_FIELD_MISSING",
          message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${def.name}' is required but received empty value.`,
          receivedValue: val,
        },
      };
    } else {
      // Optional and not provided
      return { valid: true, coercedVal: null };
    }
  }

  // Type-specific validation and coercion
  switch (def.propertyType) {
    case "STRING": {
      if (typeof val !== "string") {
        return {
          valid: false,
          error: {
            propertyKey: def.name,
            code: "TYPE_MISMATCH_STRING",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${def.name}' expected string, received ${typeof val}.`,
            receivedValue: val,
          },
        };
      }
      if (rules.minLength !== undefined && val.length < rules.minLength) {
        return {
          valid: false,
          error: {
            propertyKey: def.name,
            code: "STRING_MIN_LENGTH",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${def.name}' length (${val.length}) is below minimum (${rules.minLength}).`,
            receivedValue: val,
          },
        };
      }
      if (rules.maxLength !== undefined && val.length > rules.maxLength) {
        return {
          valid: false,
          error: {
            propertyKey: def.name,
            code: "STRING_MAX_LENGTH",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${def.name}' length (${val.length}) exceeds maximum (${rules.maxLength}).`,
            receivedValue: val,
          },
        };
      }
      return { valid: true, coercedVal: val };
    }

    case "NUMBER": {
      let numVal: number;
      if (typeof val === "number") {
        numVal = val;
      } else if (
        typeof val === "string" &&
        !isNaN(Number(val)) &&
        val.trim() !== ""
      ) {
        numVal = Number(val);
      } else {
        return {
          valid: false,
          error: {
            propertyKey: def.name,
            code: "TYPE_MISMATCH_NUMBER",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${def.name}' expected valid number, received ${typeof val}.`,
            receivedValue: val,
          },
        };
      }

      if (rules.min !== undefined && numVal < rules.min) {
        return {
          valid: false,
          error: {
            propertyKey: def.name,
            code: "NUMERIC_BELOW_MIN",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${def.name}' value (${numVal}) is below minimum (${rules.min}).`,
            receivedValue: numVal,
          },
        };
      }
      if (rules.max !== undefined && numVal > rules.max) {
        return {
          valid: false,
          error: {
            propertyKey: def.name,
            code: "NUMERIC_ABOVE_MAX",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${def.name}' value (${numVal}) exceeds maximum (${rules.max}).`,
            receivedValue: numVal,
          },
        };
      }
      return { valid: true, coercedVal: numVal };
    }

    case "BOOLEAN": {
      if (typeof val === "boolean") {
        return { valid: true, coercedVal: val };
      }
      if (val === "true" || val === 1) {
        return { valid: true, coercedVal: true };
      }
      if (val === "false" || val === 0) {
        return { valid: true, coercedVal: false };
      }
      return {
        valid: false,
        error: {
          propertyKey: def.name,
          code: "TYPE_MISMATCH_BOOLEAN",
          message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${def.name}' expected boolean, received ${typeof val}.`,
          receivedValue: val,
        },
      };
    }

    case "ENUM_SINGLE":
    case "LADDER_TIER": {
      if (typeof val !== "string") {
        return {
          valid: false,
          error: {
            propertyKey: def.name,
            code: "TYPE_MISMATCH_ENUM",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${def.name}' expected string enum option, received ${typeof val}.`,
            receivedValue: val,
          },
        };
      }
      const allowed = rules.allowedValues || [];
      if (allowed.length > 0 && !allowed.includes(val)) {
        return {
          valid: false,
          error: {
            propertyKey: def.name,
            code: "ENUM_INVALID_OPTION",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${def.name}' value '${val}' is not in allowed options: [${allowed.join(", ")}].`,
            receivedValue: val,
          },
        };
      }
      return { valid: true, coercedVal: val };
    }

    case "ENUM_MULTI": {
      if (!Array.isArray(val)) {
        return {
          valid: false,
          error: {
            propertyKey: def.name,
            code: "TYPE_MISMATCH_ENUM_ARRAY",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${def.name}' expected array of enum strings, received ${typeof val}.`,
            receivedValue: val,
          },
        };
      }
      const allowed = rules.allowedValues || [];
      for (const item of val) {
        if (
          typeof item !== "string" ||
          (allowed.length > 0 && !allowed.includes(item))
        ) {
          return {
            valid: false,
            error: {
              propertyKey: def.name,
              code: "ENUM_MULTI_INVALID_ITEM",
              message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Item '${item}' in property '${def.name}' is not allowed: [${allowed.join(", ")}].`,
              receivedValue: item,
            },
          };
        }
      }
      return { valid: true, coercedVal: val };
    }

    case "ENTITY_REF": {
      if (typeof val !== "string" || !UUID_REGEX.test(val)) {
        return {
          valid: false,
          error: {
            propertyKey: def.name,
            code: "INVALID_ENTITY_UUID",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${def.name}' expected valid entity UUID reference, received '${val}'.`,
            receivedValue: val,
          },
        };
      }
      return { valid: true, coercedVal: val };
    }

    default:
      return { valid: true, coercedVal: val };
  }
}

/**
 * Validate a full dynamic properties map against entity property definitions.
 * Block Standard: BLOCK_WORLD_DYNAMIC_SCHEMA_001
 */
export function validateEntityProperties(
  propertyDefs: DynamicPropertyDef[],
  rawProperties: Record<string, unknown>,
): ValidationResult {
  const coercedProperties: Record<string, unknown> = {};
  const errors: PropertyValidationError[] = [];

  const defsMap = new Map(propertyDefs.map((d) => [d.name, d]));

  // 1. Validate all defined properties against provided values
  for (const def of propertyDefs) {
    const rawVal = rawProperties[def.name];
    const res = validateSingleProperty(def, rawVal);

    if (!res.valid && res.error) {
      errors.push(res.error);
    } else {
      coercedProperties[def.name] = res.coercedVal;
    }
  }

  // 2. Check for unknown/unregistered properties (prevent arbitrary pollution)
  for (const key of Object.keys(rawProperties)) {
    if (!defsMap.has(key)) {
      errors.push({
        propertyKey: key,
        code: "UNDEFINED_PROPERTY_KEY",
        message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property key '${key}' is not defined in the active entity schema.`,
        receivedValue: rawProperties[key],
      });
    }
  }

  return {
    valid: errors.length === 0,
    coercedProperties,
    errors,
  };
}
