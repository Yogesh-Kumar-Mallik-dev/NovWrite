package world

import (
	"fmt"
	"regexp"
	"strings"
)

// Block Standard: BLOCK_WORLD_DYNAMIC_SCHEMA_002

var uuidRegex = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

// BlueprintClass distinguishes 1st-Class Archetypes from 2nd-Class Sub-Schemas.
type BlueprintClass string

const (
	ClassFirstClass  BlueprintClass = "FIRST_CLASS"
	ClassSecondClass BlueprintClass = "SECOND_CLASS"
)

// PropertyType represents the type of dynamic property or field.
type PropertyType string

const (
	TypeString       PropertyType = "STRING"
	TypeNumber       PropertyType = "NUMBER"
	TypeBoolean      PropertyType = "BOOLEAN"
	TypeEnum         PropertyType = "ENUM"
	TypeValueType    PropertyType = "VALUE_TYPE"
	TypeArray        PropertyType = "ARRAY"
	TypeBlueprintRef PropertyType = "BLUEPRINT_REF"
	TypeArrayRef     PropertyType = "ARRAY_REF"
	TypeFormula      PropertyType = "FORMULA"

	// Legacy aliases
	TypeEnumSingle        PropertyType = "ENUM_SINGLE"
	TypeEnumMulti         PropertyType = "ENUM_MULTI"
	TypeEntityRef         PropertyType = "ENTITY_REF"
	TypeLadderTier        PropertyType = "LADDER_TIER"
	TypeArrayString       PropertyType = "ARRAY_STRING"
	TypeBlueprintRefArray PropertyType = "BLUEPRINT_REF_ARRAY"
)

// ValueTypeOption bridges qualitative category choices with quantitative power weights for formulas.
type ValueTypeOption struct {
	Label string   `json:"label"`
	Value string   `json:"value"`
	Power *float64 `json:"power,omitempty"`
}

// EnumOption alias for ValueTypeOption
type EnumOption = ValueTypeOption

// PropertyValidationRules defines legacy constraints for dynamic properties.
type PropertyValidationRules struct {
	Min           *float64 `json:"min,omitempty"`
	Max           *float64 `json:"max,omitempty"`
	MinLength     *int     `json:"minLength,omitempty"`
	MaxLength     *int     `json:"maxLength,omitempty"`
	AllowedValues []string `json:"allowedValues,omitempty"`
	Required      bool     `json:"required,omitempty"`
}

// DynamicFieldDef defines a dynamic field within a blueprint.
type DynamicFieldDef struct {
	ID                string       `json:"id"`
	Name              string       `json:"name"`
	Label             string       `json:"label"`
	FieldType         PropertyType `json:"fieldType"`
	Options           []EnumOption `json:"options,omitempty"`
	TargetBlueprintID string       `json:"targetBlueprintId,omitempty"`
	Min               *float64     `json:"min,omitempty"`
	Max               *float64     `json:"max,omitempty"`
	Step              *float64     `json:"step,omitempty"`
	Unit              string       `json:"unit,omitempty"`
	FormulaExpression string       `json:"formulaExpression,omitempty"`
	IsRequired        bool         `json:"isRequired,omitempty"`
	OrderIndex        int          `json:"orderIndex,omitempty"`
}

// DynamicPropertyDef defines a custom schema property (with legacy and v2 compatibility).
type DynamicPropertyDef struct {
	ID                string                  `json:"id"`
	ProjectID         string                  `json:"projectId,omitempty"`
	EntityTypeID      string                  `json:"entityTypeId,omitempty"`
	BlueprintID       string                  `json:"blueprintId,omitempty"`
	Name              string                  `json:"name"`
	Label             string                  `json:"label,omitempty"`
	FieldType         PropertyType            `json:"fieldType,omitempty"`
	PropertyType      PropertyType            `json:"propertyType,omitempty"`
	Options           []EnumOption            `json:"options,omitempty"`
	TargetBlueprintID string                  `json:"targetBlueprintId,omitempty"`
	Min               *float64                `json:"min,omitempty"`
	Max               *float64                `json:"max,omitempty"`
	Step              *float64                `json:"step,omitempty"`
	Unit              string                  `json:"unit,omitempty"`
	FormulaExpression string                  `json:"formulaExpression,omitempty"`
	IsRequired        bool                    `json:"isRequired,omitempty"`
	DefaultValue      interface{}             `json:"defaultValue,omitempty"`
	Validation        PropertyValidationRules `json:"validation,omitempty"`
}

