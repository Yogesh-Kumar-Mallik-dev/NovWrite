import {
  ArtifactCategory,
  ArmorType,
  Elements,
  Grade,
  MaterialSource,
  MaterialType,
  PillType,
  Qi_MajorRealm,
  SecretKnowledgeType,
  TreasureCategory,
  TalismanType,
  WeaponType,
} from "@prisma/client";

import { z } from "zod";

import {
  descriptionSchema,
  nameSchema,
  nonNegativeIntSchema,
  objectIdSchema,
} from "./common";

/* -------------------------------------------------------------------------- */
/*                                   Item                                     */
/* -------------------------------------------------------------------------- */

export const createItemSchema = z.object({
  name: nameSchema,

  grade: z.enum(Grade),

  description: descriptionSchema.optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

/* -------------------------------------------------------------------------- */
/*                                  Weapon                                    */
/* -------------------------------------------------------------------------- */

export const createWeaponSchema = z.object({
  itemId: objectIdSchema,

  weaponType: z.enum(WeaponType),

  attackPower: nonNegativeIntSchema.optional(),

  durability: nonNegativeIntSchema.optional(),

  element: z.enum(Elements).optional(),

  requiredRealm: z.enum(Qi_MajorRealm).optional(),
});

export type CreateWeaponInput = z.infer<typeof createWeaponSchema>;

/* -------------------------------------------------------------------------- */
/*                                   Armor                                    */
/* -------------------------------------------------------------------------- */

export const createArmorSchema = z.object({
  itemId: objectIdSchema,

  armorType: z.enum(ArmorType),

  defense: nonNegativeIntSchema.optional(),

  durability: nonNegativeIntSchema.optional(),

  element: z.enum(Elements).optional(),
});

export type CreateArmorInput = z.infer<typeof createArmorSchema>;

/* -------------------------------------------------------------------------- */
/*                                    Pill                                    */
/* -------------------------------------------------------------------------- */

export const createPillSchema = z.object({
  itemId: objectIdSchema,

  pillType: z.enum(PillType),

  powerGain: nonNegativeIntSchema.optional(),

  breakthroughChance: nonNegativeIntSchema.optional(),

  toxicity: nonNegativeIntSchema.optional(),
});

export type CreatePillInput = z.infer<typeof createPillSchema>;

/* -------------------------------------------------------------------------- */
/*                                 Talisman                                   */
/* -------------------------------------------------------------------------- */

export const createTalismanSchema = z.object({
  itemId: objectIdSchema,

  uses: nonNegativeIntSchema.optional(),

  talismanType: z.enum(TalismanType),

  element: z.enum(Elements).optional(),

  effect: descriptionSchema.optional(),
});

export type CreateTalismanInput = z.infer<typeof createTalismanSchema>;

/* -------------------------------------------------------------------------- */
/*                                 Artifact                                   */
/* -------------------------------------------------------------------------- */

export const createArtifactSchema = z.object({
  itemId: objectIdSchema,

  category: z.enum(ArtifactCategory),

  passiveEffect: descriptionSchema.optional(),

  activeEffect: descriptionSchema.optional(),

  durability: nonNegativeIntSchema.optional(),

  bound: z.boolean().default(false),

  rechargeable: z.boolean().default(false),

  growthArtifact: z.boolean().default(false),

  uses: nonNegativeIntSchema.optional(),

  requiredRealm: z.enum(Qi_MajorRealm).optional(),
});

export type CreateArtifactInput = z.infer<typeof createArtifactSchema>;

/* -------------------------------------------------------------------------- */
/*                                 Treasure                                   */
/* -------------------------------------------------------------------------- */

export const createTreasureSchema = z.object({
  itemId: objectIdSchema,

  category: z.enum(TreasureCategory),

  passiveEffect: descriptionSchema.optional(),

  activeEffect: descriptionSchema.optional(),

  consumable: z.boolean().default(false),

  sentient: z.boolean().default(false),

  unique: z.boolean().default(false),
});

export type CreateTreasureInput = z.infer<typeof createTreasureSchema>;

/* -------------------------------------------------------------------------- */
/*                               Secret Scroll                                */
/* -------------------------------------------------------------------------- */

export const createSecretScrollSchema = z.object({
  itemId: objectIdSchema,

  knowledgeType: z.enum(SecretKnowledgeType),

  knowledgeId: objectIdSchema,

  oneTimeUse: z.boolean().default(false),
});

export type CreateSecretScrollInput = z.infer<
  typeof createSecretScrollSchema
>;

/* -------------------------------------------------------------------------- */
/*                                  Material                                  */
/* -------------------------------------------------------------------------- */

export const createMaterialSchema = z.object({
  itemId: objectIdSchema,

  type: z.enum(MaterialType),

  source: z.enum(MaterialSource),

  purity: nonNegativeIntSchema.optional(),

  renewable: z.boolean().default(false),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;

/* -------------------------------------------------------------------------- */
/*                               Update Schemas                               */
/* -------------------------------------------------------------------------- */

export const updateItemSchema =
  createItemSchema.partial();

export type UpdateItemInput = z.infer<
  typeof updateItemSchema
>;

export const updateWeaponSchema =
  createWeaponSchema.partial();

export type UpdateWeaponInput = z.infer<
  typeof updateWeaponSchema
>;

export const updateArmorSchema =
  createArmorSchema.partial();

export type UpdateArmorInput = z.infer<
  typeof updateArmorSchema
>;

export const updatePillSchema =
  createPillSchema.partial();

export type UpdatePillInput = z.infer<
  typeof updatePillSchema
>;

export const updateTalismanSchema =
  createTalismanSchema.partial();

export type UpdateTalismanInput = z.infer<
  typeof updateTalismanSchema
>;

export const updateArtifactSchema =
  createArtifactSchema.partial();

export type UpdateArtifactInput = z.infer<
  typeof updateArtifactSchema
>;

export const updateTreasureSchema =
  createTreasureSchema.partial();

export type UpdateTreasureInput = z.infer<
  typeof updateTreasureSchema
>;

export const updateSecretScrollSchema =
  createSecretScrollSchema.partial();

export type UpdateSecretScrollInput = z.infer<
  typeof updateSecretScrollSchema
>;

export const updateMaterialSchema =
  createMaterialSchema.partial();

export type UpdateMaterialInput = z.infer<
  typeof updateMaterialSchema
>;
