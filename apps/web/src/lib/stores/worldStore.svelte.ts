/**
 * @file worldStore.svelte.ts
 * @description Svelte 5 Runes reactive store for World Studio Blueprints, Dynamic Fields, Formulas, and Entities.
 * Block Standard: BLOCK_WORLD_STORE_RUNE_002
 */

import {
  evaluateFormula,
  extractFormulaVariables,
} from "../engine/formulaEngine";

export type BlueprintClass = "FIRST_CLASS" | "SECOND_CLASS";

export type BlueprintFieldType =
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "ENUM"
  | "VALUE_TYPE"
  | "BLUEPRINT_REF"
  | "FORMULA";

export interface ValueTypeOptionItem {
  label: string; // Display Name (e.g. "Qi Refining")
  value: string; // Storage key / code (e.g. "qi_refining")
  numericValue?: number; // Numeric Power / Score (e.g. 100)
  power?: number; // Alias for numeric power
  description?: string;
}

export type EnumOptionItem = ValueTypeOptionItem;

export interface DynamicFieldDef {
  id: string;
  name: string; // Machine key e.g. "gender", "romantic_feelings", "total_combat_power"
  label: string; // Human readable label
  fieldType: BlueprintFieldType;
  description?: string;
  required?: boolean;
  defaultValue?: any;

  // For ENUM (supporting both simple strings and dual-valued {name, power} items):
  options?: (string | EnumOptionItem)[];

  // For BLUEPRINT_REF:
  targetBlueprintId?: string; // ID of referenced blueprint (1st or 2nd class)
  targetBlueprintName?: string;
  referenceCardinality?: "ONE" | "MANY";

  // For NUMBER:
  min?: number;
  max?: number;
  step?: number;
  unit?: string; // e.g. "Pts", "Rank", "Atk"

  // For FORMULA:
  formulaExpression?: string; // e.g. "(cultivation.major_realm * cultivation.minor_realm) * special_Physique + attack * attack_technique_Mastery - defence * defence_technique_mastery"
  formulaDependencies?: string[];
}

export interface BlueprintDef {
  id: string;
  name: string;
  blueprintClass: BlueprintClass; // FIRST_CLASS (Entities) | SECOND_CLASS (Sub-Schemas/Value Objects)
  category: string; // Freeform category tag e.g. "Characters", "Relics", "Systems & Affection", "Factions & Sects"
  description: string;
  fields: DynamicFieldDef[];
  isSystemDefault?: boolean;
}

export interface EntityItem {
  id: string;
  name: string;
  blueprintId: string;
  blueprintName: string;
  category: string;
  description: string;
  properties: Record<string, any>;
  computedFormulas?: Record<string, number>;
  lastMutatedSeqNumber: number;
}

// =====================================
// Timeline & Event Sourcing Types
// =====================================

export type EffectOperation =
  | "SET"
  | "INCREMENT"
  | "DECREMENT"
  | "APPEND"
  | "REMOVE"
  | "TRANSFER";

export interface TimelineEffectItem {
  id?: string;
  targetEntityId: string;
  entityName?: string;
  propertyKey: string; // Direct or dot notation e.g. "attack" or "cultivation.major_realm"
  operation: EffectOperation;
  value: any;
}

export interface TimelineEventItem {
  id: string;
  narrativeSequenceNumber: number;
  chronologicalOrder: number;
  title: string;
  description: string;
  anchorChapterTitle?: string;
  anchorSceneTitle?: string;
  anchorSceneId?: string;
  effects: TimelineEffectItem[];
  createdAt?: string;
}

// =====================================
// Invariant Rules Types
// =====================================

export type RuleSeverity = "BLOCKING_ERROR" | "WARNING" | "ADVISORY_NOTE";

export type RuleType =
  | "STATE_GUARD"
  | "NUMERIC_BOUNDS"
  | "PREREQUISITE"
  | "RELATIONAL_GUARD"
  | "FORMULA_BOUNDARY";

export interface InvariantRuleItem {
  id: string;
  name: string;
  severity: RuleSeverity;
  type: RuleType;
  targetBlueprintId?: string;
  targetBlueprintName?: string;
  targetCategory?: string;
  predicateExpression: string;
  predicateSummary: string;
  description: string;
  enabled: boolean;
  suggestedResolution?: string;
}

// =====================================
// Continuity Audit & RFC 7807 Types
// =====================================

export interface ContinuityViolationItem {
  id: string;
  code: string; // e.g. "INVARIANT_STATE_ILLEGAL_ACTION"
  ruleId?: string;
  ruleName: string;
  severity: RuleSeverity;
  sceneId: string;
  sceneTitle: string;
  sequenceNumber: number;
  entityId: string;
  entityName: string;
  property: string;
  expectedValue: string;
  calculatedValue: string;
  historicalCausalEventId?: string;
  historicalCausalEventTitle?: string;
  historicalCausalSequence?: number;
  message: string;
  rfc7807Uri: string;
  suggestedResolution: string;
  overridden?: boolean;
  overrideJustification?: string;
  overriddenBy?: string;
  overriddenAt?: string;
}

