import {
  CraftResult,
  FormationCategory,
  Qi_MajorRealm,
  RecipeCategory,
} from "@prisma/client";

import { z } from "zod";

import {
  descriptionSchema,
  nameSchema,
  nonNegativeIntSchema,
  objectIdSchema,
  worldDateSchema,
} from "./common";

/* -------------------------------------------------------------------------- */
/*                                   Recipe                                   */
/* -------------------------------------------------------------------------- */

export const createRecipeSchema = z.object({
  name: nameSchema,

  category: z.enum(RecipeCategory),

  description: descriptionSchema.optional(),

  occupationId: objectIdSchema,

  resultItemId: objectIdSchema,

  requiredRealm: z.enum(Qi_MajorRealm).optional(),

  craftingTime: nonNegativeIntSchema.optional(),
});

export type CreateRecipeInput = z.infer<
  typeof createRecipeSchema
>;

export const updateRecipeSchema =
  createRecipeSchema.partial();

export type UpdateRecipeInput = z.infer<
  typeof updateRecipeSchema
>;

/* -------------------------------------------------------------------------- */
/*                              Recipe Ingredient                             */
/* -------------------------------------------------------------------------- */

export const createRecipeIngredientSchema =
  z.object({
    recipeId: objectIdSchema,

    itemId: objectIdSchema,

    quantity: nonNegativeIntSchema.default(1),

    optional: z.boolean().default(false),
  });

export type CreateRecipeIngredientInput =
  z.infer<
    typeof createRecipeIngredientSchema
  >;

export const updateRecipeIngredientSchema =
  createRecipeIngredientSchema.partial();

export type UpdateRecipeIngredientInput =
  z.infer<
    typeof updateRecipeIngredientSchema
  >;

/* -------------------------------------------------------------------------- */
/*                              Character Craft                               */
/* -------------------------------------------------------------------------- */

export const createCharacterCraftSchema =
  z.object({
    characterId: objectIdSchema,

    recipeId: objectIdSchema,

    historicalEventId:
      objectIdSchema.optional(),

    quantity:
      nonNegativeIntSchema.default(1),

    result: z.enum(CraftResult),

    craftedAt:
      worldDateSchema.optional(),

    notes:
      descriptionSchema.optional(),
  });

export type CreateCharacterCraftInput =
  z.infer<
    typeof createCharacterCraftSchema
  >;

export const updateCharacterCraftSchema =
  createCharacterCraftSchema.partial();

export type UpdateCharacterCraftInput =
  z.infer<
    typeof updateCharacterCraftSchema
  >;

/* -------------------------------------------------------------------------- */
/*                                 Formation                                  */
/* -------------------------------------------------------------------------- */

export const createFormationSchema =
  z.object({
    recipeId: objectIdSchema,

    category:
      z.enum(FormationCategory),

    radius:
      nonNegativeIntSchema.optional(),

    minimumParticipants:
      nonNegativeIntSchema.optional(),

    maximumParticipants:
      nonNegativeIntSchema.optional(),

    duration:
      nonNegativeIntSchema.optional(),

    effect:
      descriptionSchema.optional(),
  })
    .superRefine((data, ctx) => {
      if (
        data.minimumParticipants !==
        undefined &&
        data.maximumParticipants !==
        undefined &&
        data.minimumParticipants >
        data.maximumParticipants
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maximumParticipants"],
          message:
            "Maximum participants cannot be less than minimum participants.",
        });
      }
    });

export type CreateFormationInput =
  z.infer<
    typeof createFormationSchema
  >;

export const updateFormationSchema =
  createFormationSchema.partial();

export type UpdateFormationInput =
  z.infer<
    typeof updateFormationSchema
  >;
