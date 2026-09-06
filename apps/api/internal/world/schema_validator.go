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

// PropertyValidationError represents a schema validation failure.
type PropertyValidationError struct {
	PropertyKey string      `json:"propertyKey"`
	Code        string      `json:"code"`
	Message     string      `json:"message"`
	Value       interface{} `json:"value,omitempty"`
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

	for _, f := range bp.Fields {
		rawVal := properties[f.Name]
		propDef := DynamicPropertyDef{
			ID:                f.ID,
			Name:              f.Name,
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
			coerced[f.Name] = val
		}
	}

	return coerced, errs
}
