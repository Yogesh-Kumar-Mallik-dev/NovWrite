import { Grade, Elements } from "@/lib/prisma";
import { z } from "zod";

import {
  cultivationBonusSchema,
  descriptionSchema,
  multiplierSchema,
  nameSchema,
  percentageSchema,
} from "./common";

/* -------------------------------------------------------------------------- */
/*                                Spirit Root                                 */
/* -------------------------------------------------------------------------- */

export const createSpiritRootSchema = z.object({
  elements: z
    .array(z.enum(Elements))
    .min(1)
    .max(6),

  breakthroughMultiplier:
    multiplierSchema.optional(),

  basePowerMultiplier:
    multiplierSchema.optional(),

  description:
    descriptionSchema.optional(),
});

export const updateSpiritRootSchema =
  createSpiritRootSchema.partial();

export type CreateSpiritRootInput = z.infer<
  typeof createSpiritRootSchema
>;

export type UpdateSpiritRootInput = z.infer<
  typeof updateSpiritRootSchema
>;

/* -------------------------------------------------------------------------- */
/*                                  Physique                                  */
/* -------------------------------------------------------------------------- */

export const createPhysiqueSchema =
  cultivationBonusSchema.extend({
    name: nameSchema,

    grade: z.enum(Grade),
  });

export const updatePhysiqueSchema =
  createPhysiqueSchema.partial();

export type CreatePhysiqueInput = z.infer<
  typeof createPhysiqueSchema
>;

export type UpdatePhysiqueInput = z.infer<
  typeof updatePhysiqueSchema
>;

/* -------------------------------------------------------------------------- */
/*                                 Bloodline                                  */
/* -------------------------------------------------------------------------- */

export const createBloodlineSchema =
  cultivationBonusSchema.extend({
    name: nameSchema,

    grade: z.enum(Grade),

    progenyChance:
      percentageSchema.optional(),
  });

export const updateBloodlineSchema =
  createBloodlineSchema.partial();

export type CreateBloodlineInput = z.infer<
  typeof createBloodlineSchema
>;

export type UpdateBloodlineInput = z.infer<
  typeof updateBloodlineSchema
>;
