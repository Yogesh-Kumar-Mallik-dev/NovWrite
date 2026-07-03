import { prisma } from "@/lib/prisma";
import * as validation from "@/validate";

import { defaults } from "./defaults";
import type { CrudRegistryEntry } from "./types";

export const entitiesCoreRegistry = {
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
} satisfies Record<string, CrudRegistryEntry>;