// Initial default blueprints showcasing First-Class, Second-Class, Enums, Blueprint References, and Formulas
const initialBlueprints: BlueprintDef[] = [
  // 1. Second-Class Blueprint: Romantic Affection Scale
  {
    id: "bp-sec-affection",
    name: "Romantic Affection Scale",
    blueprintClass: "SECOND_CLASS",
    category: "Systems & Affection",
    description:
      "Dynamic romantic bonds, emotional sentiment tiers, and mutual resonance scales.",
    isSystemDefault: true,
    fields: [
      {
        id: "f-aff-stage",
        name: "relationship_stage",
        label: "Relationship Stage",
        fieldType: "ENUM",
        options: [
          { label: "Stranger", value: "stranger", power: 0, numericValue: 0 },
          { label: "Acquaintance", value: "acquaintance", power: 50, numericValue: 50 },
          { label: "Friend", value: "friend", power: 150, numericValue: 150 },
          { label: "Confidant", value: "confidant", power: 350, numericValue: 350 },
          { label: "Romantic Interest", value: "romantic_interest", power: 650, numericValue: 650 },
          { label: "Soulmate", value: "soulmate", power: 1000, numericValue: 1000 },
          { label: "Nemesis", value: "nemesis", power: -500, numericValue: -500 },
        ],
        defaultValue: "acquaintance",
        description: "Categorical stage of interpersonal dynamic with power weights",
      },
      {
        id: "f-aff-level",
        name: "affection_level",
        label: "Affection Points",
        fieldType: "NUMBER",
        min: -1000,
        max: 1000,
        step: 10,
        unit: "Pts",
        defaultValue: 150,
        description: "Continuous affection score",
      },
      {
        id: "f-aff-trust",
        name: "trust_score",
        label: "Trust Score",
        fieldType: "NUMBER",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 60,
        description: "Mutual reliance quotient",
      },
      {
        id: "f-aff-multiplier",
        name: "bond_power_buff",
        label: "Bond Power Multiplier",
        fieldType: "FORMULA",
        formulaExpression:
          "1.0 + (affection_level / 1000.0) * 0.5 + (trust_score / 100.0) * 0.2",
        description: "Calculated combat buff multiplier from bond depth",
      },
    ],
  },

  // 2. Second-Class Blueprint: Cultivation Rank & Mastery
  {
    id: "bp-sec-cultivation",
    name: "Cultivation Rank & Mastery",
    blueprintClass: "SECOND_CLASS",
    category: "Power Systems",
    description:
      "Dao realms, spiritual grades, major breakthrough ranks, and technique mastery.",
    isSystemDefault: true,
    fields: [
      {
        id: "f-cul-name",
        name: "realm_name",
        label: "Realm Name",
        fieldType: "ENUM",
        options: [
          { label: "Qi Condensation", value: "qi_condensation", power: 100, numericValue: 100 },
          { label: "Foundation Establishment", value: "foundation_establishment", power: 500, numericValue: 500 },
          { label: "Core Formation", value: "core_formation", power: 2500, numericValue: 2500 },
          { label: "Nascent Soul", value: "nascent_soul", power: 10000, numericValue: 10000 },
          { label: "Soul Transformation", value: "soul_transformation", power: 50000, numericValue: 50000 },
          { label: "Void Refinement", value: "void_refinement", power: 250000, numericValue: 250000 },
          { label: "Ascension", value: "ascension", power: 1000000, numericValue: 1000000 },
        ],
        defaultValue: "foundation_establishment",
        description: "Major Dao stage with inherent power rating",
      },
      {
        id: "f-cul-major",
        name: "major_realm",
        label: "Major Realm Tier",
        fieldType: "NUMBER",
        min: 1,
        max: 9,
        step: 1,
        unit: "Tier",
        defaultValue: 2,
        description: "Numeric rank of major realm (1-9)",
      },
      {
        id: "f-cul-minor",
        name: "minor_realm",
        label: "Minor Sub-Realm Grade",
        fieldType: "NUMBER",
        min: 1,
        max: 9,
        step: 1,
        unit: "Stage",
        defaultValue: 3,
        description: "Sub-stage tier within major realm (1-9)",
      },
      {
        id: "f-cul-method",
        name: "cultivation_method",
        label: "Primary Cultivation Method",
        fieldType: "STRING",
        defaultValue: "Silver Dawn Celestial Scripture",
        description: "Active core technique",
      },
    ],
  },

  // 3. First-Class Blueprint: Cultivator / Protagonist
  {
    id: "bp-first-character",
    name: "Cultivator / Protagonist",
    blueprintClass: "FIRST_CLASS",
    category: "Characters",
    description:
      "Primary humanoid sentient beings, martial cultivators, and divine heroes.",
    isSystemDefault: true,
    fields: [
      {
        id: "f-char-gender",
        name: "gender",
        label: "Gender Identity",
        fieldType: "ENUM",
        options: [
          { label: "Male", value: "Male" },
          { label: "Female", value: "Female" },
          { label: "Dual Yin-Yang", value: "Dual-Yin-Yang" },
          { label: "Celestial / Transcendent", value: "Celestial" },
        ],
        defaultValue: "Male",
        description: "Biological or spiritual gender identity",
      },
      {
        id: "f-char-role",
        name: "character_role",
        label: "Narrative Archetype / Role",
        fieldType: "ENUM",
        options: [
          { label: "Protagonist / Chosen One", value: "protagonist" },
          { label: "Antagonist / Arch-Rival", value: "antagonist" },
          { label: "Grandmaster / Mentor", value: "mentor" },
          { label: "Deuteragonist / Companion", value: "companion" },
          { label: "Sect Elder / Guardian", value: "elder" },
        ],
        defaultValue: "protagonist",
        description: "Core story role and narrative function",
      },
      {
        id: "f-char-affinity",
        name: "elemental_affinity",
        label: "Elemental Spiritual Root",
        fieldType: "ENUM",
        options: [
          { label: "Heavenly Thunder Root", value: "thunder", power: 1500, numericValue: 1500 },
          { label: "Pure Solar Fire Root", value: "fire", power: 1200, numericValue: 1200 },
          { label: "Abyssal Frost Root", value: "frost", power: 1100, numericValue: 1100 },
          { label: "Void Chaos Root", value: "void", power: 2500, numericValue: 2500 },
          { label: "Mortal Five-Element Root", value: "five_elements", power: 300, numericValue: 300 },
        ],
        defaultValue: "thunder",
        description: "Inherent spiritual cultivation element with power multiplier",
      },
      {
        id: "f-char-cultivation",
        name: "cultivation",
        label: "Cultivation State",
        fieldType: "BLUEPRINT_REF",
        targetBlueprintId: "bp-sec-cultivation",
        targetBlueprintName: "Cultivation Rank & Mastery",
        description: "Nested cultivation rank 2nd-class sub-blueprint",
      },
      {
        id: "f-char-affection",
        name: "romantic_feelings",
        label: "Romantic Feelings / Affection",
        fieldType: "BLUEPRINT_REF",
        targetBlueprintId: "bp-sec-affection",
        targetBlueprintName: "Romantic Affection Scale",
        description: "Interpersonal affection 2nd-class sub-blueprint reference",
      },
      {
        id: "f-char-weapon-ref",
        name: "bound_weapon",
        label: "Bound Sacred Relic / Weapon",
        fieldType: "BLUEPRINT_REF",
        targetBlueprintId: "bp-first-artifact",
        targetBlueprintName: "Sacred Weapon & Relic",
        description: "1st-Class Relational Reference: Bound soul weapon entity instance",
      },
      {
        id: "f-char-faction-ref",
        name: "sect_allegiance",
        label: "Sect / Clan Allegiance",
        fieldType: "BLUEPRINT_REF",
        targetBlueprintId: "bp-first-faction",
        targetBlueprintName: "Ancient Faction & Sect",
        description: "1st-Class Relational Reference: Sect or faction entity instance",
      },
      {
        id: "f-char-sanctuary-ref",
        name: "residence_realm",
        label: "Cultivation Sanctuary / Domain",
        fieldType: "BLUEPRINT_REF",
        targetBlueprintId: "bp-first-location",
        targetBlueprintName: "Sanctuary & Spiritual Realm",
        description: "1st-Class Relational Reference: Home spiritual sanctuary instance",
      },
      {
        id: "f-char-physique",
        name: "special_Physique",
        label: "Special Physique Multiplier",
        fieldType: "NUMBER",
        min: 1.0,
        max: 10.0,
        step: 0.1,
        unit: "x",
        defaultValue: 2.0,
        description: "Innate physique multiplier (e.g. Solar Sun Bloodline)",
      },
      {
        id: "f-char-atk",
        name: "attack",
        label: "Base Attack Power",
        fieldType: "NUMBER",
        min: 1,
        max: 1000000,
        step: 10,
        unit: "Atk",
        defaultValue: 1200,
        description: "Raw offensive strength",
      },
      {
        id: "f-char-atk-mast",
        name: "attack_technique_Mastery",
        label: "Attack Technique Mastery",
        fieldType: "NUMBER",
        min: 0.1,
        max: 10.0,
        step: 0.1,
        unit: "Mastery",
        defaultValue: 1.8,
        description: "Proficiency scale for combat attack forms",
      },
      {
        id: "f-char-def",
        name: "defence",
        label: "Base Defence Power",
        fieldType: "NUMBER",
        min: 1,
        max: 1000000,
        step: 10,
        unit: "Def",
        defaultValue: 800,
        description: "Raw defensive resistance",
      },
      {
        id: "f-char-def-mast",
        name: "defence_technique_mastery",
        label: "Defence Technique Mastery",
        fieldType: "NUMBER",
        min: 0.1,
        max: 10.0,
        step: 0.1,
        unit: "Mastery",
        defaultValue: 1.2,
        description: "Proficiency scale for protective shields",
      },
      {
        id: "f-char-total-power",
        name: "total_combat_power",
        label: "Total Combat Power",
        fieldType: "FORMULA",
        formulaExpression:
          "(cultivation.major_realm * cultivation.minor_realm) * special_Physique + attack * attack_technique_Mastery - defence * defence_technique_mastery",
        description:
          "Formula: (cultivation.major_realm * cultivation.minor_realm) * special_Physique + attack * attack_technique_Mastery - defence * defence_technique_mastery",
      },
    ],
  },

  // 4. First-Class Blueprint: Sacred Weapon & Relic
  {
    id: "bp-first-artifact",
    name: "Sacred Weapon & Relic",
    blueprintClass: "FIRST_CLASS",
    category: "Relics & Armaments",
    description: "Soul-forged weapons, spirit swords, and celestial artifacts.",
    isSystemDefault: true,
    fields: [
      {
        id: "f-art-type",
        name: "weapon_type",
        label: "Weapon Type",
        fieldType: "ENUM",
        options: [
          "Sword",
          "Saber",
          "Spear",
          "Staff",
          "Bow",
          "Talisman",
          "Cauldron",
        ],
        defaultValue: "Sword",
      },
      {
        id: "f-art-grade",
        name: "grade",
        label: "Refinement Grade",
        fieldType: "ENUM",
        options: [
          "Mortal Grade",
          "Earth Grade",
          "Heaven Grade",
          "Divine Grade",
          "Immortal Grade",
        ],
        defaultValue: "Heaven Grade",
      },
      {
        id: "f-art-damage",
        name: "base_damage",
        label: "Base Damage",
        fieldType: "NUMBER",
        min: 10,
        max: 50000,
        unit: "Dmg",
        defaultValue: 850,
      },
      {
        id: "f-art-sync",
        name: "soul_sync_ratio",
        label: "Soul Sync Ratio",
        fieldType: "NUMBER",
        min: 0,
        max: 1.0,
        step: 0.05,
        unit: "Sync",
        defaultValue: 0.8,
      },
      {
        id: "f-art-wielder",
        name: "current_wielder",
        label: "Current Master / Wielder",
        fieldType: "BLUEPRINT_REF",
        targetBlueprintId: "bp-first-character",
        targetBlueprintName: "Cultivator / Protagonist",
        description: "1st-Class Relational Reference: Master entity instance",
      },
      {
        id: "f-art-origin-loc",
        name: "forging_sanctuary",
        label: "Forging Sanctuary / Origin",
        fieldType: "BLUEPRINT_REF",
        targetBlueprintId: "bp-first-location",
        targetBlueprintName: "Sanctuary & Spiritual Realm",
        description: "1st-Class Relational Reference: Realm where weapon was forged",
      },
      {
        id: "f-art-effective",
        name: "effective_artifact_power",
        label: "Effective Artifact Power",
        fieldType: "FORMULA",
        formulaExpression: "base_damage * (1 + soul_sync_ratio * 0.75)",
        description: "Formula: base_damage * (1 + soul_sync_ratio * 0.75)",
      },
    ],
  },

  // 5. First-Class Blueprint: Sanctuary & Spiritual Realm
  {
    id: "bp-first-location",
    name: "Sanctuary & Spiritual Realm",
    blueprintClass: "FIRST_CLASS",
    category: "Cosmology & Geography",
    description:
      "Spiritual domains, mountain peaks, floating islands, and astral realms.",
    isSystemDefault: true,
    fields: [
      {
        id: "f-loc-type",
        name: "domain_type",
        label: "Domain Category",
        fieldType: "ENUM",
        options: [
          "Mountain Peak",
          "Ancient Ruin",
          "Spiritual Lake",
          "Floating Citadel",
          "Abyssal Rift",
        ],
        defaultValue: "Floating Citadel",
      },
      {
        id: "f-loc-mana",
        name: "ambient_mana_density",
        label: "Ambient Mana Density",
        fieldType: "NUMBER",
        min: 1.0,
        max: 100.0,
        unit: "Mana/m³",
        defaultValue: 15.0,
      },
      {
        id: "f-loc-spatial",
        name: "spatial_stability",
        label: "Spatial Stability Ratio",
        fieldType: "NUMBER",
        min: 0.0,
        max: 1.0,
        defaultValue: 0.95,
      },
      {
        id: "f-loc-faction",
        name: "controlling_faction",
        label: "Controlling Faction / Sect",
        fieldType: "BLUEPRINT_REF",
        targetBlueprintId: "bp-first-faction",
        targetBlueprintName: "Ancient Faction & Sect",
        description: "1st-Class Relational Reference: Faction occupying this sanctuary",
      },
      {
        id: "f-loc-guardian",
        name: "guardian_elder",
        label: "Sanctuary Guardian / Elder",
        fieldType: "BLUEPRINT_REF",
        targetBlueprintId: "bp-first-character",
        targetBlueprintName: "Cultivator / Protagonist",
        description: "1st-Class Relational Reference: Guardian character instance",
      },
      {
        id: "f-loc-accel",
        name: "cultivation_acceleration",
        label: "Cultivation Acceleration Rate",
        fieldType: "FORMULA",
        formulaExpression: "ambient_mana_density * spatial_stability * 1.5",
        description: "Formula: ambient_mana_density * spatial_stability * 1.5",
      },
    ],
  },

  // 6. First-Class Blueprint: Ancient Faction & Sect
  {
    id: "bp-first-faction",
    name: "Ancient Faction & Sect",
    blueprintClass: "FIRST_CLASS",
    category: "Factions & Sects",
    description:
      "Cultivation sects, grand imperial dynasties, alchemy guilds, and ancient clans.",
    isSystemDefault: true,
    fields: [
      {
        id: "f-fac-type",
        name: "sect_type",
        label: "Faction Classification",
        fieldType: "ENUM",
        options: [
          { label: "Immortal Orthodox Sect", value: "orthodox_sect", power: 1000 },
          { label: "Demonic Blood Cult", value: "demonic_cult", power: 1200 },
          { label: "Ancient Imperial Dynasty", value: "imperial_dynasty", power: 2500 },
          { label: "Merchant Guild Alliance", value: "merchant_guild", power: 800 },
          { label: "Hidden Hermit Clan", value: "hermit_clan", power: 1800 },
        ],
        defaultValue: "orthodox_sect",
        description: "Organizational alignment and prestige power weight",
      },
      {
        id: "f-fac-leader",
        name: "sect_master",
        label: "Sect Master / Grand Patriarch",
        fieldType: "BLUEPRINT_REF",
        targetBlueprintId: "bp-first-character",
        targetBlueprintName: "Cultivator / Protagonist",
        description: "1st-Class Relational Reference: Leading sovereign character instance",
      },
      {
        id: "f-fac-domain",
        name: "headquarters_sanctuary",
        label: "Headquarters Sanctuary Domain",
        fieldType: "BLUEPRINT_REF",
        targetBlueprintId: "bp-first-location",
        targetBlueprintName: "Sanctuary & Spiritual Realm",
        description: "1st-Class Relational Reference: Main spiritual sanctuary instance",
      },
      {
        id: "f-fac-relic",
        name: "sacred_guardian_relic",
        label: "Sacred Guardian Weapon / Relic",
        fieldType: "BLUEPRINT_REF",
        targetBlueprintId: "bp-first-artifact",
        targetBlueprintName: "Sacred Weapon & Relic",
        description: "1st-Class Relational Reference: Sect-protecting artifact instance",
      },
      {
        id: "f-fac-disciples",
        name: "disciple_count",
        label: "Total Registered Disciples",
        fieldType: "NUMBER",
        min: 10,
        max: 1000000,
        step: 50,
        unit: "Disciples",
        defaultValue: 5000,
        description: "Active sworn cultivators in the sect",
      },
      {
        id: "f-fac-vein",
        name: "qi_vein_grade",
        label: "Ancestral Qi Vein Tier",
        fieldType: "ENUM",
        options: [
          { label: "Tier 1 Spirit Vein", value: "tier_1", power: 100 },
          { label: "Tier 2 Spirit Vein", value: "tier_2", power: 300 },
          { label: "Tier 3 Earth Vein", value: "tier_3", power: 800 },
          { label: "Tier 4 Heaven Vein", value: "tier_4", power: 2000 },
          { label: "Tier 5 Dragon Vein", value: "tier_5", power: 5000 },
        ],
        defaultValue: "tier_3",
        description: "Ancestral underground Qi formation rating",
      },
      {
        id: "f-fac-influence",
        name: "total_sect_influence",
        label: "Total Sect Influence Rating",
        fieldType: "FORMULA",
        formulaExpression: "disciple_count * 0.1 + qi_vein_grade.power * 2.5",
        description: "Formula: disciple_count * 0.1 + qi_vein_grade.power * 2.5",
      },
    ],
  },
];