// BlueprintDef represents a 1st-Class Archetype or 2nd-Class Sub-Schema.
type BlueprintDef struct {
	ID             string            `json:"id"`
	ProjectID      string            `json:"projectId,omitempty"`
	Name           string            `json:"name"`
	Slug           string            `json:"slug,omitempty"`
	BlueprintClass BlueprintClass    `json:"blueprintClass"`
	Category       string            `json:"category"`
	Description    string            `json:"description,omitempty"`
	IconName       string            `json:"iconName,omitempty"`
	Fields         []DynamicFieldDef `json:"fields"`
	IsBuiltIn      bool              `json:"isBuiltIn,omitempty"`
}

// EntityItem represents a concrete instantiated universe object.
type EntityItem struct {
	ID                   string                 `json:"id"`
	ProjectID            string                 `json:"projectId,omitempty"`
	BlueprintID          string                 `json:"blueprintId"`
	Name                 string                 `json:"name"`
	Aliases              []string               `json:"aliases,omitempty"`
	Category             string                 `json:"category,omitempty"`
	Description          string                 `json:"description,omitempty"`
	Properties           map[string]interface{} `json:"properties"`
	ComputedFormulas     map[string]float64     `json:"computedFormulas,omitempty"`
	Status               string                 `json:"status,omitempty"`
	LastMutatedSeqNumber int                    `json:"lastMutatedSeqNumber,omitempty"`
}

// PropertyValidationError represents a schema validation failure.
type PropertyValidationError struct {
	PropertyKey   string      `json:"propertyKey"`
	Code          string      `json:"code"`
	Message       string      `json:"message"`
	ReceivedValue interface{} `json:"receivedValue,omitempty"`
	Value         interface{} `json:"value,omitempty"`
}

