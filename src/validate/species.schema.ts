import { Grade } from "@prisma/client";
import { z } from "zod";

import {
  aliasSchema,
  descriptionSchema,
  nameSchema,
  nonNegativeIntSchema,
  objectIdSchema,
  worldDateSchema,
} from "./common";

/* -------------------------------------------------------------------------- */
/*                                 Utilities                                  */
/* -------------------------------------------------------------------------- */

function compareWorldDates(
  a: z.infer<typeof worldDateSchema>,
  b: z.infer<typeof worldDateSchema>
): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

/* -------------------------------------------------------------------------- */
/*                                  Species                                   */
/* -------------------------------------------------------------------------- */

export const createSpeciesSchema = z.object({
  name: nameSchema,

  aliases: aliasSchema.default([]),

  description: descriptionSchema.optional(),

  parentSpeciesId: objectIdSchema.optional(),

  grade: z.enum(Grade).optional(),

  averageLifespan: nonNegativeIntSchema.optional(),

  maximumLifespan: nonNegativeIntSchema.optional(),

  extinct: z.boolean().default(false),

  playable: z.boolean().default(true),
});

export type CreateSpeciesInput = z.infer<
  typeof createSpeciesSchema
>;

export const updateSpeciesSchema =
  createSpeciesSchema.partial();

export type UpdateSpeciesInput = z.infer<
  typeof updateSpeciesSchema
>;

/* -------------------------------------------------------------------------- */
/*                             Character Species                              */
/* -------------------------------------------------------------------------- */

const characterSpeciesBaseSchema =
  z.object({
    characterId: objectIdSchema,

    speciesId: objectIdSchema,

    acquiredAt:
      worldDateSchema.optional(),

    lostAt:
      worldDateSchema.optional(),

    reason:
      descriptionSchema.optional(),

    isCurrent:
      z.boolean().default(true),

    allowTimelineAnomaly:
      z.boolean().default(false),
  });

type CharacterSpeciesValidation = {
  acquiredAt?: z.infer<
    typeof worldDateSchema
  >;

  lostAt?: z.infer<
    typeof worldDateSchema
  >;

  allowTimelineAnomaly?: boolean;
};

function validateCharacterSpecies(
  data: CharacterSpeciesValidation,
  ctx: z.RefinementCtx
) {
  if (
    data.allowTimelineAnomaly ||
    !data.acquiredAt ||
    !data.lostAt
  ) {
    return;
  }

  if (
    compareWorldDates(
      data.lostAt,
      data.acquiredAt
    ) < 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["lostAt"],
      message:
        "A species cannot be lost before it is acquired unless timeline anomalies are allowed.",
    });
  }
}

export const createCharacterSpeciesSchema =
  characterSpeciesBaseSchema.superRefine(
    validateCharacterSpecies
  );

export type CreateCharacterSpeciesInput =
  z.infer<
    typeof createCharacterSpeciesSchema
  >;

export const updateCharacterSpeciesSchema =
  characterSpeciesBaseSchema
    .partial()
    .superRefine(
      validateCharacterSpecies
    );

export type UpdateCharacterSpeciesInput =
  z.infer<
    typeof updateCharacterSpeciesSchema
  >;
