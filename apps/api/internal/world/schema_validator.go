package world

import (
	"fmt"
	"regexp"
)

// Block Standard: BLOCK_WORLD_DYNAMIC_SCHEMA_001

var uuidRegex = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

// PropertyType represents the type of dynamic property.
type PropertyType string

const (
	TypeString     PropertyType = "STRING"
	TypeNumber     PropertyType = "NUMBER"
	TypeBoolean    PropertyType = "BOOLEAN"
	TypeEnumSingle PropertyType = "ENUM_SINGLE"
	TypeEnumMulti  PropertyType = "ENUM_MULTI"
	TypeEntityRef  PropertyType = "ENTITY_REF"
	TypeLadderTier PropertyType = "LADDER_TIER"
)

// PropertyValidationRules defines constraints for dynamic properties.
type PropertyValidationRules struct {
	Min           *float64 `json:"min,omitempty"`
	Max           *float64 `json:"max,omitempty"`
	MinLength     *int     `json:"minLength,omitempty"`
	MaxLength     *int     `json:"maxLength,omitempty"`
	AllowedValues []string `json:"allowedValues,omitempty"`
	Required      bool     `json:"required,omitempty"`
}

// DynamicPropertyDef defines a custom schema property.
type DynamicPropertyDef struct {
	ID           string                  `json:"id"`
	ProjectID    string                  `json:"projectId"`
	EntityTypeID string                  `json:"entityTypeId"`
	Name         string                  `json:"name"`
	PropertyType PropertyType            `json:"propertyType"`
	DefaultValue interface{}             `json:"defaultValue,omitempty"`
	Validation   PropertyValidationRules `json:"validation,omitempty"`
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
	if val == nil {
		if def.DefaultValue != nil {
			return def.DefaultValue, nil
		}
		if def.Validation.Required {
			return nil, &PropertyValidationError{
				PropertyKey: def.Name,
				Code:        "REQUIRED_FIELD_MISSING",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' is required", def.Name),
				Value:       nil,
			}
		}
		return nil, nil
	}

	switch def.PropertyType {
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

		if def.Validation.Min != nil && num < *def.Validation.Min {
			return nil, &PropertyValidationError{
				PropertyKey: def.Name,
				Code:        "NUMERIC_BELOW_MIN",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' value (%v) is below minimum (%v)", def.Name, num, *def.Validation.Min),
				Value:       num,
			}
		}
		if def.Validation.Max != nil && num > *def.Validation.Max {
			return nil, &PropertyValidationError{
				PropertyKey: def.Name,
				Code:        "NUMERIC_ABOVE_MAX",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' value (%v) exceeds maximum (%v)", def.Name, num, *def.Validation.Max),
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
		return str, nil

	case TypeEnumSingle, TypeLadderTier:
		str, ok := val.(string)
		if !ok {
			return nil, &PropertyValidationError{
				PropertyKey: def.Name,
				Code:        "TYPE_MISMATCH_ENUM",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' expected string enum option, got %T", def.Name, val),
				Value:       val,
			}
		}
		if len(def.Validation.AllowedValues) > 0 {
			found := false
			for _, allowed := range def.Validation.AllowedValues {
				if allowed == str {
					found = true
					break
				}
			}
			if !found {
				return nil, &PropertyValidationError{
					PropertyKey: def.Name,
					Code:        "ENUM_INVALID_OPTION",
					Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' value '%s' is not in allowed enum options", def.Name, str),
					Value:       str,
				}
			}
		}
		return str, nil

	case TypeEntityRef:
		str, ok := val.(string)
		if !ok || !uuidRegex.MatchString(str) {
			return nil, &PropertyValidationError{
				PropertyKey: def.Name,
				Code:        "INVALID_ENTITY_UUID",
				Message:     fmt.Sprintf("BLOCK_WORLD_DYNAMIC_SCHEMA_001: Property '%s' expected valid entity UUID, received '%v'", def.Name, val),
				Value:       val,
			}
		}
		return str, nil

	default:
		return val, nil
	}
}
