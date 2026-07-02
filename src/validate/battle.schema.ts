import {
  BattleOutcome,
  BattleRole,
  ConflictType,
} from "@prisma/client";

import { z } from "zod";

import {
  descriptionSchema,
  nonNegativeIntSchema,
  objectIdSchema,
} from "./common";

/* -------------------------------------------------------------------------- */
/*                                   Battle                                   */
/* -------------------------------------------------------------------------- */

export const createBattleSchema = z.object({
  historicalEventId: objectIdSchema,

  conflictType: z.enum(ConflictType),

  outcome: z.enum(BattleOutcome),

  description: descriptionSchema.optional(),

  duration: nonNegativeIntSchema.optional(),

  warId: objectIdSchema.optional(),
});

export type CreateBattleInput = z.infer<
  typeof createBattleSchema
>;

export const updateBattleSchema =
  createBattleSchema.partial();

export type UpdateBattleInput = z.infer<
  typeof updateBattleSchema
>;

/* -------------------------------------------------------------------------- */
/*                                Battle Side                                 */
/* -------------------------------------------------------------------------- */

export const createBattleSideSchema = z.object({
  battleId: objectIdSchema,

  name: descriptionSchema.optional(),

  side: nonNegativeIntSchema,

  outcome: z.enum(BattleOutcome),
});

export type CreateBattleSideInput = z.infer<
  typeof createBattleSideSchema
>;

export const updateBattleSideSchema =
  createBattleSideSchema.partial();

export type UpdateBattleSideInput = z.infer<
  typeof updateBattleSideSchema
>;

/* -------------------------------------------------------------------------- */
/*                             Battle Participant                             */
/* -------------------------------------------------------------------------- */

const battleParticipantBaseSchema =
  z.object({
    battleSideId: objectIdSchema,

    characterId:
      objectIdSchema.optional(),

    organizationId:
      objectIdSchema.optional(),

    role: z.enum(BattleRole),

    commander:
      z.boolean().default(false),

    casualties:
      nonNegativeIntSchema.optional(),
  });

type BattleParticipantValidation = {
  characterId?: string;
  organizationId?: string;
};

function validateBattleParticipant(
  data: BattleParticipantValidation,
  ctx: z.RefinementCtx
) {
  const hasCharacter =
    data.characterId !== undefined;

  const hasOrganization =
    data.organizationId !== undefined;

  if (hasCharacter === hasOrganization) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["characterId"],
      message:
        "Exactly one of characterId or organizationId must be provided.",
    });
  }
}

export const createBattleParticipantSchema =
  battleParticipantBaseSchema.superRefine(
    validateBattleParticipant
  );

export type CreateBattleParticipantInput =
  z.infer<
    typeof createBattleParticipantSchema
  >;

export const updateBattleParticipantSchema =
  battleParticipantBaseSchema
    .partial()
    .superRefine(
      validateBattleParticipant
    );

export type UpdateBattleParticipantInput =
  z.infer<
    typeof updateBattleParticipantSchema
  >;