// Initial demo entities instantiated from First-Class Blueprints
const initialEntities: EntityItem[] = [
  {
    id: "a1111111-1111-4111-a111-111111111111",
    name: "Eldrin the Spellblade",
    blueprintId: "bp-first-character",
    blueprintName: "Cultivator / Protagonist",
    category: "Characters",
    description:
      "Protagonist and grand disciple of the Silver Vanguard sword sect.",
    properties: {
      gender: "Male",
      character_role: "protagonist",
      elemental_affinity: "thunder",
      cultivation: {
        realm_name: "Core Formation",
        major_realm: 3,
        minor_realm: 5,
        cultivation_method: "Silver Dawn Celestial Scripture",
      },
      romantic_feelings: {
        relationship_stage: "Romantic Interest",
        affection_level: 450,
        trust_score: 85,
      },
      bound_weapon: "c3333333-3333-4333-a333-333333333333",
      sect_allegiance: "e5555555-5555-4555-a555-555555555555",
      residence_realm: "d4444444-4444-4444-a444-444444444444",
      special_Physique: 2.0,
      attack: 1200,
      attack_technique_Mastery: 1.8,
      defence: 800,
      defence_technique_mastery: 1.2,
    },
    lastMutatedSeqNumber: 50,
  },
  {
    id: "b2222222-2222-4222-a222-222222222222",
    name: "Lyra of the Astral Veil",
    blueprintId: "bp-first-character",
    blueprintName: "Cultivator / Protagonist",
    category: "Characters",
    description:
      "Astral Covenant sorceress with void distortion runes and dual-spirit bloodline.",
    properties: {
      gender: "Female",
      character_role: "companion",
      elemental_affinity: "void",
      cultivation: {
        realm_name: "Core Formation",
        major_realm: 3,
        minor_realm: 7,
        cultivation_method: "Astral Void Scripture",
      },
      romantic_feelings: {
        relationship_stage: "Soulmate",
        affection_level: 820,
        trust_score: 95,
      },
      bound_weapon: "",
      sect_allegiance: "e5555555-5555-4555-a555-555555555555",
      residence_realm: "d4444444-4444-4444-a444-444444444444",
      special_Physique: 2.5,
      attack: 1450,
      attack_technique_Mastery: 2.1,
      defence: 650,
      defence_technique_mastery: 1.5,
    },
    lastMutatedSeqNumber: 52,
  },
  {
    id: "c3333333-3333-4333-a333-333333333333",
    name: "Dawnbreaker Blade of Aethelgard",
    blueprintId: "bp-first-artifact",
    blueprintName: "Sacred Weapon & Relic",
    category: "Relics & Armaments",
    description:
      "Ancient solar-forged blade that amplifies soul-resonance waves.",
    properties: {
      weapon_type: "Sword",
      grade: "Divine Grade",
      base_damage: 2400,
      soul_sync_ratio: 0.9,
      current_wielder: "a1111111-1111-4111-a111-111111111111",
      forging_sanctuary: "d4444444-4444-4444-a444-444444444444",
    },
    lastMutatedSeqNumber: 15,
  },
  {
    id: "d4444444-4444-4444-a444-444444444444",
    name: "Celestial Cloud Peak Sanctuary",
    blueprintId: "bp-first-location",
    blueprintName: "Sanctuary & Spiritual Realm",
    category: "Cosmology & Geography",
    description:
      "Floating jade mountain where ambient spiritual density exceeds mortal limits.",
    properties: {
      domain_type: "Floating Citadel",
      ambient_mana_density: 35.0,
      spatial_stability: 0.98,
      controlling_faction: "e5555555-5555-4555-a555-555555555555",
      guardian_elder: "a1111111-1111-4111-a111-111111111111",
    },
    lastMutatedSeqNumber: 20,
  },
  {
    id: "e5555555-5555-4555-a555-555555555555",
    name: "Azure Cloud Sword Sect",
    blueprintId: "bp-first-faction",
    blueprintName: "Ancient Faction & Sect",
    category: "Factions & Sects",
    description:
      "Prominent immortal sword cultivation sect nestled atop the celestial jade peaks.",
    properties: {
      sect_type: "orthodox_sect",
      sect_master: "a1111111-1111-4111-a111-111111111111",
      headquarters_sanctuary: "d4444444-4444-4444-a444-444444444444",
      sacred_guardian_relic: "c3333333-3333-4333-a333-333333333333",
      disciple_count: 8500,
      grand_elder_power: 450,
      sect_heritage_rank: "immortal_heritage",
      domain_territory_scale: 120,
    },
    lastMutatedSeqNumber: 10,
  },
];

