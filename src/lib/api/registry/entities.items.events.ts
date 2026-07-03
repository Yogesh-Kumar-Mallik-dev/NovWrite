import { prisma } from "@/lib/prisma";
import * as validation from "@/validate";

import { defaults } from "./defaults";
import type { CrudRegistryEntry } from "./types";

export const entitiesItemsEventsRegistry = {
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
} satisfies Record<string, CrudRegistryEntry>;
