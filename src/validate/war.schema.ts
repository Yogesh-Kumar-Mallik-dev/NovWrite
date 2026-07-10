import {
  WarOutcome,
  WarRole,
  WarType,
} from "@/lib/prisma";

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

type TimelineValidationData = {
  startedAt?: z.infer<typeof worldDateSchema>;
  endedAt?: z.infer<typeof worldDateSchema>;
  joinedAt?: z.infer<typeof worldDateSchema>;
  leftAt?: z.infer<typeof worldDateSchema>;
  allowTimelineAnomaly?: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                    War                                     */
/* -------------------------------------------------------------------------- */

const warBaseSchema = z.object({
  historicalEventId: objectIdSchema,

  type: z.enum(WarType),

  outcome: z.enum(WarOutcome),

  cause: descriptionSchema.optional(),

  result: descriptionSchema.optional(),

  startedAt: worldDateSchema,

  endedAt: worldDateSchema.optional(),

  allowTimelineAnomaly:
    z.boolean().default(false),
});

function validateWar(
  data: TimelineValidationData,
  ctx: z.RefinementCtx
) {
  if (
    data.allowTimelineAnomaly ||
    !data.startedAt ||
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
}

export const createWarSchema =
  warBaseSchema.superRefine(validateWar);

export type CreateWarInput =
  z.infer<typeof createWarSchema>;

export const updateWarSchema =
  warBaseSchema
    .partial()
    .superRefine(validateWar);

export type UpdateWarInput =
  z.infer<typeof updateWarSchema>;

/* -------------------------------------------------------------------------- */
/*                              War Participant                               */
/* -------------------------------------------------------------------------- */

const warParticipantBaseSchema =
  z.object({
    warId: objectIdSchema,

    organizationId: objectIdSchema,

    side: z.int().min(1),

    role: z.enum(WarRole),

    joinedAt:
      worldDateSchema.optional(),

    leftAt:
      worldDateSchema.optional(),

    allowTimelineAnomaly:
      z.boolean().default(false),
  });

function validateWarParticipant(
  data: TimelineValidationData,
  ctx: z.RefinementCtx
) {
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
}

export const createWarParticipantSchema =
  warParticipantBaseSchema.superRefine(
    validateWarParticipant
  );

export type CreateWarParticipantInput =
  z.infer<
    typeof createWarParticipantSchema
  >;

export const updateWarParticipantSchema =
  warParticipantBaseSchema
    .partial()
    .superRefine(
      validateWarParticipant
    );

export type UpdateWarParticipantInput =
  z.infer<
    typeof updateWarParticipantSchema
  >;
