package world

import (
	"testing"
)

// Block Standard: BLOCK_TEST_WORLD_DYNAMIC_SCHEMA_002
func TestValidateSingleProperty_NumberBounds(t *testing.T) {
	minVal := 0.0
	maxVal := 1000.0
	def := DynamicPropertyDef{
		Name:         "mana_capacity",
		PropertyType: TypeNumber,
		DefaultValue: 100.0,
		Validation: PropertyValidationRules{
			Min:      &minVal,
			Max:      &maxVal,
			Required: true,
		},
	}

	// Valid number
	coerced, err := ValidateSingleProperty(def, 500.0)
	if err != nil {
		t.Fatalf("unexpected error for valid number: %v", err.Message)
	}
	if coerced.(float64) != 500.0 {
		t.Errorf("expected 500.0, got %v", coerced)
	}

	// Below min
	_, err = ValidateSingleProperty(def, -10.0)
	if err == nil || err.Code != "NUMERIC_BELOW_MIN" {
		t.Errorf("expected NUMERIC_BELOW_MIN error, got %v", err)
	}

	// Fallback to default
	coercedDefault, err := ValidateSingleProperty(def, nil)
	if err != nil {
		t.Fatalf("unexpected error for null with default: %v", err.Message)
	}
	if coercedDefault.(float64) != 100.0 {
		t.Errorf("expected default 100.0, got %v", coercedDefault)
	}
}

func TestValidateSingleProperty_EnumSingle(t *testing.T) {
	def := DynamicPropertyDef{
		Name:         "cultivation_realm",
		PropertyType: TypeEnumSingle,
		Validation: PropertyValidationRules{
			AllowedValues: []string{"Mortal", "Qi Condensation", "Foundation Establishment", "Core Formation"},
			Required:      true,
		},
	}

	// Valid enum
	val, err := ValidateSingleProperty(def, "Foundation Establishment")
	if err != nil {
		t.Fatalf("unexpected error: %v", err.Message)
	}
	if val.(string) != "Foundation Establishment" {
		t.Errorf("expected Foundation Establishment, got %v", val)
	}

	// Invalid enum
	_, err = ValidateSingleProperty(def, "Transcendent God")
	if err == nil || err.Code != "ENUM_INVALID_OPTION" {
		t.Errorf("expected ENUM_INVALID_OPTION error, got %v", err)
	}
}

func TestValidateSingleProperty_EntityRef(t *testing.T) {
	def := DynamicPropertyDef{
		Name:         "master_entity_id",
		PropertyType: TypeEntityRef,
	}

	// Valid UUID
	val, err := ValidateSingleProperty(def, "a1111111-1111-1111-1111-111111111111")
	if err != nil {
		t.Fatalf("unexpected error for valid UUID: %v", err.Message)
	}
	if val.(string) != "a1111111-1111-1111-1111-111111111111" {
		t.Errorf("expected UUID, got %v", val)
	}

	// Invalid UUID string
	_, err = ValidateSingleProperty(def, "not-a-valid-uuid")
	if err == nil || err.Code != "INVALID_ENTITY_UUID" {
		t.Errorf("expected INVALID_ENTITY_UUID error, got %v", err)
	}
}

func TestValidateEntityAttributes_Blueprint(t *testing.T) {
	powerMultiplier := 2.5
	bp := BlueprintDef{
		ID:             "bp-cultivator-01",
		Name:           "Cultivator / Protagonist",
		BlueprintClass: ClassFirstClass,
		Category:       "Characters",
		Fields: []DynamicFieldDef{
			{
				ID:        "f-gender",
				Name:      "gender",
				Label:     "Gender & Constitution",
				FieldType: TypeEnum,
				Options: []EnumOption{
					{Label: "Male", Value: "male"},
					{Label: "Female", Value: "female"},
					{Label: "Dual-Yin-Yang", Value: "dual_yin_yang", Power: &powerMultiplier},
				},
				IsRequired: true,
			},
			{
				ID:                "f-total-power",
				Name:              "total_combat_power",
				Label:             "Total Combat Power",
				FieldType:         TypeFormula,
				FormulaExpression: "attack * 1.5",
			},
		},
	}

	props := map[string]interface{}{
		"gender": "Dual-Yin-Yang",
	}

	coerced, errs := ValidateEntityAttributes(bp, props)
	if len(errs) > 0 {
		t.Fatalf("unexpected validation errors: %v", errs[0].Message)
	}
	if coerced["gender"] != "Dual-Yin-Yang" {
		t.Errorf("expected gender Dual-Yin-Yang, got %v", coerced["gender"])
	}
}
