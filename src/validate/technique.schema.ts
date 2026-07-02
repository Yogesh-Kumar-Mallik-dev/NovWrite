import {
  Body_MajorRealm,
  CultivationPath,
  FightingTechniqueType,
  Grade,
  Qi_MajorRealm,
  Soul_MajorRealm,
} from "@prisma/client";

import { z } from "zod";

import {
  descriptionSchema,
  nonNegativeIntSchema,
  nameSchema,
} from "./common";

/* -------------------------------------------------------------------------- */
/*                           Cultivation Technique                            */
/* -------------------------------------------------------------------------- */

export const createCultivationTechniqueSchema =
  z.object({
    name: nameSchema,

    grade: z.enum(Grade),

    compatiblePaths: z
      .array(z.enum(CultivationPath))
      .default([]),

    requiredQiRealm:
      z.enum(Qi_MajorRealm).optional(),

    requiredBodyRealm:
      z.enum(Body_MajorRealm).optional(),

    requiredSoulRealm:
      z.enum(Soul_MajorRealm).optional(),

    powerMultiplier:
      nonNegativeIntSchema.optional(),

    cultivationSpeed:
      nonNegativeIntSchema.optional(),

    breakthroughBonus:
      nonNegativeIntSchema.optional(),

    description:
      descriptionSchema.optional(),
  });

export type CreateCultivationTechniqueInput =
  z.infer<
    typeof createCultivationTechniqueSchema
  >;

export const updateCultivationTechniqueSchema =
  createCultivationTechniqueSchema.partial();

export type UpdateCultivationTechniqueInput =
  z.infer<
    typeof updateCultivationTechniqueSchema
  >;

/* -------------------------------------------------------------------------- */
/*                             Fighting Technique                             */
/* -------------------------------------------------------------------------- */

export const createFightingTechniqueSchema =
  z.object({
    name: nameSchema,

    grade: z.enum(Grade),

    type: z.enum(FightingTechniqueType),

    compatiblePaths: z
      .array(z.enum(CultivationPath))
      .default([]),

    requiredQiRealm:
      z.enum(Qi_MajorRealm).optional(),

    requiredBodyRealm:
      z.enum(Body_MajorRealm).optional(),

    requiredSoulRealm:
      z.enum(Soul_MajorRealm).optional(),

    qiCost:
      nonNegativeIntSchema.optional(),

    staminaCost:
      nonNegativeIntSchema.optional(),

    soulCost:
      nonNegativeIntSchema.optional(),

    powerMultiplier:
      nonNegativeIntSchema.optional(),

    description:
      descriptionSchema.optional(),
  });

export type CreateFightingTechniqueInput =
  z.infer<
    typeof createFightingTechniqueSchema
  >;

export const updateFightingTechniqueSchema =
  createFightingTechniqueSchema.partial();

export type UpdateFightingTechniqueInput =
  z.infer<
    typeof updateFightingTechniqueSchema
  >;
