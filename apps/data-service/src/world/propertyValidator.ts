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
  BlueprintDef,
  BlueprintClass,
  EntityItem,
} from "./schemaTypes.js";
import { evaluateFormula, validateFormulaSyntax } from "./formulaEngine.js";

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
    if (
      legacyDef.defaultValue !== undefined &&
      legacyDef.defaultValue !== null
    ) {
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
        const allowedLabels = allowed.map((o) =>
          typeof o === "string" ? o : o.label,
        );
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
        const allowedLabels = allowed.map((o) =>
          typeof o === "string" ? o : o.label,
        );
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
          const allowedLabels = allowed.map((o) =>
            typeof o === "string" ? o : o.label,
          );
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
        coerced.push(
          typeof match === "object" && match !== null ? match.value : strItem,
        );
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
            return {
              valid: true,
              coercedVal: parsed
                .map((item) => String(item).trim())
                .filter(Boolean),
            };
          }
        } catch {}
        const coerced = val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return { valid: true, coercedVal: coerced };
      }
      return { valid: true, coercedVal: [] };
    }

    case "BLUEPRINT_REF":
    case "ENTITY_REF" as any: {
      if (
        typeof val === "string" &&
        (UUID_REGEX.test(val) ||
          val.startsWith("e-") ||
          val.startsWith("bp-") ||
          val.startsWith("ent-"))
      ) {
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
            listVal = val
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }
        } catch {
          listVal = val
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      } else if (val) {
        listVal = [val];
      }

      const coerced: string[] = [];
      for (const item of listVal) {
        if (!item) continue;
        if (typeof item === "string") {
          coerced.push(item.trim());
        } else if (
          typeof item === "object" &&
          item !== null &&
          (item as any).id
        ) {
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
 * Normalizes all property keys to lowercase.
 * Block Standard: BLOCK_WORLD_DYNAMIC_SCHEMA_001
 */
export function validateEntityProperties(
  definitions: (DynamicFieldDef | DynamicPropertyDef)[],
  properties: Record<string, unknown>,
): ValidationResult {
  const errors: PropertyValidationError[] = [];
  const coerced: Record<string, unknown> = {};

  const definedKeys = new Set(definitions.map((d) => d.name.toLowerCase()));
  const normalizedProps: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(properties || {})) {
    normalizedProps[k.toLowerCase()] = v;
  }

  // Check for unregistered keys
  for (const rawKey of Object.keys(normalizedProps)) {
    if (!definedKeys.has(rawKey)) {
      if (rawKey.startsWith("_")) {
        coerced[rawKey] = normalizedProps[rawKey];
        continue;
      }
      errors.push({
        propertyKey: rawKey,
        code: "UNDEFINED_PROPERTY_KEY",
        message: `BLOCK_WORLD_DYNAMIC_SCHEMA_001: Unregistered property '${rawKey}' is not allowed in schema.`,
        receivedValue: normalizedProps[rawKey],
      });
    }
  }

  for (const def of definitions) {
    const keyLower = def.name.toLowerCase();
    const rawVal = normalizedProps[keyLower];
    const res = validateSingleProperty(def, rawVal);

    if (!res.valid && res.error) {
      errors.push(res.error);
    } else {
      coerced[keyLower] = res.coercedVal;
    }
  }

  return {
    valid: errors.length === 0,
    coercedProperties: coerced,
    errors,
  };
}

/**
 * Non-destructively preserves obsolete entity properties under _legacy_properties when schemas evolve.
 * Block Standard: BLOCK_WORLD_UPCAST_SCHEMA_001
 */
export function upcastLegacyProperties(
  properties: Record<string, unknown>,
  currentFields: DynamicFieldDef[],
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...properties };
  const defined = new Set(currentFields.map((f) => f.name.toLowerCase()));
  const legacy: Record<string, unknown> = {};

  if (
    properties["_legacy_properties"] &&
    typeof properties["_legacy_properties"] === "object"
  ) {
    Object.assign(
      legacy,
      properties["_legacy_properties"] as Record<string, unknown>,
    );
  }

  for (const [k, v] of Object.entries(properties)) {
    if (k.startsWith("_")) continue;
    if (!defined.has(k.toLowerCase())) {
      legacy[k] = v;
      delete result[k];
    }
  }

  if (Object.keys(legacy).length > 0) {
    result["_legacy_properties"] = legacy;
  }
  return result;
}

