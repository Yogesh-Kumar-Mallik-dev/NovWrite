/**
 * @file propertyValidator.ts
 * @description Dynamic property validation, dual-valued enum resolution, and type coercion engine.
 * Block Standard: BLOCK_WORLD_DYNAMIC_SCHEMA_001
 */

import {
  DynamicFieldDef,
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
  def: DynamicFieldDef | DynamicPropertyDef,
  rawVal: unknown,
): { valid: boolean; coercedVal?: unknown; error?: PropertyValidationError } {
  const legacyDef = def as DynamicPropertyDef;
  const fieldType = def.fieldType || legacyDef.propertyType || "STRING";
  const name = def.name;
  const isRequired = def.isRequired ?? legacyDef.validation?.required ?? false;
  const minVal = def.min ?? legacyDef.validation?.min;
  const maxVal = def.max ?? legacyDef.validation?.max;
  const minLength = legacyDef.validation?.minLength;
  const maxLength = legacyDef.validation?.maxLength;

  let val = rawVal;

  // Handle undefined / null: use defaultValue if available
  if (val === undefined || val === null) {
    if (legacyDef.defaultValue !== undefined && legacyDef.defaultValue !== null) {
      val = legacyDef.defaultValue;
    } else if (isRequired) {
      return {
        valid: false,
        error: {
          propertyKey: name,
          code: "REQUIRED_FIELD_MISSING",
          message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${name}' is required but received empty value.`,
          receivedValue: val,
        },
      };
    } else {
      // Optional and not provided
      return { valid: true, coercedVal: null };
    }
  }

  // Type-specific validation and coercion
  switch (fieldType) {
    case "STRING": {
      if (typeof val !== "string") {
        return {
          valid: false,
          error: {
            propertyKey: name,
            code: "TYPE_MISMATCH_STRING",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${name}' expected string, received ${typeof val}.`,
            receivedValue: val,
          },
        };
      }
      if (minLength !== undefined && val.length < minLength) {
        return {
          valid: false,
          error: {
            propertyKey: name,
            code: "STRING_MIN_LENGTH",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${name}' length (${val.length}) is below minimum (${minLength}).`,
            receivedValue: val,
          },
        };
      }
      if (maxLength !== undefined && val.length > maxLength) {
        return {
          valid: false,
          error: {
            propertyKey: name,
            code: "STRING_MAX_LENGTH",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${name}' length (${val.length}) exceeds maximum (${maxLength}).`,
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
            propertyKey: name,
            code: "TYPE_MISMATCH_NUMBER",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${name}' expected valid number, received ${typeof val}.`,
            receivedValue: val,
          },
        };
      }

      if (minVal !== undefined && numVal < minVal) {
        return {
          valid: false,
          error: {
            propertyKey: name,
            code: "NUMERIC_BELOW_MIN",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${name}' value (${numVal}) is below minimum (${minVal}).`,
            receivedValue: numVal,
          },
        };
      }
      if (maxVal !== undefined && numVal > maxVal) {
        return {
          valid: false,
          error: {
            propertyKey: name,
            code: "NUMERIC_ABOVE_MAX",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${name}' value (${numVal}) exceeds maximum (${maxVal}).`,
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
          propertyKey: name,
          code: "TYPE_MISMATCH_BOOLEAN",
          message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${name}' expected boolean, received ${typeof val}.`,
          receivedValue: val,
        },
      };
    }

    case "ENUM":
    case "ENUM_SINGLE" as any: {
      const allowed = def.options || legacyDef.validation?.allowedValues || [];
      const strVal = String(val);

      const isValid = allowed.some((opt) => {
        if (typeof opt === "string") {
          return opt.toLowerCase() === strVal.toLowerCase() || opt === val;
        }
        return (
          opt.value.toLowerCase() === strVal.toLowerCase() ||
          opt.label.toLowerCase() === strVal.toLowerCase() ||
          opt.value === val ||
          opt.label === val
        );
      });

      if (!isValid && allowed.length > 0) {
        const allowedLabels = allowed.map((o) => (typeof o === "string" ? o : o.label));
        return {
          valid: false,
          error: {
            propertyKey: name,
            code: "ENUM_INVALID_OPTION",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Option '${strVal}' is not valid for property '${name}'. Allowed: [${allowedLabels.join(", ")}]`,
            receivedValue: val,
          },
        };
      }
      return { valid: true, coercedVal: val };
    }

    case "VALUE_TYPE": {
      const allowed = def.options || legacyDef.validation?.allowedValues || [];
      const strVal = String(val);

      const matched = allowed.find((opt) => {
        if (typeof opt === "string") {
          return opt.toLowerCase() === strVal.toLowerCase() || opt === val;
        }
        return (
          opt.value.toLowerCase() === strVal.toLowerCase() ||
          opt.label.toLowerCase() === strVal.toLowerCase() ||
          opt.value === val ||
          opt.label === val
        );
      });

      if (!matched && allowed.length > 0) {
        const allowedLabels = allowed.map((o) => (typeof o === "string" ? o : o.label));
        return {
          valid: false,
          error: {
            propertyKey: name,
            code: "VALUE_TYPE_INVALID_OPTION",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Value option '${strVal}' is not valid for value_type field '${name}'. Allowed: [${allowedLabels.join(", ")}]`,
            receivedValue: val,
          },
        };
      }
      return { valid: true, coercedVal: val };
    }

    case "ENUM_MULTI" as any: {
      const allowed = def.options || legacyDef.validation?.allowedValues || [];
      const listVal = Array.isArray(val) ? val : [val];

      const coerced: string[] = [];
      for (const item of listVal) {
        const strItem = String(item);
        const match = allowed.find((opt) => {
          if (typeof opt === "string") {
            return opt.toLowerCase() === strItem.toLowerCase() || opt === item;
          }
          return (
            opt.value.toLowerCase() === strItem.toLowerCase() ||
            opt.label.toLowerCase() === strItem.toLowerCase()
          );
        });

        if (!match && allowed.length > 0) {
          const allowedLabels = allowed.map((o) => (typeof o === "string" ? o : o.label));
          return {
            valid: false,
            error: {
              propertyKey: name,
              code: "ENUM_MULTI_INVALID_ITEM",
              message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Item '${strItem}' in multi-enum '${name}' is invalid. Allowed: [${allowedLabels.join(", ")}]`,
              receivedValue: item,
            },
          };
        }
        coerced.push(typeof match === "object" && match !== null ? match.value : strItem);
      }
      return { valid: true, coercedVal: coerced };
    }

    case "ARRAY":
    case "ARRAY_STRING" as any: {
      if (Array.isArray(val)) {
        const coerced = val.map((item) => String(item).trim()).filter(Boolean);
        return { valid: true, coercedVal: coerced };
      }
      if (typeof val === "string") {
        if (val.trim() === "") {
          return { valid: true, coercedVal: [] };
        }
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            return { valid: true, coercedVal: parsed.map((item) => String(item).trim()).filter(Boolean) };
          }
        } catch {}
        const coerced = val.split(",").map((s) => s.trim()).filter(Boolean);
        return { valid: true, coercedVal: coerced };
      }
      return { valid: true, coercedVal: [] };
    }

    case "BLUEPRINT_REF":
    case "ENTITY_REF" as any: {
      if (typeof val === "string" && (UUID_REGEX.test(val) || val.startsWith("e-") || val.startsWith("bp-") || val.startsWith("ent-"))) {
        return { valid: true, coercedVal: val };
      }
      if (typeof val === "object" && val !== null) {
        return { valid: true, coercedVal: val };
      }
      return {
        valid: false,
        error: {
          propertyKey: name,
          code: "INVALID_ENTITY_UUID",
          message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '${name}' expected valid UUID.`,
          receivedValue: val,
        },
      };
    }

    case "ARRAY_REF":
    case "BLUEPRINT_REF_ARRAY" as any:
    case "ENTITY_REF_ARRAY" as any: {
      let listVal: any[] = [];
      if (Array.isArray(val)) {
        listVal = val;
      } else if (typeof val === "string") {
        if (val.trim() === "") {
          return { valid: true, coercedVal: [] };
        }
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            listVal = parsed;
          } else {
            listVal = val.split(",").map((s) => s.trim()).filter(Boolean);
          }
        } catch {
          listVal = val.split(",").map((s) => s.trim()).filter(Boolean);
        }
      } else if (val) {
        listVal = [val];
      }

      const coerced: string[] = [];
      for (const item of listVal) {
        if (!item) continue;
        if (typeof item === "string") {
          coerced.push(item.trim());
        } else if (typeof item === "object" && item !== null && (item as any).id) {
          coerced.push((item as any).id);
        } else {
          coerced.push(String(item));
        }
      }
      return { valid: true, coercedVal: coerced };
    }

    case "FORMULA": {
      if (typeof val === "number" || typeof val === "string" || val === null) {
        return { valid: true, coercedVal: val };
      }
      return { valid: true, coercedVal: val };
    }

    default:
      return { valid: true, coercedVal: val };
  }
}

/**
 * Validates a map of properties against an array of property definitions.
 * Block Standard: BLOCK_WORLD_DYNAMIC_SCHEMA_001
 */
export function validateEntityProperties(
  definitions: (DynamicFieldDef | DynamicPropertyDef)[],
  properties: Record<string, unknown>,
): ValidationResult {
  const errors: PropertyValidationError[] = [];
  const coerced: Record<string, unknown> = {};

  const definedKeys = new Set(definitions.map((d) => d.name));

  // Check for unregistered keys
  for (const rawKey of Object.keys(properties)) {
    if (!definedKeys.has(rawKey)) {
      errors.push({
        propertyKey: rawKey,
        code: "UNDEFINED_PROPERTY_KEY",
        message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Unregistered property '${rawKey}' is not allowed in schema.`,
        receivedValue: properties[rawKey],
      });
    }
  }

  for (const def of definitions) {
    const rawVal = properties[def.name];
    const res = validateSingleProperty(def, rawVal);

    if (!res.valid && res.error) {
      errors.push(res.error);
    } else {
      coerced[def.name] = res.coercedVal;
    }
  }

  return {
    valid: errors.length === 0,
    coercedProperties: coerced,
    errors,
  };
}