// ValidateSingleProperty validates an individual property value against its definition.
func ValidateSingleProperty(def DynamicPropertyDef, val interface{}) (interface{}, *PropertyValidationError) {
	fieldType := def.FieldType
	if fieldType == "" {
		fieldType = def.PropertyType
	}
	if fieldType == "" {
		fieldType = TypeString
	}

	isRequired := def.IsRequired || def.Validation.Required

	if val == nil {
		if def.DefaultValue != nil {
			return def.DefaultValue, nil
		}
		if isRequired {
			return nil, &PropertyValidationError{
				PropertyKey: def.Name,
				Code:        "REQUIRED_FIELD_MISSING",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' is required", def.Name),
				Value:       nil,
			}
		}
		return nil, nil
	}

	minVal := def.Min
	if minVal == nil {
		minVal = def.Validation.Min
	}
	maxVal := def.Max
	if maxVal == nil {
		maxVal = def.Validation.Max
	}

	switch fieldType {
	case TypeNumber:
		var num float64
		switch v := val.(type) {
		case float64:
			num = v
		case int:
			num = float64(v)
		case int64:
			num = float64(v)
		default:
			return nil, &PropertyValidationError{
				PropertyKey: def.Name,
				Code:        "TYPE_MISMATCH_NUMBER",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' expected number, got %T", def.Name, val),
				Value:       val,
			}
		}

		if minVal != nil && num < *minVal {
			return nil, &PropertyValidationError{
				PropertyKey: def.Name,
				Code:        "NUMERIC_BELOW_MIN",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' value (%v) is below minimum (%v)", def.Name, num, *minVal),
				Value:       num,
			}
		}
		if maxVal != nil && num > *maxVal {
			return nil, &PropertyValidationError{
				PropertyKey: def.Name,
				Code:        "NUMERIC_ABOVE_MAX",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' value (%v) exceeds maximum (%v)", def.Name, num, *maxVal),
				Value:       num,
			}
		}
		return num, nil

	case TypeString:
		str, ok := val.(string)
		if !ok {
			return nil, &PropertyValidationError{
				PropertyKey: def.Name,
				Code:        "TYPE_MISMATCH_STRING",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' expected string, got %T", def.Name, val),
				Value:       val,
			}
		}
		if def.Validation.MinLength != nil && len(str) < *def.Validation.MinLength {
			return nil, &PropertyValidationError{
				PropertyKey: def.Name,
				Code:        "STRING_MIN_LENGTH",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' length (%d) is below minimum (%d)", def.Name, len(str), *def.Validation.MinLength),
				Value:       str,
			}
		}
		if def.Validation.MaxLength != nil && len(str) > *def.Validation.MaxLength {
			return nil, &PropertyValidationError{
				PropertyKey: def.Name,
				Code:        "STRING_MAX_LENGTH",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' length (%d) exceeds maximum (%d)", def.Name, len(str), *def.Validation.MaxLength),
				Value:       str,
			}
		}
		return str, nil

	case TypeBoolean:
		switch v := val.(type) {
		case bool:
			return v, nil
		case string:
			if strings.EqualFold(v, "true") || v == "1" {
				return true, nil
			}
			if strings.EqualFold(v, "false") || v == "0" {
				return false, nil
			}
		}
		return nil, &PropertyValidationError{
			PropertyKey: def.Name,
			Code:        "TYPE_MISMATCH_BOOLEAN",
			Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' expected boolean, got %T", def.Name, val),
			Value:       val,
		}

	case TypeEnum, TypeValueType, TypeEnumSingle, TypeLadderTier:
		str, ok := val.(string)
		if !ok {
			return nil, &PropertyValidationError{
				PropertyKey: def.Name,
				Code:        "TYPE_MISMATCH_ENUM",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' expected string enum option, got %T", def.Name, val),
				Value:       val,
			}
		}

		found := false
		if len(def.Options) > 0 {
			for _, opt := range def.Options {
				if strings.EqualFold(opt.Value, str) || strings.EqualFold(opt.Label, str) {
					found = true
					break
				}
			}
		} else if len(def.Validation.AllowedValues) > 0 {
			for _, allowed := range def.Validation.AllowedValues {
				if strings.EqualFold(allowed, str) || allowed == str {
					found = true
					break
				}
			}
		} else {
			found = true
		}

		if !found {
			return nil, &PropertyValidationError{
				PropertyKey: def.Name,
				Code:        "ENUM_INVALID_OPTION",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' value '%s' is not in allowed enum options", def.Name, str),
				Value:       str,
			}
		}
		return str, nil

	case TypeArray, TypeArrayString:
		switch v := val.(type) {
		case []string:
			return v, nil
		case []interface{}:
			res := make([]string, 0, len(v))
			for _, item := range v {
				if item != nil {
					res = append(res, strings.TrimSpace(fmt.Sprintf("%v", item)))
				}
			}
			return res, nil
		case string:
			if strings.TrimSpace(v) == "" {
				return []string{}, nil
			}
			parts := strings.Split(v, ",")
			res := make([]string, 0, len(parts))
			for _, p := range parts {
				trimmed := strings.TrimSpace(p)
				if trimmed != "" {
					res = append(res, trimmed)
				}
			}
			return res, nil
		default:
			return []string{}, nil
		}

	case TypeBlueprintRef, TypeEntityRef:
		str, ok := val.(string)
		if !ok || (!uuidRegex.MatchString(str) && !strings.HasPrefix(str, "e") && !strings.HasPrefix(str, "bp")) {
			return nil, &PropertyValidationError{
				PropertyKey: def.Name,
				Code:        "INVALID_ENTITY_UUID",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' expected valid entity UUID, received '%v'", def.Name, val),
				Value:       val,
			}
		}
		return str, nil

	case TypeArrayRef, TypeBlueprintRefArray:
		switch v := val.(type) {
		case []string:
			return v, nil
		case []interface{}:
			res := make([]string, 0, len(v))
			for _, item := range v {
				if item != nil {
					if m, ok := item.(map[string]interface{}); ok && m["id"] != nil {
						res = append(res, fmt.Sprintf("%v", m["id"]))
					} else {
						res = append(res, strings.TrimSpace(fmt.Sprintf("%v", item)))
					}
				}
			}
			return res, nil
		case string:
			if strings.TrimSpace(v) == "" {
				return []string{}, nil
			}
			parts := strings.Split(v, ",")
			res := make([]string, 0, len(parts))
			for _, p := range parts {
				trimmed := strings.TrimSpace(p)
				if trimmed != "" {
					res = append(res, trimmed)
				}
			}
			return res, nil
		default:
			return []string{}, nil
		}

	case TypeFormula:
		return val, nil

	default:
		return val, nil
	}
}

