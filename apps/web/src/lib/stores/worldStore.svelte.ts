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
  "STRING" | "NUMBER" | "BOOLEAN" | "ENUM" | "BLUEPRINT_REF" | "FORMULA";

export interface EnumOptionItem {
  label: string; // Display Name (e.g. "Qi Refining")
  value: string; // Storage key / code (e.g. "qi_refining")
  numericValue?: number; // Numeric Power / Score (e.g. 100)
  power?: number; // Alias for numeric power
  description?: string;
}

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
      qi_vein_grade: "tier_4",
    },
    lastMutatedSeqNumber: 10,
  },
];

export class WorldStateStore {
  blueprints = $state<BlueprintDef[]>([...initialBlueprints]);
  entities = $state<EntityItem[]>([...initialEntities]);

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
    if (!field || field.fieldType !== "ENUM") return false;
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
    if (!field || !field.options || optionIndex < 0 || optionIndex >= field.options.length) return false;
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
    if (!field || !field.options || optionIndex < 0 || optionIndex >= field.options.length) return false;
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

    // Enrich context with dual-valued enum options and resolved references
    for (const field of blueprint.fields) {
      if (field.fieldType === "ENUM" && field.options) {
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
              if (subF.fieldType === "ENUM" && subF.options) {
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

  recomputeAllEntityFormulas(): void {
    for (const entity of this.entities) {
      entity.computedFormulas = this.evaluateEntityFormulas(entity);
    }
  }
}

export const worldStore = new WorldStateStore();
