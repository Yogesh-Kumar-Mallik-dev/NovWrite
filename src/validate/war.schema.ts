import {
  WarOutcome,
  WarRole,
  WarType,
} from "@prisma/client";

import { z } from "zod";

import {
  descriptionSchema,
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
/*                                    War                                     */
/* -------------------------------------------------------------------------- */

const warSchema = z
  .object({
    historicalEventId: objectIdSchema,

    type: z.enum(WarType),

    outcome: z.enum(WarOutcome),

    cause: descriptionSchema.optional(),

    result: descriptionSchema.optional(),

    startedAt: worldDateSchema,

    endedAt: worldDateSchema.optional(),

    allowTimelineAnomaly: z
      .boolean()
      .default(false),
  })
  .superRefine((data, ctx) => {
    if (
      data.allowTimelineAnomaly ||
      !data.endedAt
    ) {
      return;
    }

    if (
      compareWorldDates(
        data.endedAt,
        data.startedAt
      ) < 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endedAt"],
        message:
          "A war cannot end before it starts unless timeline anomalies are allowed.",
      });
    }
  });

export const createWarSchema = warSchema;

export type CreateWarInput = z.infer<
  typeof createWarSchema
>;

export const updateWarSchema =
  warSchema.partial();

export type UpdateWarInput = z.infer<
  typeof updateWarSchema
>;

/* -------------------------------------------------------------------------- */
/*                              War Participant                               */
/* -------------------------------------------------------------------------- */

const warParticipantSchema = z
  .object({
    warId: objectIdSchema,

    organizationId: objectIdSchema,

    side: z.int().min(1),

    role: z.enum(WarRole),

    joinedAt: worldDateSchema.optional(),

    leftAt: worldDateSchema.optional(),

    allowTimelineAnomaly: z
      .boolean()
      .default(false),
  })
  .superRefine((data, ctx) => {
    if (
      data.allowTimelineAnomaly ||
      !data.joinedAt ||
      !data.leftAt
    ) {
      return;
    }

    if (
      compareWorldDates(
        data.leftAt,
        data.joinedAt
      ) < 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["leftAt"],
        message:
          "A participant cannot leave a war before joining unless timeline anomalies are allowed.",
      });
    }
  });

export const createWarParticipantSchema =
  warParticipantSchema;

export type CreateWarParticipantInput =
  z.infer<
    typeof createWarParticipantSchema
  >;

export const updateWarParticipantSchema =
  warParticipantSchema.partial();

export type UpdateWarParticipantInput =
  z.infer<
    typeof updateWarParticipantSchema
  >;
