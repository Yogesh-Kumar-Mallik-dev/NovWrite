import {
  Body_MajorRealm,
  Cultivation_Path,
  Minor_Realm,
  Qi_MajorRealm,
  Soul_MajorRealm,
} from "@prisma/client";
import { z } from "zod";

import {
  descriptionSchema,
  objectIdSchema,
  percentageSchema,
  positiveIntSchema,
} from "./common";

/* -------------------------------------------------------------------------- */
/*                               Major Realm                                  */
/* -------------------------------------------------------------------------- */

const majorRealmBaseSchema = z.object({
  path: z.enum(Cultivation_Path),

  qiRealm:
    z.enum(Qi_MajorRealm).optional(),

  bodyRealm:
    z.enum(Body_MajorRealm).optional(),

  soulRealm:
    z.enum(Soul_MajorRealm).optional(),

  power:
    positiveIntSchema.optional(),

  description:
    descriptionSchema.optional(),

  lifespan:
    positiveIntSchema.optional(),

  requiredEnergy:
    positiveIntSchema.optional(),

  breakthroughChance:
    percentageSchema.optional(),
});

type MajorRealmValidation = {
  path?: Cultivation_Path;

  qiRealm?: Qi_MajorRealm;

  bodyRealm?: Body_MajorRealm;

  soulRealm?: Soul_MajorRealm;
};

function validateMajorRealm(
  data: MajorRealmValidation,
  ctx: z.RefinementCtx
) {
  if (!data.path) {
    return;
  }

  switch (data.path) {
    case Cultivation_Path.qi:
      if (!data.qiRealm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["qiRealm"],
          message:
            "Qi realm is required.",
        });
      }

      if (
        data.bodyRealm ||
        data.soulRealm
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Only qiRealm may be set for the Qi cultivation path.",
        });
      }
      break;

    case Cultivation_Path.body:
      if (!data.bodyRealm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bodyRealm"],
          message:
            "Body realm is required.",
        });
      }

      if (
        data.qiRealm ||
        data.soulRealm
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Only bodyRealm may be set for the Body cultivation path.",
        });
      }
      break;

    case Cultivation_Path.soul:
      if (!data.soulRealm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["soulRealm"],
          message:
            "Soul realm is required.",
        });
      }

      if (
        data.qiRealm ||
        data.bodyRealm
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Only soulRealm may be set for the Soul cultivation path.",
        });
      }
      break;
  }
}

export const createMajorRealmSchema =
  majorRealmBaseSchema.superRefine(
    validateMajorRealm
  );

export const updateMajorRealmSchema =
  majorRealmBaseSchema
    .partial()
    .superRefine(
      validateMajorRealm
    );

export type CreateMajorRealmInput =
  z.infer<
    typeof createMajorRealmSchema
  >;

export type UpdateMajorRealmInput =
  z.infer<
    typeof updateMajorRealmSchema
  >;

/* -------------------------------------------------------------------------- */
/*                               Minor Realm                                  */
/* -------------------------------------------------------------------------- */

export const createMinorRealmSchema =
  z.object({
    majorRealmId:
      objectIdSchema,

    realm:
      z.enum(Minor_Realm),

    power:
      positiveIntSchema.optional(),

    description:
      descriptionSchema.optional(),

    breakthroughChance:
      percentageSchema.optional(),
  });

export const updateMinorRealmSchema =
  createMinorRealmSchema.partial();

export type CreateMinorRealmInput =
  z.infer<
    typeof createMinorRealmSchema
  >;

export type UpdateMinorRealmInput =
  z.infer<
    typeof updateMinorRealmSchema
  >;
