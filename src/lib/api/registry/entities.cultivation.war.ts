import { prisma } from "@/lib/prisma";
import * as validation from "@/validate";

import { defaults } from "./defaults";
import type { CrudRegistryEntry } from "./types";

export const entitiesCultivationWarRegistry = {
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
