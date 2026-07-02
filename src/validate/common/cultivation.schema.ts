import { z } from "zod";

import {
  descriptionSchema,
  shortTextSchema,
} from "./string.schema";

import {
  multiplierSchema,
  percentageSchema,
} from "./number.schema";

/* -------------------------------------------------------------------------- */
/*                              Cultivation Bonus                             */
/* -------------------------------------------------------------------------- */

export const breakthroughSchema =
  multiplierSchema;

export const cultivationBonusSchema =
  z.object({
    powerMultiplier:
      multiplierSchema.optional(),

    breakthrough:
      breakthroughSchema.optional(),

    bodyRealmbreakthroughChance:
      percentageSchema.optional(),

    QiRealmbreakthroughChance:
      percentageSchema.optional(),

    soulRealmbreakthroughChance:
      percentageSchema.optional(),

    specialProperty:
      shortTextSchema.optional(),

    description:
      descriptionSchema.optional(),
  });

export type CultivationBonusInput =
  z.infer<
    typeof cultivationBonusSchema
  >;