/**
 * Validates and sanitizes a Blueprint definition on the backend.
 * Enforces lowercase machine keys, uniqueness, and slate wipe on field type changes.
 * Block Standard: BLOCK_WORLD_DYNAMIC_SCHEMA_002
 */
export function validateAndSanitizeBlueprint(bp: BlueprintDef): {
  valid: boolean;
  sanitizedBlueprint?: BlueprintDef;
  errors: PropertyValidationError[];
} {
  const errors: PropertyValidationError[] = [];
  const name = (bp.name || "").trim();
  if (!name) {
    errors.push({
      propertyKey: "name",
      code: "BLUEPRINT_NAME_REQUIRED",
      message:
        "BLOCK_WORLD_DYNAMIC_SCHEMA_002: Blueprint name cannot be empty.",
    });
  }

  const bpClass: BlueprintClass =
    bp.blueprintClass === "SECOND_CLASS" ? "SECOND_CLASS" : "FIRST_CLASS";
  const category = (bp.category || "").trim() || "General";

  const seenKeys = new Set<string>();
  const sanitizedFields: DynamicFieldDef[] = [];

  for (let idx = 0; idx < (bp.fields || []).length; idx++) {
    const f = bp.fields[idx];
    let key = (f.name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_\.]/g, "");
    if (!key) {
      key = (f.label || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_\.]/g, "");
    }
    if (!key) {
      errors.push({
        propertyKey: `fields[${idx}].name`,
        code: "EMPTY_FIELD_KEY",
        message: `BLOCK_WORLD_DYNAMIC_SCHEMA_002: Dynamic field at index ${idx} has no valid machine key.`,
      });
      continue;
    }

    if (seenKeys.has(key)) {
      errors.push({
        propertyKey: `fields[${idx}].name`,
        code: "DUPLICATE_FIELD_KEY",
        message: `BLOCK_WORLD_DYNAMIC_SCHEMA_002: Duplicate field key '${key}' found in blueprint '${name}'.`,
        receivedValue: key,
      });
      continue;
    }
    seenKeys.add(key);

    const label = (f.label || "").trim() || key;
    const fieldType = f.fieldType || "STRING";

    const cleanField: DynamicFieldDef = {
      id: f.id || `f-${Date.now()}-${idx}-${key}`,
      name: key,
      label,
      fieldType,
      isRequired: f.isRequired ?? false,
      orderIndex: f.orderIndex ?? idx,
    };

    switch (fieldType) {
      case "ENUM": {
        const opts = (f.options || []).map((o: any) => {
          if (typeof o === "string") {
            const trimmed = o.trim();
            return {
              label: trimmed,
              value: trimmed.toLowerCase().replace(/[^a-z0-9_\.]/g, "_"),
            };
          }
          const lbl = (o.label || o.value || "").trim();
          const val = (o.value || o.label || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_\.]/g, "_");
          return { label: lbl, value: val };
        });
        cleanField.options =
          opts.length > 0 ? opts : [{ label: "Default", value: "default" }];
        break;
      }

      case "VALUE_TYPE": {
        const opts = (f.options || []).map((o: any) => {
          if (typeof o === "string") {
            const trimmed = o.trim();
            return {
              label: trimmed,
              value: trimmed.toLowerCase().replace(/[^a-z0-9_\.]/g, "_"),
              power: 0,
              numericValue: 0,
            };
          }
          const lbl = (o.label || o.value || "").trim();
          const val = (o.value || o.label || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_\.]/g, "_");
          const pwr =
            typeof o.power === "number"
              ? o.power
              : typeof o.numericValue === "number"
                ? o.numericValue
                : 0;
          return { label: lbl, value: val, power: pwr, numericValue: pwr };
        });
        cleanField.options =
          opts.length > 0
            ? opts
            : [
                {
                  label: "Default",
                  value: "default",
                  power: 0,
                  numericValue: 0,
                },
              ];
        break;
      }

      case "NUMBER": {
        if (f.min !== undefined && f.max !== undefined && f.min > f.max) {
          errors.push({
            propertyKey: key,
            code: "NUMERIC_BOUNDS_INVALID",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_002: Number field '${key}' min (${f.min}) cannot be greater than max (${f.max}).`,
          });
        }
        cleanField.min = f.min;
        cleanField.max = f.max;
        cleanField.step = f.step;
        cleanField.unit = f.unit ? f.unit.trim() : undefined;
        break;
      }

      case "BLUEPRINT_REF":
      case "ARRAY_REF": {
        const targetId = (f.targetBlueprintId || "").trim();
        if (!targetId) {
          errors.push({
            propertyKey: key,
            code: "TARGET_BLUEPRINT_REQUIRED",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_002: Reference field '${key}' requires targetBlueprintId.`,
          });
        }
        cleanField.targetBlueprintId = targetId;
        break;
      }

      case "FORMULA": {
        const expr = (f.formulaExpression || "").trim();
        if (!expr) {
          errors.push({
            propertyKey: key,
            code: "FORMULA_EXPRESSION_REQUIRED",
            message: `BLOCK_WORLD_DYNAMIC_SCHEMA_002: Formula field '${key}' expression cannot be empty.`,
          });
        } else {
          const valRes = validateFormulaSyntax(expr);
          if (!valRes.valid) {
            errors.push({
              propertyKey: key,
              code: "FORMULA_SYNTAX_ERROR",
              message: `BLOCK_WORLD_DYNAMIC_SCHEMA_002: Formula field '${key}' syntax error: ${valRes.error}`,
            });
          }
          if (valRes.extractedVariables.includes(key)) {
            errors.push({
              propertyKey: key,
              code: "FORMULA_CIRCULAR_DEPENDENCY",
              message: `BLOCK_WORLD_DYNAMIC_SCHEMA_002: Formula field '${key}' cannot reference its own output variable.`,
            });
          }
        }
        cleanField.formulaExpression = expr;
        break;
      }

      case "ARRAY":
      case "BOOLEAN":
      case "STRING":
      default:
        break;
    }

    sanitizedFields.push(cleanField);
  }

  const sanitizedBlueprint: BlueprintDef = {
    id: bp.id,
    projectId: bp.projectId,
    name,
    slug: bp.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    blueprintClass: bpClass,
    category,
    description: bp.description ? bp.description.trim() : undefined,
    iconName: bp.iconName || "Sparkles",
    fields: sanitizedFields,
    isBuiltIn: bp.isBuiltIn,
  };

  return {
    valid: errors.length === 0,
    sanitizedBlueprint,
    errors,
  };
}

