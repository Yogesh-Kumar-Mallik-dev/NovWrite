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

export interface DynamicFieldDef {
  id: string;
  name: string; // Machine key e.g. "gender", "romantic_feelings", "total_combat_power"
  label: string; // Human readable label
  fieldType: BlueprintFieldType;
  description?: string;
  required?: boolean;
  defaultValue?: any;

  // For ENUM:
  options?: string[]; // e.g. ["Male", "Female"]

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
  category: string; // Freeform category tag e.g. "Characters", "Relics", "Systems & Affection"
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
          "Stranger",
          "Acquaintance",
          "Friend",
          "Confidant",
          "Romantic Interest",
          "Soulmate",
          "Nemesis",
        ],
        defaultValue: "Acquaintance",
        description: "Categorical stage of interpersonal dynamic",
      },
      {
        id: "f-aff-level",
        name: "affection_level",
        label: "Affection Points",
        fieldType: "NUMBER",
        min: -100,
        max: 1000,
        step: 5,
        unit: "pts",
        defaultValue: 0,
        description: "Numerical bond gauge (-100 to +1000)",
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
        defaultValue: 50,
        description: "Mutual trust confidence percentage",
      },
      {
        id: "f-aff-buff",
        name: "bond_buff_multiplier",
        label: "Bond Buff Multiplier",
        fieldType: "FORMULA",
        formulaExpression: "1 + (affection_level / 1000) * 0.5",
        description: "Synergy buff derived from emotional resonance",
      },
    ],
  },

  // 2. Second-Class Blueprint: Cultivation Rank & Realms
  {
    id: "bp-sec-cultivation",
    name: "Cultivation Rank & Mastery",
    blueprintClass: "SECOND_CLASS",
    category: "Power Systems",
    description:
      "Cultivation realm stages, minor sub-grades, and spiritual density metrics.",
    isSystemDefault: true,
    fields: [
      {
        id: "f-cul-name",
        name: "realm_name",
        label: "Realm Name",
        fieldType: "ENUM",
        options: [
          "Qi Condensation",
          "Foundation Establishment",
          "Core Formation",
          "Nascent Soul",
          "Soul Transformation",
          "Void Refinement",
          "Ascension",
        ],
        defaultValue: "Foundation Establishment",
        description: "Major Dao stage",
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
        options: ["Male", "Female", "Dual-Yin-Yang", "Genderless / Celestial"],
        defaultValue: "Male",
        description: "Biological / spiritual gender category",
      },
      {
        id: "f-char-cultivation",
        name: "cultivation",
        label: "Cultivation State",
        fieldType: "BLUEPRINT_REF",
        targetBlueprintId: "bp-sec-cultivation",
        targetBlueprintName: "Cultivation Rank & Mastery",
        description: "Nested cultivation rank sub-blueprint",
      },
      {
        id: "f-char-affection",
        name: "romantic_feelings",
        label: "Romantic Feelings / Affection",
        fieldType: "BLUEPRINT_REF",
        targetBlueprintId: "bp-sec-affection",
        targetBlueprintName: "Romantic Affection Scale",
        description: "Interpersonal affection sub-blueprint reference",
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

  // 4. First-Class Blueprint: Sacred Weapon / Relic
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
        id: "f-loc-accel",
        name: "cultivation_acceleration",
        label: "Cultivation Acceleration Rate",
        fieldType: "FORMULA",
        formulaExpression: "ambient_mana_density * spatial_stability * 1.5",
        description: "Formula: ambient_mana_density * spatial_stability * 1.5",
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
    },
    lastMutatedSeqNumber: 20,
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
    const prefix =
      data.blueprintClass === "FIRST_CLASS" ? "bp-first" : "bp-sec";
    const newBp: BlueprintDef = {
      ...data,
      id: `${prefix}-${Date.now().toString(16)}`,
    };
    this.blueprints.push(newBp);
    return newBp;
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
    };

    // Recompute entity formulas that use this blueprint
    this.recomputeAllEntityFormulas();
    return this.blueprints[idx];
  }

  deleteBlueprint(id?: string): boolean {
    if (!id) return false;
    const idx = this.blueprints.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    this.blueprints.splice(idx, 1);
    return true;
  }

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

    if (newField.fieldType === "FORMULA" && newField.formulaExpression) {
      newField.formulaDependencies = extractFormulaVariables(
        newField.formulaExpression,
      );
    }

    bp.fields.push(newField);
    this.recomputeAllEntityFormulas();
    return newField;
  }

  updateBlueprintField(
    blueprintId: string,
    fieldId: string,
    updates: Partial<Omit<DynamicFieldDef, "id">>,
  ): DynamicFieldDef | undefined {
    const bp = this.getBlueprint(blueprintId);
    if (!bp) return undefined;

    const fIdx = bp.fields.findIndex((f) => f.id === fieldId);
    if (fIdx === -1) return undefined;

    bp.fields[fIdx] = {
      ...bp.fields[fIdx],
      ...updates,
    };

    if (
      bp.fields[fIdx].fieldType === "FORMULA" &&
      bp.fields[fIdx].formulaExpression
    ) {
      bp.fields[fIdx].formulaDependencies = extractFormulaVariables(
        bp.fields[fIdx].formulaExpression!,
      );
    }

    this.recomputeAllEntityFormulas();
    return bp.fields[fIdx];
  }

  deleteBlueprintField(blueprintId: string, fieldId: string): boolean {
    const bp = this.getBlueprint(blueprintId);
    if (!bp) return false;

    const fIdx = bp.fields.findIndex((f) => f.id === fieldId);
    if (fIdx === -1) return false;

    bp.fields.splice(fIdx, 1);
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
    entity: EntityItem,
    bp?: BlueprintDef,
  ): Record<string, number> {
    const blueprint = bp || this.getBlueprint(entity.blueprintId);
    if (!blueprint) return {};

    const computed: Record<string, number> = {};
    const context = { ...entity.properties };

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

  recomputeAllEntityFormulas() {
    for (const ent of this.entities) {
      ent.computedFormulas = this.evaluateEntityFormulas(ent);
    }
  }

  // Backwards compatibility aliases for previous schema / systems views
  get schemas() {
    return this.blueprints;
  }
  get systems() {
    return this.getSecondClassBlueprints();
  }
}

export const worldStore = new WorldStateStore();