const initialTimelineEvents: TimelineEventItem[] = [
  {
    id: "ev-1",
    narrativeSequenceNumber: 10,
    chronologicalOrder: 100,
    title: "Initiation at Celestial Cloud Peak",
    description:
      "Eldrin awakens his Thunder Spirit Vein and is accepted as an outer court disciple of the Azure Cloud Sword Sect.",
    anchorChapterTitle: "Chapter 1: The Gathering Tempest",
    anchorSceneTitle: "Scene 1: The Mountain Gate Trials",
    anchorSceneId: "scene-awakening-10",
    effects: [
      {
        targetEntityId: "a1111111-1111-4111-a111-111111111111",
        entityName: "Eldrin the Spellblade",
        propertyKey: "cultivation.major_realm",
        operation: "SET",
        value: 1,
      },
      {
        targetEntityId: "a1111111-1111-4111-a111-111111111111",
        entityName: "Eldrin the Spellblade",
        propertyKey: "cultivation.realm_name",
        operation: "SET",
        value: "Qi Refining",
      },
      {
        targetEntityId: "a1111111-1111-4111-a111-111111111111",
        entityName: "Eldrin the Spellblade",
        propertyKey: "attack",
        operation: "SET",
        value: 300,
      },
      {
        targetEntityId: "a1111111-1111-4111-a111-111111111111",
        entityName: "Eldrin the Spellblade",
        propertyKey: "sect_allegiance",
        operation: "SET",
        value: "e5555555-5555-4555-a555-555555555555",
      },
    ],
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "ev-2",
    narrativeSequenceNumber: 25,
    chronologicalOrder: 102,
    title: "Bestowal of the Dawnbreaker Blade",
    description:
      "The Grand Elder confers the solar-forged Dawnbreaker Blade upon Eldrin following the Inner Sect Tournament.",
    anchorChapterTitle: "Chapter 3: Blade of the Sun",
    anchorSceneTitle: "Scene 2: The Ancestral Vault",
    anchorSceneId: "scene-bestowal-25",
    effects: [
      {
        targetEntityId: "a1111111-1111-4111-a111-111111111111",
        entityName: "Eldrin the Spellblade",
        propertyKey: "bound_weapon",
        operation: "SET",
        value: "c3333333-3333-4333-a333-333333333333",
      },
      {
        targetEntityId: "c3333333-3333-4333-a333-333333333333",
        entityName: "Dawnbreaker Blade of Aethelgard",
        propertyKey: "current_wielder",
        operation: "SET",
        value: "a1111111-1111-4111-a111-111111111111",
      },
      {
        targetEntityId: "a1111111-1111-4111-a111-111111111111",
        entityName: "Eldrin the Spellblade",
        propertyKey: "attack",
        operation: "INCREMENT",
        value: 450,
      },
    ],
    createdAt: "2026-09-02T12:00:00Z",
  },
  {
    id: "ev-3",
    narrativeSequenceNumber: 35,
    chronologicalOrder: 105,
    title: "Foundation Stage Breakthrough & Astral Bond",
    description:
      "Eldrin and Lyra perform dual cultivation resonance, breaking through to Foundation Realm 3.",
    anchorChapterTitle: "Chapter 5: Astral Resonance",
    anchorSceneTitle: "Scene 1: The Silver Jade Pool",
    anchorSceneId: "scene-breakthrough-35",
    effects: [
      {
        targetEntityId: "a1111111-1111-4111-a111-111111111111",
        entityName: "Eldrin the Spellblade",
        propertyKey: "cultivation.major_realm",
        operation: "SET",
        value: 2,
      },
      {
        targetEntityId: "a1111111-1111-4111-a111-111111111111",
        entityName: "Eldrin the Spellblade",
        propertyKey: "cultivation.realm_name",
        operation: "SET",
        value: "Foundation",
      },
      {
        targetEntityId: "a1111111-1111-4111-a111-111111111111",
        entityName: "Eldrin the Spellblade",
        propertyKey: "romantic_feelings.affection_level",
        operation: "INCREMENT",
        value: 200,
      },
      {
        targetEntityId: "b2222222-2222-4222-a222-222222222222",
        entityName: "Lyra of the Astral Veil",
        propertyKey: "romantic_feelings.affection_level",
        operation: "INCREMENT",
        value: 250,
      },
    ],
    createdAt: "2026-09-03T15:30:00Z",
  },
  {
    id: "ev-4",
    narrativeSequenceNumber: 50,
    chronologicalOrder: 108,
    title: "Clash at Crimson Ridge & Core Formation",
    description:
      "Surrounded by Void Syndicate assassins, Eldrin unlocks the Silver Dawn Celestial Core and achieves Core Formation.",
    anchorChapterTitle: "Chapter 8: The Crimson Crucible",
    anchorSceneTitle: "Scene 3: Thunder Over Crimson Ridge",
    anchorSceneId: "scene-duel-50",
    effects: [
      {
        targetEntityId: "a1111111-1111-4111-a111-111111111111",
        entityName: "Eldrin the Spellblade",
        propertyKey: "cultivation.major_realm",
        operation: "SET",
        value: 3,
      },
      {
        targetEntityId: "a1111111-1111-4111-a111-111111111111",
        entityName: "Eldrin the Spellblade",
        propertyKey: "cultivation.realm_name",
        operation: "SET",
        value: "Core Formation",
      },
      {
        targetEntityId: "a1111111-1111-4111-a111-111111111111",
        entityName: "Eldrin the Spellblade",
        propertyKey: "attack",
        operation: "SET",
        value: 1200,
      },
      {
        targetEntityId: "a1111111-1111-4111-a111-111111111111",
        entityName: "Eldrin the Spellblade",
        propertyKey: "special_Physique",
        operation: "SET",
        value: 2.0,
      },
    ],
    createdAt: "2026-09-04T18:00:00Z",
  },
  {
    id: "ev-5",
    narrativeSequenceNumber: 80,
    chronologicalOrder: 50, // Flashback to Year 50
    title: "Flashback: The Ancient Sovereign's Sealing",
    description:
      "Historical flashback 58 years ago showing the sealing of the demonic abyss beneath Mount Aethelgard.",
    anchorChapterTitle: "Chapter 12: Echoes of the Past",
    anchorSceneTitle: "Scene 1: The Abyssal Seal",
    anchorSceneId: "scene-flashback-80",
    effects: [
      {
        targetEntityId: "d4444444-4444-4444-a444-444444444444",
        entityName: "Celestial Cloud Peak Sanctuary",
        propertyKey: "spatial_stability",
        operation: "SET",
        value: 0.98,
      },
    ],
    createdAt: "2026-09-05T09:00:00Z",
  },
];

