/**
 * @file worldStore.svelte.ts
 * @description Svelte 5 Runes reactive store for World Studio entities, schemas, and systems.
 * Block Standard: BLOCK_WORLD_STORE_RUNE_001
 */

export interface EntityItem {
  id: string;
  name: string;
  entityTypeId: string;
  category:
    "CHARACTER" | "LOCATION" | "ARTIFACT" | "FACTION" | "WEAPON" | "TECHNIQUE";
  description: string;
  properties: Record<string, any>;
  lastMutatedSeqNumber: number;
}

export interface DynamicPropertyDefItem {
  id: string;
  name: string;
  propertyType:
    | "STRING"
    | "NUMBER"
    | "BOOLEAN"
    | "ENUM_SINGLE"
    | "ENUM_MULTI"
    | "ENTITY_REF"
    | "LADDER_TIER";
  defaultValue?: any;
  validation?: Record<string, any>;
  description?: string;
}

export interface EntityTypeDefItem {
  id: string;
  name: string;
  category:
    "CHARACTER" | "LOCATION" | "ARTIFACT" | "FACTION" | "WEAPON" | "TECHNIQUE";
  description: string;
  properties: DynamicPropertyDefItem[];
}

export interface ProgressionLadderItem {
  id: string;
  name: string; // e.g. "Cultivation Realms" or "Arcane Mastery Tiers"
  type: "PROGRESSION_LADDER" | "RELATIONSHIP_SCALE" | "ALIGNMENT_MATRIX";
  description: string;
  tiersOrScale: {
    stages?: string[]; // e.g. ["Mortal", "Qi Condensation", "Foundation", "Core Formation", "Nascent Soul"]
    minValue?: number; // e.g. -100 (Loyalty) or 0 (Affection)
    maxValue?: number; // e.g. 100 or 1000
    metricName?: string; // e.g. "Points" or "Affection Units"
  };
}

// Initial demo schemas from Chronicles of Aethelgard
const initialSchemas: EntityTypeDefItem[] = [
  {
    id: "schema-character",
    name: "Cultivator / Character",
    category: "CHARACTER",
    description:
      "Humanoid cultivators, spellblades, and sentient entities in the lore.",
    properties: [
      {
        id: "prop-status",
        name: "status",
        propertyType: "ENUM_SINGLE",
        defaultValue: "ALIVE",
        validation: { allowedValues: ["ALIVE", "DEAD", "EXILED", "SEALED"] },
        description: "Physical life state of the entity",
      },
      {
        id: "prop-realm",
        name: "cultivation_realm",
        propertyType: "LADDER_TIER",
        defaultValue: "Foundation",
        description: "Current power progression stage",
      },
      {
        id: "prop-mana",
        name: "mana_capacity",
        propertyType: "NUMBER",
        defaultValue: 500,
        validation: { min: 0, max: 100000 },
        description: "Total pool of spiritual mana units",
      },
      {
        id: "prop-faction",
        name: "faction",
        propertyType: "STRING",
        defaultValue: "Neutral",
        description: "Allegiance or sect affiliation",
      },
    ],
  },
  {
    id: "schema-location",
    name: "Sanctuary & Region",
    category: "LOCATION",
    description:
      "Citadels, mountain ridges, spiritual ruins, and spatial domains.",
    properties: [
      {
        id: "prop-density",
        name: "spiritual_density",
        propertyType: "NUMBER",
        defaultValue: 5.0,
        validation: { min: 0, max: 10 },
        description: "Ambient mana density on a 0-10 scale",
      },
      {
        id: "prop-controlled-by",
        name: "controlled_by",
        propertyType: "STRING",
        defaultValue: "Unclaimed",
        description: "Ruling sect or guardian faction",
      },
    ],
  },
  {
    id: "schema-artifact",
    name: "Sacred Relic & Weapon",
    category: "ARTIFACT",
    description: "Soul-bound blades, astral compasses, and ancient talismans.",
    properties: [
      {
        id: "prop-grade",
        name: "grade",
        propertyType: "ENUM_SINGLE",
        defaultValue: "Earth Grade",
        validation: {
          allowedValues: [
            "Mortal Grade",
            "Earth Grade",
            "Heaven Grade",
            "Divine Grade",
          ],
        },
        description: "Refinement rank",
      },
      {
        id: "prop-durability",
        name: "durability",
        propertyType: "NUMBER",
        defaultValue: 100,
        validation: { min: 0, max: 1000 },
        description: "Structural integrity percentage",
      },
    ],
  },
];

// Initial demo entities
const initialEntities: EntityItem[] = [
  {
    id: "a1111111-1111-4111-a111-111111111111",
    name: "Eldrin the Spellblade",
    entityTypeId: "schema-character",
    category: "CHARACTER",
    description: "Protagonist and wielder of the Silver Dawn blade technique.",
    properties: {
      status: "ALIVE",
      cultivation_realm: "Foundation",
      mana_capacity: 300,
      faction: "Silver Vanguard",
      affection_level: 450,
    },
    lastMutatedSeqNumber: 50,
  },
  {
    id: "b2222222-2222-4222-a222-222222222222",
    name: "Lyra of the Astral Veil",
    entityTypeId: "schema-character",
    category: "CHARACTER",
    description:
      "Astral Covenant sorceress specializing in void distortion runes.",
    properties: {
      status: "ALIVE",
      cultivation_realm: "Core Formation",
      mana_capacity: 800,
      faction: "Astral Covenant",
      affection_level: 680,
    },
    lastMutatedSeqNumber: 200,
  },
  {
    id: "c3333333-3333-4333-a333-333333333333",
    name: "Lord Malakor",
    entityTypeId: "schema-character",
    category: "CHARACTER",
    description:
      "Arch-villain who sealed the forbidden blood pact at the Citadel.",
    properties: {
      status: "DEAD",
      cultivation_realm: "Core Formation",
      mana_capacity: 1200,
      faction: "Shadow Syndicate",
      affection_level: -900,
    },
    lastMutatedSeqNumber: 150,
  },
  {
    id: "d4444444-4444-4444-a444-444444444444",
    name: "The Sunken Citadel",
    entityTypeId: "schema-location",
    category: "LOCATION",
    description: "Ancient underwater temple housing the primordial mana core.",
    properties: {
      status: "ACTIVE",
      spiritual_density: 9.5,
      controlled_by: "Silver Vanguard",
    },
    lastMutatedSeqNumber: 10,
  },
];