/**
 * Validates entity attributes against blueprint and deterministically recomputes formulas on backend.
 * Block Standard: BLOCK_WORLD_DYNAMIC_SCHEMA_002
 */
export function validateAndSanitizeEntity(
  bp: BlueprintDef,
  entity: EntityItem,
): {
  valid: boolean;
  sanitizedEntity?: EntityItem;
  errors: PropertyValidationError[];
} {
  const errors: PropertyValidationError[] = [];
  const name = (entity.name || "").trim();
  if (!name) {
    errors.push({
      propertyKey: "name",
      code: "ENTITY_NAME_REQUIRED",
      message: "BLOCK_WORLD_DYNAMIC_SCHEMA_002: Entity name is required.",
    });
  }

  const valRes = validateEntityProperties(bp.fields, entity.properties || {});
  if (!valRes.valid) {
    errors.push(...valRes.errors);
  }

  // Recompute formulas on backend deterministically
  const computedFormulas: Record<string, number> = {};
  for (const f of bp.fields) {
    if (f.fieldType === "FORMULA" && f.formulaExpression) {
      const evalRes = evaluateFormula(
        f.formulaExpression,
        valRes.coercedProperties,
      );
      computedFormulas[f.name] =
        evalRes.success && evalRes.value !== undefined ? evalRes.value : 0;
    }
  }

  const sanitizedEntity: EntityItem = {
    ...entity,
    name,
    properties: valRes.coercedProperties,
    computedFormulas,
  };

  return {
    valid: errors.length === 0,
    sanitizedEntity,
    errors,
  };
}