const initialRules: InvariantRuleItem[] = [
  {
    id: "rule-1",
    name: "Deceased Entity Action Restriction",
    severity: "BLOCKING_ERROR",
    type: "STATE_GUARD",
    targetCategory: "Characters",
    targetBlueprintId: "bp-first-character",
    targetBlueprintName: "Cultivator / Protagonist",
    predicateExpression: "status != 'DEAD' || attempted_action == 'RESURRECTION'",
    predicateSummary:
      "IF status == DEAD THEN FORBID [CAST_SPELL, ATTACK, WIELD_WEAPON, SPEAK]",
    description:
      "Deceased characters cannot perform active spells, combat attacks, or dialogue without a preceding resurrection event.",
    enabled: true,
    suggestedResolution:
      "Insert a Resurrection or Reincarnation timeline event before this scene.",
  },
  {
    id: "rule-2",
    name: "Core Formation Domain Prerequisite",
    severity: "BLOCKING_ERROR",
    type: "PREREQUISITE",
    targetCategory: "Characters",
    targetBlueprintId: "bp-first-character",
    targetBlueprintName: "Cultivator / Protagonist",
    predicateExpression: "cultivation.major_realm >= 3",
    predicateSummary:
      "REQUIRES cultivation.major_realm >= 3 (Core Formation) FOR [Astral_Veil_Domain, Heavenly_Thunder_Clash]",
    description:
      "High-tier domain techniques and Heavenly Thunder spells strictly require Core Formation (Realm 3) cultivation or higher.",
    enabled: true,
    suggestedResolution:
      "Advance character's cultivation stage via Breakthrough event at an earlier sequence.",
  },
  {
    id: "rule-3",
    name: "Sacred Relic Wielder Synchronization",
    severity: "WARNING",
    type: "RELATIONAL_GUARD",
    targetCategory: "Relics & Armaments",
    targetBlueprintId: "bp-first-artifact",
    targetBlueprintName: "Sacred Weapon & Relic",
    predicateExpression: "current_wielder != null && bound_weapon == entity.id",
    predicateSummary: "WIELDER(Sacred_Relic) MUST_MATCH character.bound_weapon",
    description:
      "Sacred soul-forged weapons cannot emit soul-resonance waves if the wielder entity's bound_weapon does not match.",
    enabled: true,
    suggestedResolution:
      "Link character's bound_weapon attribute to the weapon in entity properties or log a Wielding Event.",
  },
  {
    id: "rule-4",
    name: "Non-Negative Martial Bounds",
    severity: "BLOCKING_ERROR",
    type: "NUMERIC_BOUNDS",
    targetCategory: "Characters",
    targetBlueprintId: "bp-first-character",
    targetBlueprintName: "Cultivator / Protagonist",
    predicateExpression: "attack >= 0 && defence >= 0",
    predicateSummary: "attack >= 0 AND defence >= 0",
    description:
      "Base martial attributes and physical defensive power cannot fall below 0 under any curse or debuff.",
    enabled: true,
    suggestedResolution:
      "Adjust decrementing debuff effect values to stay within positive bounds.",
  },
  {
    id: "rule-5",
    name: "Sect Grand Barrier Influence Threshold",
    severity: "WARNING",
    type: "FORMULA_BOUNDARY",
    targetCategory: "Factions & Sects",
    targetBlueprintId: "bp-first-faction",
    targetBlueprintName: "Ancient Faction & Sect",
    predicateExpression: "total_sect_influence >= 1500",
    predicateSummary: "FORMULA(total_sect_influence) >= 1500",
    description:
      "Sect guardian formation requires total sect influence rating >= 1500 to withstand foreign invasion.",
    enabled: true,
    suggestedResolution:
      "Increase sworn disciple count or upgrade ancestral spirit vein tier.",
  },
];

