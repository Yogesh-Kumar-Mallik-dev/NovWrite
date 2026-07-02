import { LocationType } from "@prisma/client";
import { z } from "zod";

import {
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
/*                                 Location                                   */
/* -------------------------------------------------------------------------- */

export const createLocationSchema = z.object({
  name: nameSchema,

  type: z.enum(LocationType),

  description: descriptionSchema.optional(),

  parentLocationId: objectIdSchema.optional(),
});

export type CreateLocationInput = z.infer<
  typeof createLocationSchema
>;

export const updateLocationSchema =
  createLocationSchema.partial();

export type UpdateLocationInput = z.infer<
  typeof updateLocationSchema
>;

/* -------------------------------------------------------------------------- */
/*                            Character Location                              */
/* -------------------------------------------------------------------------- */

const characterLocationBaseSchema =
  z.object({
    characterId: objectIdSchema,

    locationId: objectIdSchema,

    arrivedAt:
      worldDateSchema.optional(),

    leftAt:
      worldDateSchema.optional(),

    reason:
      descriptionSchema.optional(),

    allowTimelineAnomaly:
      z.boolean().default(false),
  });

type CharacterLocationValidation = {
  arrivedAt?: z.infer<
    typeof worldDateSchema
  >;

  leftAt?: z.infer<
    typeof worldDateSchema
  >;

  allowTimelineAnomaly?: boolean;
};

function validateCharacterLocation(
  data: CharacterLocationValidation,
  ctx: z.RefinementCtx
) {
  if (
    data.allowTimelineAnomaly ||
    !data.arrivedAt ||
    !data.leftAt
  ) {
    return;
  }

  if (
    compareWorldDates(
      data.leftAt,
      data.arrivedAt
    ) < 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["leftAt"],
      message:
        "Departure date cannot be before arrival date unless timeline anomalies are allowed.",
    });
  }
}

export const createCharacterLocationSchema =
  characterLocationBaseSchema.superRefine(
    validateCharacterLocation
  );

export type CreateCharacterLocationInput =
  z.infer<
    typeof createCharacterLocationSchema
  >;

export const updateCharacterLocationSchema =
  characterLocationBaseSchema
    .partial()
    .superRefine(
      validateCharacterLocation
    );

export type UpdateCharacterLocationInput =
  z.infer<
    typeof updateCharacterLocationSchema
  >;
