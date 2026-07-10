import { TitleType } from "@/lib/prisma";
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
/*                                   Title                                    */
/* -------------------------------------------------------------------------- */

export const createTitleSchema = z.object({
  name: nameSchema,

  aliases: aliasSchema.default([]),

  type: z.enum(TitleType),

  description: descriptionSchema.optional(),

  prestige: nonNegativeIntSchema.default(0),
});

export type CreateTitleInput = z.infer<
  typeof createTitleSchema
>;

export const updateTitleSchema =
  createTitleSchema.partial();

export type UpdateTitleInput = z.infer<
  typeof updateTitleSchema
>;

/* -------------------------------------------------------------------------- */
/*                              Character Title                               */
/* -------------------------------------------------------------------------- */

const characterTitleBaseSchema =
  z.object({
    characterId: objectIdSchema,

    titleId: objectIdSchema,

    grantedByCharacterId:
      objectIdSchema.optional(),

    grantedByOrganizationId:
      objectIdSchema.optional(),

    historicalEventId:
      objectIdSchema.optional(),

    grantedAt:
      worldDateSchema.optional(),

    revokedAt:
      worldDateSchema.optional(),

    reason:
      descriptionSchema.optional(),

    isCurrent:
      z.boolean().default(true),

    allowTimelineAnomaly:
      z.boolean().default(false),
  });

type CharacterTitleValidation = {
  grantedAt?: z.infer<
    typeof worldDateSchema
  >;

  revokedAt?: z.infer<
    typeof worldDateSchema
  >;

  allowTimelineAnomaly?: boolean;
};

function validateCharacterTitle(
  data: CharacterTitleValidation,
  ctx: z.RefinementCtx
) {
  if (
    data.allowTimelineAnomaly ||
    !data.grantedAt ||
    !data.revokedAt
  ) {
    return;
  }

  if (
    compareWorldDates(
      data.revokedAt,
      data.grantedAt
    ) < 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["revokedAt"],
      message:
        "A title cannot be revoked before it is granted unless timeline anomalies are allowed.",
    });
  }
}

export const createCharacterTitleSchema =
  characterTitleBaseSchema.superRefine(
    validateCharacterTitle
  );

export type CreateCharacterTitleInput =
  z.infer<
    typeof createCharacterTitleSchema
  >;

export const updateCharacterTitleSchema =
  characterTitleBaseSchema
    .partial()
    .superRefine(
      validateCharacterTitle
    );

export type UpdateCharacterTitleInput =
  z.infer<
    typeof updateCharacterTitleSchema
  >;
