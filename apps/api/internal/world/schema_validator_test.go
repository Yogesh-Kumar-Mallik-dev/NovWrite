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

func TestValidateAndSanitizeBlueprint_EnforcesLowercaseAndSlateWipe(t *testing.T) {
	bp := BlueprintDef{
		Name:           "  Ancient God Archetype  ",
		BlueprintClass: ClassFirstClass,
		Fields: []DynamicFieldDef{
			{
				Name:      "Divine_Power_Level", // Uppercase to be lowercased
				Label:     "Divine Power Level",
				FieldType: TypeNumber,
				Min:       floatPtr(0),
				Max:       floatPtr(50000),
				FormulaExpression: "attack * 2", // Slate wipe should remove this from NUMBER type!
			},
			{
				Name:      "Soul_Rank",
				Label:     "Soul Realm Rank",
				FieldType: TypeEnum,
				Options: []EnumOption{
					{Label: "Nirvana Stage", Value: "NIRVANA_STAGE"},
					{Label: "Sovereign", Value: ""},
				},
				Min: floatPtr(100), // Slate wipe should remove min from ENUM
			},
			{
				Name:              "Total_Attack",
				Label:             "Total Attack",
				FieldType:         TypeFormula,
				FormulaExpression: "divine_power_level * 1.5 + 500",
			},
		},
	}

	sanitized, errs := ValidateAndSanitizeBlueprint(bp)
	if len(errs) > 0 {
		t.Fatalf("unexpected errors: %v", errs[0].Message)
	}

	if sanitized.Name != "Ancient God Archetype" {
		t.Errorf("expected trimmed name, got %s", sanitized.Name)
	}

	// Check field 0: lowercased key and wiped formula
	f0 := sanitized.Fields[0]
	if f0.Name != "divine_power_level" {
		t.Errorf("expected divine_power_level, got %s", f0.Name)
	}
	if f0.FormulaExpression != "" {
		t.Errorf("expected wiped formula expression on number field, got %s", f0.FormulaExpression)
	}

	// Check field 1: lowercased option values and wiped min
	f1 := sanitized.Fields[1]
	if f1.Name != "soul_rank" {
		t.Errorf("expected soul_rank, got %s", f1.Name)
	}
	if f1.Min != nil {
		t.Errorf("expected wiped min on enum field")
	}
	if len(f1.Options) != 2 || f1.Options[0].Value != "nirvana_stage" || f1.Options[1].Value != "sovereign" {
		t.Errorf("expected lowercased option values, got %+v", f1.Options)
	}

	// Check field 2: formula field
	f2 := sanitized.Fields[2]
	if f2.Name != "total_attack" {
		t.Errorf("expected total_attack, got %s", f2.Name)
	}
	if f2.FormulaExpression != "divine_power_level * 1.5 + 500" {
		t.Errorf("expected formula preserved, got %s", f2.FormulaExpression)
	}
}

func TestValidateAndSanitizeBlueprint_RejectsDuplicatesAndInvalidFormulas(t *testing.T) {
	// Duplicate keys
	bpDup := BlueprintDef{
		Name: "Test BP",
		Fields: []DynamicFieldDef{
			{Name: "mana", Label: "Mana 1", FieldType: TypeNumber},
			{Name: "MANA", Label: "Mana 2", FieldType: TypeNumber},
		},
	}
	_, errs := ValidateAndSanitizeBlueprint(bpDup)
	if len(errs) == 0 {
		t.Errorf("expected error for duplicate field keys")
	}

	// Circular self-referencing formula
	bpCirc := BlueprintDef{
		Name: "Circ BP",
		Fields: []DynamicFieldDef{
			{Name: "power", Label: "Power", FieldType: TypeFormula, FormulaExpression: "power * 2"},
		},
	}
	_, errsCirc := ValidateAndSanitizeBlueprint(bpCirc)
	if len(errsCirc) == 0 {
		t.Errorf("expected error for circular self-referencing formula")
	}
}

func TestValidateAndSanitizeEntity_CalculatesFormulasOnBackend(t *testing.T) {
	bp := BlueprintDef{
		Name:           "Cultivator",
		BlueprintClass: ClassFirstClass,
		Fields: []DynamicFieldDef{
			{Name: "base_attack", FieldType: TypeNumber},
			{Name: "realm_multiplier", FieldType: TypeNumber},
			{Name: "combat_power", FieldType: TypeFormula, FormulaExpression: "base_attack * realm_multiplier + 100"},
		},
	}

	rawProps := map[string]interface{}{
		"Base_Attack":      1200.0,
		"REALM_MULTIPLIER": 2.5,
	}

	coerced, formulas, errs := ValidateAndSanitizeEntity(bp, "Lin Fan", rawProps)
	if len(errs) > 0 {
		t.Fatalf("unexpected validation errors: %v", errs[0].Message)
	}

	if coerced["base_attack"] != 1200.0 {
		t.Errorf("expected coerced base_attack 1200.0, got %v", coerced["base_attack"])
	}

	// 1200 * 2.5 + 100 = 3100
	if formulas["combat_power"] != 3100.0 {
		t.Errorf("expected calculated combat_power 3100.0, got %v", formulas["combat_power"])
	}
}

func floatPtr(v float64) *float64 {
	return &v
}