// ValidateEntityAttributes validates all attributes of an entity against a blueprint definition.
func ValidateEntityAttributes(bp BlueprintDef, properties map[string]interface{}) (map[string]interface{}, []*PropertyValidationError) {
	coerced := make(map[string]interface{})
	var errs []*PropertyValidationError

	// Normalize incoming property keys to lowercase
	normalizedProps := make(map[string]interface{})
	for k, v := range properties {
		normalizedProps[strings.ToLower(k)] = v
	}

	// Preserve underscore-prefixed legacy metadata non-destructively
	for k, v := range normalizedProps {
		if strings.HasPrefix(k, "_") {
			coerced[k] = v
		}
	}

	for _, f := range bp.Fields {
		fieldNameLower := strings.ToLower(f.Name)
		rawVal := normalizedProps[fieldNameLower]
		propDef := DynamicPropertyDef{
			ID:                f.ID,
			Name:              fieldNameLower,
			Label:             f.Label,
			FieldType:         f.FieldType,
			PropertyType:      f.FieldType,
			Options:           f.Options,
			TargetBlueprintID: f.TargetBlueprintID,
			Min:               f.Min,
			Max:               f.Max,
			Step:              f.Step,
			Unit:              f.Unit,
			FormulaExpression: f.FormulaExpression,
			IsRequired:        f.IsRequired,
		}

		val, valErr := ValidateSingleProperty(propDef, rawVal)
		if valErr != nil {
			errs = append(errs, valErr)
		} else {
			coerced[fieldNameLower] = val
		}
	}

	return coerced, errs
}

// UpcastLegacyProperties non-destructively preserves obsolete entity properties under _legacy_properties when schemas evolve.
// Block Standard: BLOCK_WORLD_UPCAST_SCHEMA_001
func UpcastLegacyProperties(properties map[string]interface{}, currentFields []DynamicFieldDef) map[string]interface{} {
	result := make(map[string]interface{})
	for k, v := range properties {
		result[k] = v
	}
	defined := make(map[string]bool)
	for _, f := range currentFields {
		defined[strings.ToLower(f.Name)] = true
	}
	legacy := make(map[string]interface{})
	if rawLegacy, ok := properties["_legacy_properties"].(map[string]interface{}); ok {
		for k, v := range rawLegacy {
			legacy[k] = v
		}
	}
	for k, v := range properties {
		if strings.HasPrefix(k, "_") {
			continue
		}
		if !defined[strings.ToLower(k)] {
			legacy[k] = v
			delete(result, k)
		}
	}
	if len(legacy) > 0 {
		result["_legacy_properties"] = legacy
	}
	return result
}


var sanitizeKeyRegex = regexp.MustCompile(`[^a-z0-9_\.]`)

