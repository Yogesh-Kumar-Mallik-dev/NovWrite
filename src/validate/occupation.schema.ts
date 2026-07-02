import { Grade } from "@prisma/client";
import { z } from "zod";

import {
  aliasSchema,
  descriptionSchema,
  nameSchema,
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
/*                                Occupation                                  */
/* -------------------------------------------------------------------------- */

export const createOccupationSchema = z.object({
  name: nameSchema,

  aliases: aliasSchema.default([]),

  description: descriptionSchema.optional(),

  parentOccupationId: objectIdSchema.optional(),
});

export type CreateOccupationInput = z.infer<
  typeof createOccupationSchema
>;

export const updateOccupationSchema =
  createOccupationSchema.partial();

export type UpdateOccupationInput = z.infer<
  typeof updateOccupationSchema
>;

/* -------------------------------------------------------------------------- */
/*                           Character Occupation                             */
/* -------------------------------------------------------------------------- */

const characterOccupationBaseSchema =
  z.object({
    characterId: objectIdSchema,

    occupationId: objectIdSchema,

    grade: z.enum(Grade).optional(),

    grantedByCharacterId:
      objectIdSchema.optional(),

    grantedByOrganizationId:
      objectIdSchema.optional(),

    historicalEventId:
      objectIdSchema.optional(),

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

type CharacterOccupationValidation = {
  acquiredAt?: z.infer<
    typeof worldDateSchema
  >;

  lostAt?: z.infer<
    typeof worldDateSchema
  >;

  allowTimelineAnomaly?: boolean;
};

function validateCharacterOccupation(
  data: CharacterOccupationValidation,
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
        "Occupation cannot be lost before it is acquired unless timeline anomalies are allowed.",
    });
  }
}

export const createCharacterOccupationSchema =
  characterOccupationBaseSchema.superRefine(
    validateCharacterOccupation
  );

export type CreateCharacterOccupationInput =
  z.infer<
    typeof createCharacterOccupationSchema
  >;

export const updateCharacterOccupationSchema =
  characterOccupationBaseSchema
    .partial()
    .superRefine(
      validateCharacterOccupation
    );

export type UpdateCharacterOccupationInput =
  z.infer<
    typeof updateCharacterOccupationSchema
  >;
