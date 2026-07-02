import { OrganizationType } from "@prisma/client";
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
/*                               Organization                                 */
/* -------------------------------------------------------------------------- */

const organizationSchema = z
  .object({
    name: nameSchema,

    aliases: aliasSchema.default([]),

    type: z.enum(OrganizationType),

    description: descriptionSchema.optional(),

    founderId: objectIdSchema.optional(),

    leaderId: objectIdSchema.optional(),

    parentOrganizationId:
      objectIdSchema.optional(),

    foundedAt: worldDateSchema.optional(),

    dissolvedAt: worldDateSchema.optional(),

    allowTimelineAnomaly: z
      .boolean()
      .default(false),
  })
  .superRefine((data, ctx) => {
    if (
      data.allowTimelineAnomaly ||
      !data.foundedAt ||
      !data.dissolvedAt
    ) {
      return;
    }

    if (
      compareWorldDates(
        data.dissolvedAt,
        data.foundedAt
      ) < 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dissolvedAt"],
        message:
          "An organization cannot dissolve before it is founded unless timeline anomalies are allowed.",
      });
    }
  });

export const createOrganizationSchema =
  organizationSchema;

export type CreateOrganizationInput =
  z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema =
  organizationSchema.partial();

export type UpdateOrganizationInput =
  z.infer<typeof updateOrganizationSchema>;