// ValidateAndSanitizeBlueprint strictly validates and cleans a Blueprint definition on the backend.
// Enforces lowercase machine keys, uniqueness, and slate wipe on field type changes.
func ValidateAndSanitizeBlueprint(bp BlueprintDef) (*BlueprintDef, []*PropertyValidationError) {
	var errs []*PropertyValidationError

	name := strings.TrimSpace(bp.Name)
	if name == "" {
		errs = append(errs, &PropertyValidationError{
			PropertyKey: "name",
			Code:        "BLUEPRINT_NAME_REQUIRED",
			Message:     "BLOCK_WORLD_DYNAMIC_SCHEMA_002: Blueprint name cannot be empty.",
		})
	}

	bpClass := bp.BlueprintClass
	if bpClass != ClassFirstClass && bpClass != ClassSecondClass {
		bpClass = ClassFirstClass
	}

	category := strings.TrimSpace(bp.Category)
	if category == "" {
		category = "General"
	}

	seenKeys := make(map[string]bool)
	var sanitizedFields []DynamicFieldDef

	for idx, f := range bp.Fields {
		// Enforce lowercase machine key
		rawKey := strings.ToLower(strings.TrimSpace(f.Name))
		key := sanitizeKeyRegex.ReplaceAllString(rawKey, "")

		if key == "" {
			// Auto-derive from label
			rawLabel := strings.ToLower(strings.TrimSpace(f.Label))
			key = sanitizeKeyRegex.ReplaceAllString(strings.ReplaceAll(rawLabel, " ", "_"), "")
		}

		if key == "" {
			errs = append(errs, &PropertyValidationError{
				PropertyKey: fmt.Sprintf("fields[%d].name", idx),
				Code:        "EMPTY_FIELD_KEY",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_002: Dynamic field at index %d has no valid machine key.", idx),
			})
			continue
		}

		// Enforce unique machine keys per blueprint
		if seenKeys[key] {
			errs = append(errs, &PropertyValidationError{
				PropertyKey: fmt.Sprintf("fields[%d].name", idx),
				Code:        "DUPLICATE_FIELD_KEY",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_002: Duplicate field key '%s' found in blueprint '%s'.", key, name),
				Value:       key,
			})
			continue
		}
		seenKeys[key] = true

		label := strings.TrimSpace(f.Label)
		if label == "" {
			label = key
		}

		fieldType := f.FieldType
		if fieldType == "" {
			fieldType = TypeString
		}

		sanitizedF := DynamicFieldDef{
			ID:         f.ID,
			Name:       key,
			Label:      label,
			FieldType:  fieldType,
			IsRequired: f.IsRequired,
			OrderIndex: f.OrderIndex,
		}
		if sanitizedF.ID == "" {
			sanitizedF.ID = fmt.Sprintf("f-%d-%s", idx, key)
		}

		// Type-specific Slate Wipe and Validation
		switch fieldType {
		case TypeEnum:
			var opts []EnumOption
			for _, opt := range f.Options {
				optLabel := strings.TrimSpace(opt.Label)
				optVal := strings.ToLower(strings.TrimSpace(opt.Value))
				if optVal == "" {
					optVal = sanitizeKeyRegex.ReplaceAllString(strings.ReplaceAll(strings.ToLower(optLabel), " ", "_"), "")
				}
				if optLabel != "" || optVal != "" {
					if optLabel == "" {
						optLabel = optVal
					}
					opts = append(opts, EnumOption{
						Label: optLabel,
						Value: optVal,
					})
				}
			}
			sanitizedF.Options = opts

		case TypeValueType:
			var opts []ValueTypeOption
			for _, opt := range f.Options {
				optLabel := strings.TrimSpace(opt.Label)
				optVal := strings.ToLower(strings.TrimSpace(opt.Value))
				if optVal == "" {
					optVal = sanitizeKeyRegex.ReplaceAllString(strings.ReplaceAll(strings.ToLower(optLabel), " ", "_"), "")
				}
				pwr := 0.0
				if opt.Power != nil {
					pwr = *opt.Power
				}
				if optLabel != "" || optVal != "" {
					if optLabel == "" {
						optLabel = optVal
					}
					opts = append(opts, ValueTypeOption{
						Label: optLabel,
						Value: optVal,
						Power: &pwr,
					})
				}
			}
			sanitizedF.Options = opts

		case TypeNumber:
			if f.Min != nil && f.Max != nil && *f.Min > *f.Max {
				errs = append(errs, &PropertyValidationError{
					PropertyKey: key,
					Code:        "NUMERIC_BOUNDS_INVALID",
					Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_002: Number field '%s' min (%v) cannot be greater than max (%v).", key, *f.Min, *f.Max),
				})
			}
			sanitizedF.Min = f.Min
			sanitizedF.Max = f.Max
			sanitizedF.Step = f.Step
			sanitizedF.Unit = strings.TrimSpace(f.Unit)

		case TypeBlueprintRef, TypeArrayRef:
			targetID := strings.TrimSpace(f.TargetBlueprintID)
			if targetID == "" {
				errs = append(errs, &PropertyValidationError{
					PropertyKey: key,
					Code:        "TARGET_BLUEPRINT_REQUIRED",
					Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_002: Reference field '%s' requires targetBlueprintId.", key),
				})
			}
			sanitizedF.TargetBlueprintID = targetID

		case TypeFormula:
			expr := strings.TrimSpace(f.FormulaExpression)
			if expr == "" {
				errs = append(errs, &PropertyValidationError{
					PropertyKey: key,
					Code:        "FORMULA_EXPRESSION_REQUIRED",
					Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_002: Formula field '%s' expression cannot be empty.", key),
				})
			} else {
				valRes := ValidateFormulaSyntax(expr)
				if !valRes.Valid {
					errs = append(errs, &PropertyValidationError{
						PropertyKey: key,
						Code:        "FORMULA_SYNTAX_ERROR",
						Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_002: Formula field '%s' syntax error: %s", key, valRes.Error),
					})
				}
				// Prevent direct self-reference
				for _, v := range valRes.ExtractedVariables {
					if strings.EqualFold(v, key) {
						errs = append(errs, &PropertyValidationError{
							PropertyKey: key,
							Code:        "FORMULA_CIRCULAR_DEPENDENCY",
							Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_002: Formula field '%s' cannot reference its own output variable.", key),
						})
					}
				}
			}
			sanitizedF.FormulaExpression = expr

		case TypeArray, TypeBoolean, TypeString:
			// Slate clean
		}

		sanitizedFields = append(sanitizedFields, sanitizedF)
	}

	sanitizedBP := &BlueprintDef{
		ID:             bp.ID,
		ProjectID:      bp.ProjectID,
		Name:           name,
		Slug:           strings.ToLower(strings.ReplaceAll(name, " ", "-")),
		BlueprintClass: bpClass,
		Category:       category,
		Description:    strings.TrimSpace(bp.Description),
		IconName:       bp.IconName,
		Fields:         sanitizedFields,
		IsBuiltIn:      bp.IsBuiltIn,
	}

	return sanitizedBP, errs
}