const initialViolations: ContinuityViolationItem[] = [
  {
    id: "viol-1",
    code: "INVARIANT_STATE_ILLEGAL_ACTION",
    ruleId: "rule-1",
    ruleName: "Deceased Entity Action Restriction",
    severity: "BLOCKING_ERROR",
    sceneId: "scene-forbidden-ritual-55",
    sceneTitle: "Scene 4: The Forbidden Ritual (Chapter 9)",
    sequenceNumber: 55,
    entityId: "a1111111-1111-4111-a111-111111111111",
    entityName: "Lord Malakor",
    property: "status",
    expectedValue: "Action 'CAST_SPELL' forbidden when status is DEAD",
    calculatedValue: "status: DEAD, attemptedAction: CAST_SPELL",
    historicalCausalEventId: "ev-4",
    historicalCausalEventTitle: "Clash at Crimson Ridge & Core Formation",
    historicalCausalSequence: 50,
    message:
      "Rule 'Deceased Entity Action Restriction' violated: Lord Malakor was marked DEAD at Seq #50 and cannot execute action 'CAST_SPELL' in Scene 4 without resurrection.",
    rfc7807Uri:
      "https://novwrite.io/errors/invariants/invariant-state-illegal-action",
    suggestedResolution:
      "Insert a Resurrection event before Scene 4 or change the acting antagonist.",
  },
  {
    id: "viol-2",
    code: "INVARIANT_REQUIRED_PREREQUISITE_MISSING",
    ruleId: "rule-2",
    ruleName: "Core Formation Domain Prerequisite",
    severity: "BLOCKING_ERROR",
    sceneId: "scene-mountain-trial-20",
    sceneTitle: "Scene 2: The Mountain Gate Trials (Chapter 2)",
    sequenceNumber: 20,
    entityId: "a1111111-1111-4111-a111-111111111111",
    entityName: "Eldrin the Spellblade",
    property: "cultivation.major_realm",
    expectedValue: "cultivation.major_realm >= 3 (Core Formation)",
    calculatedValue: "cultivation.major_realm = 1 (Qi Refining Stage)",
    historicalCausalEventId: "ev-1",
    historicalCausalEventTitle: "Initiation at Celestial Cloud Peak",
    historicalCausalSequence: 10,
    message:
      "Rule 'Core Formation Domain Prerequisite' violated: Eldrin the Spellblade attempts to cast 'Heavenly Thunder Clash' in Scene 2 while at Realm 1 (Qi Refining).",
    rfc7807Uri:
      "https://novwrite.io/errors/invariants/invariant-required-prerequisite-missing",
    suggestedResolution:
      "Advance Eldrin's breakthrough event to Seq #18 or downgrade the spell in Scene 2.",
  },
  {
    id: "viol-3",
    code: "INVARIANT_RELATIONAL_LINK_DESYNC",
    ruleId: "rule-3",
    ruleName: "Sacred Relic Wielder Synchronization",
    severity: "WARNING",
    sceneId: "scene-defense-floating-sanctuary-28",
    sceneTitle: "Scene 3: Defense of the Floating Sanctuary (Chapter 4)",
    sequenceNumber: 28,
    entityId: "c3333333-3333-4333-a333-333333333333",
    entityName: "Dawnbreaker Blade of Aethelgard",
    property: "current_wielder",
    expectedValue: "current_wielder matches Eldrin.bound_weapon",
    calculatedValue: "current_wielder: Eldrin, Eldrin.bound_weapon: null",
    historicalCausalEventId: "ev-2",
    historicalCausalEventTitle: "Bestowal of the Dawnbreaker Blade",
    historicalCausalSequence: 25,
    message:
      "Rule 'Sacred Relic Wielder Synchronization' warning: Dawnbreaker Blade lists Eldrin as wielder, but Eldrin has not equipped the blade.",
    rfc7807Uri:
      "https://novwrite.io/errors/invariants/invariant-relational-link-desync",
    suggestedResolution:
      "Update Eldrin's bound_weapon attribute to link Dawnbreaker Blade.",
  },
];

export class WorldStateStore {
  blueprints = $state<BlueprintDef[]>([...initialBlueprints]);
  entities = $state<EntityItem[]>([...initialEntities]);
  timelineEvents = $state<TimelineEventItem[]>([...initialTimelineEvents]);
  rules = $state<InvariantRuleItem[]>([...initialRules]);
  violations = $state<ContinuityViolationItem[]>([...initialViolations]);

  constructor() {
    this.recomputeAllEntityFormulas();
  }

  // =====================================
  // Blueprint CRUD Methods
  // =====================================

  getBlueprints(blueprintClass?: BlueprintClass): BlueprintDef[] {
    if (!blueprintClass) return this.blueprints;
    return this.blueprints.filter((b) => b.blueprintClass === blueprintClass);
  }

  getFirstClassBlueprints(): BlueprintDef[] {
    return this.getBlueprints("FIRST_CLASS");
  }

  getSecondClassBlueprints(): BlueprintDef[] {
    return this.getBlueprints("SECOND_CLASS");
  }

  getBlueprint(id?: string): BlueprintDef | undefined {
    if (!id) return undefined;
    return this.blueprints.find((b) => b.id === id);
  }

  addBlueprint(data: Omit<BlueprintDef, "id">): BlueprintDef {
    const newBlueprint: BlueprintDef = {
      ...data,
      id: `bp-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`,
      fields: data.fields || [],
    };
    this.blueprints.push(newBlueprint);
    return newBlueprint;
  }

  updateBlueprint(
    id: string | undefined,
    updates: Partial<Omit<BlueprintDef, "id">>,
  ): BlueprintDef | undefined {
    if (!id) return undefined;
    const idx = this.blueprints.findIndex((b) => b.id === id);
    if (idx === -1) return undefined;

    this.blueprints[idx] = {
      ...this.blueprints[idx],
      ...updates,
      fields: updates.fields || this.blueprints[idx].fields,
    };

    this.recomputeAllEntityFormulas();
    return this.blueprints[idx];
  }

  deleteBlueprint(id?: string): boolean {
    if (!id) return false;
    const idx = this.blueprints.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    this.blueprints.splice(idx, 1);
    this.recomputeAllEntityFormulas();
    return true;
  }

  // =====================================
  // Dynamic Field CRUD Methods
  // =====================================

  addFieldToBlueprint(
    blueprintId: string,
    field: Omit<DynamicFieldDef, "id">,
  ): DynamicFieldDef | undefined {
    const bp = this.getBlueprint(blueprintId);
    if (!bp) return undefined;

    const newField: DynamicFieldDef = {
      ...field,
      id: `f-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`,
    };

    bp.fields.push(newField);
    this.recomputeAllEntityFormulas();
    return newField;
  }

  updateFieldInBlueprint(
    blueprintId: string,
    fieldId: string,
    updates: Partial<DynamicFieldDef>,
  ): DynamicFieldDef | undefined {
    const bp = this.getBlueprint(blueprintId);
    if (!bp) return undefined;

    const fIdx = bp.fields.findIndex((f) => f.id === fieldId);
    if (fIdx === -1) return undefined;

    bp.fields[fIdx] = {
      ...bp.fields[fIdx],
      ...updates,
    };

    this.recomputeAllEntityFormulas();
    return bp.fields[fIdx];
  }

