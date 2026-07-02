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

const characterOccupationSchema = z
  .object({
    characterId: objectIdSchema,

    occupationId: objectIdSchema,

    grade: z.enum(Grade).optional(),

    grantedByCharacterId:
      objectIdSchema.optional(),

    grantedByOrganizationId:
      objectIdSchema.optional(),

    historicalEventId:
      objectIdSchema.optional(),

    acquiredAt: worldDateSchema.optional(),

    lostAt: worldDateSchema.optional(),

    reason: descriptionSchema.optional(),

    isCurrent: z.boolean().default(true),

    allowTimelineAnomaly: z
      .boolean()
      .default(false),
  })
  .superRefine((data, ctx) => {
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
  });

export const createCharacterOccupationSchema =
  characterOccupationSchema;

export type CreateCharacterOccupationInput =
  z.infer<
    typeof createCharacterOccupationSchema
  >;

export const updateCharacterOccupationSchema =
  characterOccupationSchema.partial();

export type UpdateCharacterOccupationInput =
  z.infer<
    typeof updateCharacterOccupationSchema
  >;