// Initial custom property systems (Power Ladders & Relationship Scales)
const initialSystems: ProgressionLadderItem[] = [
  {
    id: "system-cultivation-realms",
    name: "Cultivation Realm Progression",
    type: "PROGRESSION_LADDER",
    description:
      "The standard 5-stage martial advancement ladder for characters.",
    tiersOrScale: {
      stages: [
        "Mortal",
        "Qi Condensation",
        "Foundation",
        "Core Formation",
        "Nascent Soul",
        "Ascendant Sovereign",
      ],
      metricName: "Stage",
    },
  },
  {
    id: "system-affection-scale",
    name: "Character Affection & Rapport Scale",
    type: "RELATIONSHIP_SCALE",
    description:
      "Bipolar relationship gauge measuring deep interpersonal affection and bond.",
    tiersOrScale: {
      minValue: -1000,
      maxValue: 1000,
      metricName: "Affection Points",
    },
  },
  {
    id: "system-sect-loyalty",
    name: "Sect & Faction Loyalty Index",
    type: "RELATIONSHIP_SCALE",
    description: "Measures fealty and obedience to the ruling sect elders.",
    tiersOrScale: {
      minValue: -100,
      maxValue: 100,
      metricName: "Loyalty %",
    },
  },
];

class WorldStateStore {
  entities = $state<EntityItem[]>([...initialEntities]);
  schemas = $state<EntityTypeDefItem[]>([...initialSchemas]);
  systems = $state<ProgressionLadderItem[]>([...initialSystems]);

  // Entity methods
  getEntity(id?: string): EntityItem | undefined {
    if (!id) return undefined;
    return this.entities.find((e) => e.id === id);
  }

  addEntity(data: Omit<EntityItem, "id" | "lastMutatedSeqNumber">): EntityItem {
    const newEntity: EntityItem = {
      ...data,
      id: `ent-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 8)}`,
      lastMutatedSeqNumber: 0,
    };
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
    return this.entities[idx];
  }

  deleteEntity(id?: string): boolean {
    if (!id) return false;
    const idx = this.entities.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.entities.splice(idx, 1);
    return true;
  }

  // Schema methods
  getSchema(id?: string): EntityTypeDefItem | undefined {
    if (!id) return undefined;
    return this.schemas.find((s) => s.id === id);
  }

  addSchema(data: Omit<EntityTypeDefItem, "id">): EntityTypeDefItem {
    const newSchema: EntityTypeDefItem = {
      ...data,
      id: `schema-${Date.now().toString(16)}`,
    };
    this.schemas.push(newSchema);
    return newSchema;
  }

  updateSchema(
    id: string | undefined,
    updates: Partial<Omit<EntityTypeDefItem, "id">>,
  ): EntityTypeDefItem | undefined {
    if (!id) return undefined;
    const idx = this.schemas.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    this.schemas[idx] = {
      ...this.schemas[idx],
      ...updates,
    };
    return this.schemas[idx];
  }

  addPropertyToSchema(
    schemaId: string,
    prop: Omit<DynamicPropertyDefItem, "id">,
  ): DynamicPropertyDefItem | undefined {
    const schema = this.getSchema(schemaId);
    if (!schema) return undefined;
    const newProp: DynamicPropertyDefItem = {
      ...prop,
      id: `prop-${Date.now().toString(16)}`,
    };
    schema.properties.push(newProp);
    return newProp;
  }

  deleteSchema(id?: string): boolean {
    if (!id) return false;
    const idx = this.schemas.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.schemas.splice(idx, 1);
    return true;
  }

  // System (Progression / Scale) methods
  getSystem(id?: string): ProgressionLadderItem | undefined {
    if (!id) return undefined;
    return this.systems.find((sys) => sys.id === id);
  }

  addSystem(data: Omit<ProgressionLadderItem, "id">): ProgressionLadderItem {
    const newSys: ProgressionLadderItem = {
      ...data,
      id: `system-${Date.now().toString(16)}`,
    };
    this.systems.push(newSys);
    return newSys;
  }

  updateSystem(
    id: string | undefined,
    updates: Partial<Omit<ProgressionLadderItem, "id">>,
  ): ProgressionLadderItem | undefined {
    if (!id) return undefined;
    const idx = this.systems.findIndex((sys) => sys.id === id);
    if (idx === -1) return undefined;
    this.systems[idx] = {
      ...this.systems[idx],
      ...updates,
    };
    return this.systems[idx];
  }

  deleteSystem(id?: string): boolean {
    if (!id) return false;
    const idx = this.systems.findIndex((sys) => sys.id === id);
    if (idx === -1) return false;
    this.systems.splice(idx, 1);
    return true;
  }
}

export const worldStore = new WorldStateStore();