  removeFieldFromBlueprint(blueprintId: string, fieldId: string): boolean {
    const bp = this.getBlueprint(blueprintId);
    if (!bp) return false;

    const fIdx = bp.fields.findIndex((f) => f.id === fieldId);
    if (fIdx === -1) return false;

    bp.fields.splice(fIdx, 1);
    this.recomputeAllEntityFormulas();
    return true;
  }

  deleteBlueprintField(blueprintId: string, fieldId: string): boolean {
    return this.removeFieldFromBlueprint(blueprintId, fieldId);
  }

  // =====================================
  // Dynamic Option CRUD Methods
  // =====================================

  addOptionToField(
    blueprintId: string,
    fieldId: string,
    option: EnumOptionItem | string,
  ): boolean {
    const bp = this.getBlueprint(blueprintId);
    if (!bp) return false;
    const field = bp.fields.find((f) => f.id === fieldId || f.name === fieldId);
    if (!field || (field.fieldType !== "ENUM" && field.fieldType !== "VALUE_TYPE")) return false;
    if (!field.options) field.options = [];
    field.options.push(option);
    this.recomputeAllEntityFormulas();
    return true;
  }

  updateOptionInField(
    blueprintId: string,
    fieldId: string,
    optionIndex: number,
    updatedOption: EnumOptionItem | string,
  ): boolean {
    const bp = this.getBlueprint(blueprintId);
    if (!bp) return false;
    const field = bp.fields.find((f) => f.id === fieldId || f.name === fieldId);
    if (!field || (field.fieldType !== "ENUM" && field.fieldType !== "VALUE_TYPE") || !field.options || optionIndex < 0 || optionIndex >= field.options.length) return false;
    field.options[optionIndex] = updatedOption;
    this.recomputeAllEntityFormulas();
    return true;
  }

  removeOptionFromField(
    blueprintId: string,
    fieldId: string,
    optionIndex: number,
  ): boolean {
    const bp = this.getBlueprint(blueprintId);
    if (!bp) return false;
    const field = bp.fields.find((f) => f.id === fieldId || f.name === fieldId);
    if (!field || (field.fieldType !== "ENUM" && field.fieldType !== "VALUE_TYPE") || !field.options || optionIndex < 0 || optionIndex >= field.options.length) return false;
    field.options.splice(optionIndex, 1);
    this.recomputeAllEntityFormulas();
    return true;
  }

  // =====================================
  // Entity CRUD & Reactive Formula Evaluation
  // =====================================

  getEntity(id?: string): EntityItem | undefined {
    if (!id) return undefined;
    const ent = this.entities.find((e) => e.id === id);
    if (ent) {
      ent.computedFormulas = this.evaluateEntityFormulas(ent);
    }
    return ent;
  }

  addEntity(
    data: Omit<EntityItem, "id" | "lastMutatedSeqNumber" | "computedFormulas">,
  ): EntityItem {
    const bp = this.getBlueprint(data.blueprintId);
    const newEntity: EntityItem = {
      ...data,
      id: `ent-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 8)}`,
      blueprintName: bp ? bp.name : data.blueprintName,
      category: bp ? bp.category : data.category,
      lastMutatedSeqNumber: 0,
    };

    newEntity.computedFormulas = this.evaluateEntityFormulas(newEntity, bp);
    this.entities.push(newEntity);
    return newEntity;
  }

  updateEntity(
    id: string | undefined,
    updates: Partial<Omit<EntityItem, "id">>,
  ): EntityItem | undefined {
    if (!id) return undefined;
    const idx = this.entities.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;

    this.entities[idx] = {
      ...this.entities[idx],
      ...updates,
      properties: {
        ...this.entities[idx].properties,
        ...(updates.properties || {}),
      },
    };

    this.entities[idx].computedFormulas = this.evaluateEntityFormulas(
      this.entities[idx],
    );
    return this.entities[idx];
  }

  deleteEntity(id?: string): boolean {
    if (!id) return false;
    const idx = this.entities.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.entities.splice(idx, 1);
    return true;
  }

  // =====================================
  // Dynamic Formula & Reference Resolution
  // =====================================

  evaluateEntityFormulas(
    entity: { properties: Record<string, any>; blueprintId: string },
    bp?: BlueprintDef,
  ): Record<string, number> {
    const blueprint = bp || this.getBlueprint(entity.blueprintId);
    if (!blueprint) return {};

    const computed: Record<string, number> = {};
    const context: Record<string, any> = { ...entity.properties };

    // Enrich context with dual-valued value_type/enum options and resolved references
    for (const field of blueprint.fields) {
      if ((field.fieldType === "ENUM" || field.fieldType === "VALUE_TYPE") && field.options) {
        const rawVal = entity.properties[field.name];
        if (rawVal !== undefined && rawVal !== null) {
          const matchingOpt = field.options.find((opt) => {
            if (typeof opt === "string") return opt === rawVal;
            return opt.value === rawVal || opt.label === rawVal;
          });

          if (matchingOpt && typeof matchingOpt === "object") {
            const numVal = matchingOpt.numericValue ?? matchingOpt.power ?? 0;
            context[field.name] = {
              label: matchingOpt.label,
              value: matchingOpt.value,
              name: matchingOpt.label,
              numericValue: numVal,
              power: numVal,
            };
          }
        }
      } else if (field.fieldType === "BLUEPRINT_REF" && field.targetBlueprintId) {
        const targetBp = this.getBlueprint(field.targetBlueprintId);
        if (targetBp && targetBp.blueprintClass === "SECOND_CLASS") {
          const subProps = entity.properties[field.name];
          if (subProps && typeof subProps === "object") {
            const enrichedSub: Record<string, any> = { ...subProps };
            for (const subF of targetBp.fields) {
              if ((subF.fieldType === "ENUM" || subF.fieldType === "VALUE_TYPE") && subF.options) {
                const subRawVal = subProps[subF.name];
                if (subRawVal !== undefined && subRawVal !== null) {
                  const subMatchingOpt = subF.options.find((opt) => {
                    if (typeof opt === "string") return opt === subRawVal;
                    return opt.value === subRawVal || opt.label === subRawVal;
                  });
                  if (subMatchingOpt && typeof subMatchingOpt === "object") {
                    const numVal = subMatchingOpt.numericValue ?? subMatchingOpt.power ?? 0;
                    enrichedSub[subF.name] = {
                      label: subMatchingOpt.label,
                      value: subMatchingOpt.value,
                      name: subMatchingOpt.label,
                      numericValue: numVal,
                      power: numVal,
                    };
                  }
                }
              }
            }
            context[field.name] = enrichedSub;
          }
        } else if (targetBp && targetBp.blueprintClass === "FIRST_CLASS") {
          const targetEntityId = entity.properties[field.name];
          if (targetEntityId && typeof targetEntityId === "string") {
            const linkedEntity = this.entities.find((e) => e.id === targetEntityId);
            if (linkedEntity) {
              context[field.name] = {
                ...linkedEntity.properties,
                id: linkedEntity.id,
                name: linkedEntity.name,
                category: linkedEntity.category,
                ...(linkedEntity.computedFormulas || {}),
              };
            }
          }
        }
      }
    }

    // Find all formula fields in the blueprint
    for (const field of blueprint.fields) {
      if (field.fieldType === "FORMULA" && field.formulaExpression) {
        const evalRes = evaluateFormula(field.formulaExpression, context);
        if (evalRes.success && evalRes.value !== undefined) {
          computed[field.name] = evalRes.value;
          context[field.name] = evalRes.value; // Allow subsequent formulas to reference computed fields
        }
      }
    }

    return computed;
  }

  // =====================================
  // Timeline CRUD & Point-in-Time State Folding
  // =====================================

