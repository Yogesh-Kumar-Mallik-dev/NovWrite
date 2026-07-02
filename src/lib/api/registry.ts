import { z } from "zod";

import { prisma } from "@/lib/prisma";
import * as validation from "@/validate";

export type CrudRegistryEntry = {
  model: {
    findMany: (...args: any[]) => Promise<any>;
    findUnique: (...args: any[]) => Promise<any>;
    create: (...args: any[]) => Promise<any>;
    update: (...args: any[]) => Promise<any>;
    delete: (...args: any[]) => Promise<any>;
    count: (...args: any[]) => Promise<number>;
  };

  createSchema: z.ZodTypeAny;
  updateSchema: z.ZodTypeAny;

  searchableFields: readonly string[];
  filterableFields: readonly string[];
  sortableFields: readonly string[];

  defaultOrderBy?: Record<string, "asc" | "desc">;

  include?: Record<string, boolean>;
};

const defaults = {
  searchableFields: [] as const,
  filterableFields: [] as const,
  sortableFields: [
    "createdAt",
    "updatedAt",
  ] as const,

  defaultOrderBy: {
    createdAt: "desc" as const,
  },
};

export const registry: Record<
  string,
  CrudRegistryEntry
> = {
  /* ---------------------------------------------------------------------- */
  /* Characters                                                             */
  /* ---------------------------------------------------------------------- */

  characters: {
    ...defaults,
    model: prisma.characters,
    createSchema: validation.createCharacterSchema,
    updateSchema: validation.updateCharacterSchema,

    searchableFields: ["name"],
    filterableFields: [
      "gender",
      "spiritRootId",
    ],
    sortableFields: [
      "name",
      "basePower",
      "createdAt",
      "updatedAt",
    ],
  },

  characterVersions: {
    ...defaults,
    model: prisma.characterVersion,
    createSchema:
      validation.createCharacterVersionSchema,
    updateSchema:
      validation.updateCharacterVersionSchema,
  },

  characterInventories: {
    ...defaults,
    model: prisma.characterInventory,
    createSchema:
      validation.createCharacterInventorySchema,
    updateSchema:
      validation.updateCharacterInventorySchema,
  },

  characterCultivations: {
    ...defaults,
    model: prisma.characterCultivation,
    createSchema:
      validation.createCharacterCultivationSchema,
    updateSchema:
      validation.updateCharacterCultivationSchema,
  },

  characterRelations: {
    ...defaults,
    model: prisma.characterRelations,
    createSchema:
      validation.createCharacterRelationSchema,
    updateSchema:
      validation.updateCharacterRelationSchema,
  },

  characterOrganizations: {
    ...defaults,
    model: prisma.characterOrganization,
    createSchema:
      validation.createCharacterOrganizationSchema,
    updateSchema:
      validation.updateCharacterOrganizationSchema,
  },
  /* ---------------------------------------------------------------------- */
  /* Organizations                                                          */
  /* ---------------------------------------------------------------------- */

  organizations: {
    ...defaults,
    model: prisma.organization,
    createSchema:
      validation.createOrganizationSchema,
    updateSchema:
      validation.updateOrganizationSchema,

    searchableFields: ["name"],
    filterableFields: ["type"],
    sortableFields: [
      "name",
      "createdAt",
      "updatedAt",
    ],
  },

  /* ---------------------------------------------------------------------- */
  /* Locations                                                              */
  /* ---------------------------------------------------------------------- */

  locations: {
    ...defaults,
    model: prisma.location,
    createSchema:
      validation.createLocationSchema,
    updateSchema:
      validation.updateLocationSchema,

    searchableFields: ["name"],
    filterableFields: ["type"],
    sortableFields: [
      "name",
      "createdAt",
      "updatedAt",
    ],
  },

  characterLocations: {
    ...defaults,
    model: prisma.characterLocation,
    createSchema:
      validation.createCharacterLocationSchema,
    updateSchema:
      validation.updateCharacterLocationSchema,
  },

  /* ---------------------------------------------------------------------- */
  /* Species                                                                */
  /* ---------------------------------------------------------------------- */

  species: {
    ...defaults,
    model: prisma.species,
    createSchema:
      validation.createSpeciesSchema,
    updateSchema:
      validation.updateSpeciesSchema,

    searchableFields: ["name"],
    filterableFields: [
      "grade",
      "extinct",
      "playable",
    ],
    sortableFields: [
      "name",
      "createdAt",
      "updatedAt",
    ],
  },

  characterSpecies: {
    ...defaults,
    model: prisma.characterSpecies,
    createSchema:
      validation.createCharacterSpeciesSchema,
    updateSchema:
      validation.updateCharacterSpeciesSchema,
  },

  /* ---------------------------------------------------------------------- */
  /* Occupations                                                            */
  /* ---------------------------------------------------------------------- */

  occupations: {
    ...defaults,
    model: prisma.occupation,
    createSchema:
      validation.createOccupationSchema,
    updateSchema:
      validation.updateOccupationSchema,

    searchableFields: ["name"],
  },

  characterOccupations: {
    ...defaults,
    model: prisma.characterOccupation,
    createSchema:
      validation.createCharacterOccupationSchema,
    updateSchema:
      validation.updateCharacterOccupationSchema,
  },

  /* ---------------------------------------------------------------------- */
  /* Titles                                                                 */
  /* ---------------------------------------------------------------------- */

  titles: {
    ...defaults,
    model: prisma.title,
    createSchema:
      validation.createTitleSchema,
    updateSchema:
      validation.updateTitleSchema,

    searchableFields: ["name"],
    filterableFields: ["type"],
    sortableFields: [
      "name",
      "prestige",
      "createdAt",
      "updatedAt",
    ],
  },

  characterTitles: {
    ...defaults,
    model: prisma.characterTitle,
    createSchema:
      validation.createCharacterTitleSchema,
    updateSchema:
      validation.updateCharacterTitleSchema,
  },

  /* ---------------------------------------------------------------------- */
  /* Items                                                                  */
  /* ---------------------------------------------------------------------- */

  items: {
    ...defaults,
    model: prisma.item,
    createSchema:
      validation.createItemSchema,
    updateSchema:
      validation.updateItemSchema,

    searchableFields: ["name"],
    filterableFields: ["grade"],
    sortableFields: [
      "name",
      "grade",
      "createdAt",
      "updatedAt",
    ],
  },

  weapons: {
    ...defaults,
    model: prisma.weapon,
    createSchema:
      validation.createWeaponSchema,
    updateSchema:
      validation.updateWeaponSchema,
  },

  armors: {
    ...defaults,
    model: prisma.armor,
    createSchema:
      validation.createArmorSchema,
    updateSchema:
      validation.updateArmorSchema,
  },

  pills: {
    ...defaults,
    model: prisma.pill,
    createSchema:
      validation.createPillSchema,
    updateSchema:
      validation.updatePillSchema,
  },

  talismans: {
    ...defaults,
    model: prisma.talisman,
    createSchema:
      validation.createTalismanSchema,
    updateSchema:
      validation.updateTalismanSchema,
  },

  artifacts: {
    ...defaults,
    model: prisma.artifact,
    createSchema:
      validation.createArtifactSchema,
    updateSchema:
      validation.updateArtifactSchema,
  },

  treasures: {
    ...defaults,
    model: prisma.treasure,
    createSchema:
      validation.createTreasureSchema,
    updateSchema:
      validation.updateTreasureSchema,
  },

  secretScrolls: {
    ...defaults,
    model: prisma.secretScroll,
    createSchema:
      validation.createSecretScrollSchema,
    updateSchema:
      validation.updateSecretScrollSchema,
  },

  materials: {
    ...defaults,
    model: prisma.material,
    createSchema:
      validation.createMaterialSchema,
    updateSchema:
      validation.updateMaterialSchema,
  },


  /* ---------------------------------------------------------------------- */
  /* Historical Events                                                      */
  /* ---------------------------------------------------------------------- */

  historicalEvents: {
    ...defaults,
    model: prisma.historicalEvent,
    createSchema:
      validation.createHistoricalEventSchema,
    updateSchema:
      validation.updateHistoricalEventSchema,

    searchableFields: ["title"],

    filterableFields: [
      "type",
      "scale",
      "locationId",
    ],

    sortableFields: [
      "title",
      "createdAt",
      "updatedAt",
    ],
  },

  characterHistoricalEvents: {
    ...defaults,
    model: prisma.characterHistoricalEvent,
    createSchema:
      validation.createCharacterHistoricalEventSchema,
    updateSchema:
      validation.updateCharacterHistoricalEventSchema,
  },

  organizationHistoricalEvents: {
    ...defaults,
    model: prisma.organizationHistoricalEvent,
    createSchema:
      validation.createOrganizationHistoricalEventSchema,
    updateSchema:
      validation.updateOrganizationHistoricalEventSchema,
  },

  locationHistoricalEvents: {
    ...defaults,
    model: prisma.locationHistoricalEvent,
    createSchema:
      validation.createLocationHistoricalEventSchema,
    updateSchema:
      validation.updateLocationHistoricalEventSchema,
  },

  itemHistoricalEvents: {
    ...defaults,
    model: prisma.itemHistoricalEvent,
    createSchema:
      validation.createItemHistoricalEventSchema,
    updateSchema:
      validation.updateItemHistoricalEventSchema,
  },

  recipes: {
    ...defaults,
    model: prisma.recipe,
    createSchema:
      validation.createRecipeSchema,
    updateSchema:
      validation.updateRecipeSchema,

    searchableFields: ["name"],

    filterableFields: [
      "category",
      "occupationId",
      "requiredRealm",
    ],

    sortableFields: [
      "name",
      "createdAt",
      "updatedAt",
    ],
  },

  recipeIngredients: {
    ...defaults,
    model: prisma.recipeIngredient,
    createSchema:
      validation.createRecipeIngredientSchema,
    updateSchema:
      validation.updateRecipeIngredientSchema,
  },

  characterCrafts: {
    ...defaults,
    model: prisma.characterCraft,
    createSchema:
      validation.createCharacterCraftSchema,
    updateSchema:
      validation.updateCharacterCraftSchema,

    filterableFields: [
      "result",
      "characterId",
      "recipeId",
    ],
  },

  formations: {
    ...defaults,
    model: prisma.formation,
    createSchema:
      validation.createFormationSchema,
    updateSchema:
      validation.updateFormationSchema,

    filterableFields: [
      "category",
    ],
  },

  /* ---------------------------------------------------------------------- */
  /* Cultivation                                                            */
  /* ---------------------------------------------------------------------- */

  cultivationTechniques: {
    ...defaults,
    model: prisma.cultivationTechnique,
    createSchema:
      validation.createCultivationTechniqueSchema,
    updateSchema:
      validation.updateCultivationTechniqueSchema,

    searchableFields: ["name"],

    filterableFields: [
      "grade",
    ],

    sortableFields: [
      "name",
      "grade",
      "createdAt",
      "updatedAt",
    ],
  },

  fightingTechniques: {
    ...defaults,
    model: prisma.fightingTechnique,
    createSchema:
      validation.createFightingTechniqueSchema,
    updateSchema:
      validation.updateFightingTechniqueSchema,

    searchableFields: ["name"],

    filterableFields: [
      "grade",
      "type",
    ],

    sortableFields: [
      "name",
      "grade",
      "createdAt",
      "updatedAt",
    ],
  },

  majorRealms: {
    ...defaults,
    model: prisma.majorRealm,
    createSchema:
      validation.createMajorRealmSchema,
    updateSchema:
      validation.updateMajorRealmSchema,

    searchableFields: ["name"],

    filterableFields: [
      "path",
    ],

    sortableFields: [
      "name",
      "order",
      "createdAt",
      "updatedAt",
    ],
  },

  minorRealms: {
    ...defaults,
    model: prisma.minorRealm,
    createSchema:
      validation.createMinorRealmSchema,
    updateSchema:
      validation.updateMinorRealmSchema,

    searchableFields: ["name"],

    sortableFields: [
      "name",
      "order",
      "createdAt",
      "updatedAt",
    ],
  },

  spiritRoots: {
    ...defaults,
    model: prisma.spiritRoots,

    createSchema:
      validation.createSpiritRootSchema,
    updateSchema:
      validation.updateSpiritRootSchema,

    searchableFields: ["name"],

    filterableFields: [
      "grade",
    ],

    sortableFields: [
      "name",
      "grade",
      "createdAt",
      "updatedAt",
    ],
  },


  battles: {
    ...defaults,
    model: prisma.battle,

    createSchema:
      validation.createBattleSchema,
    updateSchema:
      validation.updateBattleSchema,

    filterableFields: [
      "conflictType",
      "outcome",
      "warId",
    ],
  },

  battleSides: {
    ...defaults,
    model: prisma.battleSide,

    createSchema:
      validation.createBattleSideSchema,
    updateSchema:
      validation.updateBattleSideSchema,

    filterableFields: [
      "battleId",
      "outcome",
    ],
  },

  battleParticipants: {
    ...defaults,
    model: prisma.battleParticipant,

    createSchema:
      validation.createBattleParticipantSchema,
    updateSchema:
      validation.updateBattleParticipantSchema,

    filterableFields: [
      "battleSideId",
      "role",
      "commander",
    ],
  },

  wars: {
    ...defaults,
    model: prisma.war,

    createSchema:
      validation.createWarSchema,
    updateSchema:
      validation.updateWarSchema,

    filterableFields: [
      "type",
      "outcome",
    ],
  },

  /* ---------------------------------------------------------------------- */
  /* War Participants                                                       */
  /* ---------------------------------------------------------------------- */

  warParticipants: {
    ...defaults,

    model: prisma.warParticipant,

    createSchema:
      validation.createWarParticipantSchema,

    updateSchema:
      validation.updateWarParticipantSchema,

    filterableFields: [
      "warId",
      "organizationId",
      "role",
      "side",
    ],

    sortableFields: [
      "createdAt",
      "updatedAt",
    ],
  },

} satisfies Record<string, CrudRegistryEntry>;

export type Domain = keyof typeof registry;