// ValidateAndSanitizeEntity validates entity attributes against blueprint and deterministically recomputes formulas.
func ValidateAndSanitizeEntity(
	bp BlueprintDef,
	entityName string,
	rawProperties map[string]interface{},
) (map[string]interface{}, map[string]float64, []*PropertyValidationError) {
	name := strings.TrimSpace(entityName)
	var errs []*PropertyValidationError
	if name == "" {
		errs = append(errs, &PropertyValidationError{
			PropertyKey: "name",
			Code:        "ENTITY_NAME_REQUIRED",
			Message:     "BLOCK_WORLD_DYNAMIC_SCHEMA_002: Entity name is required.",
		})
	}

	coercedProps, attrErrs := ValidateEntityAttributes(bp, rawProperties)
	if len(attrErrs) > 0 {
		errs = append(errs, attrErrs...)
	}

	// Compute all formulas on backend deterministically
	computedFormulas := make(map[string]float64)
	for _, f := range bp.Fields {
		if f.FieldType == TypeFormula && strings.TrimSpace(f.FormulaExpression) != "" {
			val, evalErr := EvaluateFormula(f.FormulaExpression, coercedProps)
			if evalErr == nil {
				computedFormulas[f.Name] = val
			} else {
				computedFormulas[f.Name] = 0.0
			}
		}
	}

	return coercedProps, computedFormulas, errs
}

// ValidateAndSanitizeEntityItem validates an EntityItem against a blueprint and recomputes all formulas.
func ValidateAndSanitizeEntityItem(bp BlueprintDef, entity EntityItem) (*EntityItem, []*PropertyValidationError) {
	coercedProps, computedFormulas, errs := ValidateAndSanitizeEntity(bp, entity.Name, entity.Properties)
	sanitized := entity
	sanitized.Name = strings.TrimSpace(entity.Name)
	sanitized.Properties = coercedProps
	sanitized.ComputedFormulas = computedFormulas
	return &sanitized, errs
}