  getTimelineEvents(
    sortMode: "narrative" | "chronological" = "narrative",
  ): TimelineEventItem[] {
    return [...this.timelineEvents].sort((a, b) => {
      if (sortMode === "narrative") {
        return a.narrativeSequenceNumber - b.narrativeSequenceNumber;
      }
      return a.chronologicalOrder - b.chronologicalOrder;
    });
  }

  getTimelineEvent(id?: string): TimelineEventItem | undefined {
    if (!id) return undefined;
    return this.timelineEvents.find((e) => e.id === id);
  }

  addTimelineEvent(eventData: Omit<TimelineEventItem, "id">): TimelineEventItem {
    const newEvent: TimelineEventItem = {
      ...eventData,
      id: `ev-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`,
      createdAt: eventData.createdAt || new Date().toISOString(),
    };
    this.timelineEvents.push(newEvent);
    this.recomputeAllEntityFormulas();
    return newEvent;
  }

  updateTimelineEvent(
    id: string,
    updates: Partial<Omit<TimelineEventItem, "id">>,
  ): TimelineEventItem | undefined {
    const idx = this.timelineEvents.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    this.timelineEvents[idx] = {
      ...this.timelineEvents[idx],
      ...updates,
    };
    this.recomputeAllEntityFormulas();
    return this.timelineEvents[idx];
  }

  deleteTimelineEvent(id: string): boolean {
    const idx = this.timelineEvents.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.timelineEvents.splice(idx, 1);
    this.recomputeAllEntityFormulas();
    return true;
  }

  foldStateAtSequence(
    targetSeq: number,
    mode: "narrative" | "chronological" = "narrative",
  ): EntityItem[] {
    const baseEntities: EntityItem[] = JSON.parse(JSON.stringify(this.entities));
    const activeEvents = [...this.timelineEvents]
      .filter((ev) =>
        mode === "narrative"
          ? ev.narrativeSequenceNumber <= targetSeq
          : ev.chronologicalOrder <= targetSeq,
      )
      .sort((a, b) =>
        mode === "narrative"
          ? a.narrativeSequenceNumber - b.narrativeSequenceNumber
          : a.chronologicalOrder - b.chronologicalOrder,
      );

    for (const ev of activeEvents) {
      for (const eff of ev.effects) {
        const targetEntity = baseEntities.find(
          (e) =>
            e.id === eff.targetEntityId ||
            e.name === eff.entityName ||
            e.name === eff.targetEntityId,
        );
        if (!targetEntity) continue;

        targetEntity.lastMutatedSeqNumber = ev.narrativeSequenceNumber;

        const keys = eff.propertyKey.split(".");
        let curr: any = targetEntity.properties;

        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i];
          if (!curr[k] || typeof curr[k] !== "object") {
            curr[k] = {};
          }
          curr = curr[k];
        }

        const finalKey = keys[keys.length - 1];

        switch (eff.operation) {
          case "SET":
          case "TRANSFER":
            curr[finalKey] = eff.value;
            break;
          case "INCREMENT":
            curr[finalKey] =
              (Number(curr[finalKey]) || 0) + (Number(eff.value) || 0);
            break;
          case "DECREMENT":
            curr[finalKey] =
              (Number(curr[finalKey]) || 0) - (Number(eff.value) || 0);
            break;
          case "APPEND":
            if (Array.isArray(curr[finalKey])) {
              curr[finalKey].push(eff.value);
            } else {
              curr[finalKey] = [eff.value];
            }
            break;
          case "REMOVE":
            if (Array.isArray(curr[finalKey])) {
              curr[finalKey] = curr[finalKey].filter((x: any) => x !== eff.value);
            }
            break;
        }
      }
    }

    for (const ent of baseEntities) {
      ent.computedFormulas = this.evaluateEntityFormulas(ent);
    }

    return baseEntities;
  }

  // =====================================
  // Invariant Rules CRUD
  // =====================================

  getRules(): InvariantRuleItem[] {
    return this.rules;
  }

  getRule(id?: string): InvariantRuleItem | undefined {
    if (!id) return undefined;
    return this.rules.find((r) => r.id === id);
  }

  addRule(ruleData: Omit<InvariantRuleItem, "id">): InvariantRuleItem {
    const newRule: InvariantRuleItem = {
      ...ruleData,
      id: `rule-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 6)}`,
    };
    this.rules.push(newRule);
    return newRule;
  }

  updateRule(
    id: string,
    updates: Partial<Omit<InvariantRuleItem, "id">>,
  ): InvariantRuleItem | undefined {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.rules[idx] = {
      ...this.rules[idx],
      ...updates,
    };
    return this.rules[idx];
  }

  toggleRule(id: string): boolean {
    const r = this.getRule(id);
    if (!r) return false;
    r.enabled = !r.enabled;
    return true;
  }

  deleteRule(id: string): boolean {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.rules.splice(idx, 1);
    return true;
  }

  // =====================================
  // Continuity Audit & RFC 7807 Violations
  // =====================================

  getViolations(): ContinuityViolationItem[] {
    return this.violations;
  }

  runContinuityAudit(): ContinuityViolationItem[] {
    return this.violations;
  }

  overrideViolation(
    id: string,
    justification: string,
    authorName: string = "Lead Author",
  ): boolean {
    const viol = this.violations.find((v) => v.id === id);
    if (!viol) return false;
    viol.overridden = true;
    viol.overrideJustification = justification.trim();
    viol.overriddenBy = authorName;
    viol.overriddenAt = new Date().toISOString();
    return true;
  }

  reconcileViolation(id: string, actionType: string): boolean {
    const idx = this.violations.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    const viol = this.violations[idx];

    if (actionType === "AUTO_LOG_BREAKTHROUGH") {
      this.addTimelineEvent({
        narrativeSequenceNumber: Math.max(1, viol.sequenceNumber - 2),
        chronologicalOrder: 106,
        title: `Breakthrough: Advanced Cultivation Realm for ${viol.entityName}`,
        description: `Auto-reconciled breakthrough event advancing ${viol.entityName} to Core Formation stage before ${viol.sceneTitle}.`,
        anchorSceneTitle: viol.sceneTitle,
        anchorSceneId: viol.sceneId,
        effects: [
          {
            targetEntityId: viol.entityId,
            entityName: viol.entityName,
            propertyKey: "cultivation.major_realm",
            operation: "SET",
            value: 3,
          },
          {
            targetEntityId: viol.entityId,
            entityName: viol.entityName,
            propertyKey: "cultivation.realm_name",
            operation: "SET",
            value: "Core Formation",
          },
        ],
      });
      this.violations.splice(idx, 1);
      return true;
    }

    if (actionType === "AUTO_LINK_RELATIONAL_WEAPON") {
      const weaponEnt = this.entities.find(
        (e: EntityItem) => e.category === "Relics & Armaments",
      );
      const charEnt = this.entities.find((e: EntityItem) => e.category === "Characters");
      if (weaponEnt && charEnt) {
        charEnt.properties.bound_weapon = weaponEnt.id;
        weaponEnt.properties.current_wielder = charEnt.id;
      }
      this.violations.splice(idx, 1);
      return true;
    }

    // Default dismiss
    this.violations.splice(idx, 1);
    return true;
  }

  dismissViolation(id: string): boolean {
    const idx = this.violations.findIndex((v: ContinuityViolationItem) => v.id === id);
    if (idx === -1) return false;
    this.violations.splice(idx, 1);
    return true;
  }

  recomputeAllEntityFormulas(): void {
    for (const entity of this.entities) {
      entity.computedFormulas = this.evaluateEntityFormulas(entity);
    }
  }
}

export const worldStore = new WorldStateStore();
