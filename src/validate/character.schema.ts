import {
  Cultivation_Path,
  RelationshipType,
  OrganizationRole,
} from "@prisma/client";

import { z } from "zod";

import {
  descriptionSchema,
  nameSchema,
  nonNegativeIntSchema,
  objectIdSchema,
  positiveIntSchema,
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
/*                                 Character                                  */
/* -------------------------------------------------------------------------- */

export const createCharacterSchema = z.object({
  name: nameSchema,

  dateOfBirth: worldDateSchema.optional(),

  basePower: nonNegativeIntSchema.default(0),

  spiritRootId: objectIdSchema,
});

export type CreateCharacterInput = z.infer<
  typeof createCharacterSchema
>;

export const updateCharacterSchema =
  createCharacterSchema.partial();

export type UpdateCharacterInput = z.infer<
  typeof updateCharacterSchema
>;

/* -------------------------------------------------------------------------- */
/*                             Character Version                              */
/* -------------------------------------------------------------------------- */

export const createCharacterVersionSchema =
  z.object({
    characterId: objectIdSchema,

    version: positiveIntSchema,

    title: nameSchema.optional(),

    description: descriptionSchema.optional(),
  });

export type CreateCharacterVersionInput =
  z.infer<
    typeof createCharacterVersionSchema
  >;

export const updateCharacterVersionSchema =
  createCharacterVersionSchema.partial();

export type UpdateCharacterVersionInput =
  z.infer<
    typeof updateCharacterVersionSchema
  >;

/* -------------------------------------------------------------------------- */
/*                            Character Inventory                             */
/* -------------------------------------------------------------------------- */

const characterInventoryBaseSchema =
  z.object({
    characterId: objectIdSchema,

    itemId: objectIdSchema,

    quantity:
      positiveIntSchema.default(1),

    equipped:
      z.boolean().default(false),

    obtainedAt:
      worldDateSchema.optional(),

    lostAt:
      worldDateSchema.optional(),

    reason:
      descriptionSchema.optional(),

    allowTimelineAnomaly:
      z.boolean().default(false),
  });

type CharacterInventoryValidation = {
  obtainedAt?: z.infer<
    typeof worldDateSchema
  >;

  lostAt?: z.infer<
    typeof worldDateSchema
  >;

  allowTimelineAnomaly?: boolean;
};

function validateCharacterInventory(
  data: CharacterInventoryValidation,
  ctx: z.RefinementCtx
) {
  if (
    data.allowTimelineAnomaly ||
    !data.obtainedAt ||
    !data.lostAt
  ) {
    return;
  }

  if (
    compareWorldDates(
      data.lostAt,
      data.obtainedAt
    ) < 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["lostAt"],
      message:
        "An item cannot be lost before it is obtained unless timeline anomalies are allowed.",
    });
  }
}

export const createCharacterInventorySchema =
  characterInventoryBaseSchema.superRefine(
    validateCharacterInventory
  );

export const updateCharacterInventorySchema =
  characterInventoryBaseSchema
    .partial()
    .superRefine(
      validateCharacterInventory
    );
/* -------------------------------------------------------------------------- */
/*                          Character Cultivation                             */
/* -------------------------------------------------------------------------- */

export const createCharacterCultivationSchema =
  z.object({
    characterId: objectIdSchema,

    path: z.enum(Cultivation_Path),

    majorRealmId: objectIdSchema,

    minorRealmId: objectIdSchema,

    currentEnergy:
      nonNegativeIntSchema.optional(),

    peakReached:
      z.boolean().default(false),
  });

export type CreateCharacterCultivationInput =
  z.infer<
    typeof createCharacterCultivationSchema
  >;

export const updateCharacterCultivationSchema =
  createCharacterCultivationSchema.partial();

export type UpdateCharacterCultivationInput =
  z.infer<
    typeof updateCharacterCultivationSchema
  >;

/* -------------------------------------------------------------------------- */
/*                          Character Relationship                            */
/* -------------------------------------------------------------------------- */

const characterRelationBaseSchema = z
  .object({
    sourceCharacterId:
      objectIdSchema,

    targetCharacterId:
      objectIdSchema,

    relationshipType:
      z.enum(RelationshipType),

    startDate:
      worldDateSchema.optional(),

    endDate:
      worldDateSchema.optional(),

    description:
      descriptionSchema,

    allowTimelineAnomaly:
      z.boolean().default(false),
  })
type CharacterRelationValidation = {
  sourceCharacterId?: string;

  targetCharacterId?: string;

  startDate?: z.infer<
    typeof worldDateSchema
  >;

  endDate?: z.infer<
    typeof worldDateSchema
  >;

  allowTimelineAnomaly?: boolean;
};

function validateCharacterRelation(
  data: CharacterRelationValidation,
  ctx: z.RefinementCtx
) {
  if (
    data.sourceCharacterId &&
    data.targetCharacterId &&
    data.sourceCharacterId ===
    data.targetCharacterId
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["targetCharacterId"],
      message:
        "A character cannot have a relationship with themselves.",
    });
  }

  if (
    data.allowTimelineAnomaly ||
    !data.startDate ||
    !data.endDate
  ) {
    return;
  }

  if (
    compareWorldDates(
      data.endDate,
      data.startDate
    ) < 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message:
        "A relationship cannot end before it starts unless timeline anomalies are allowed.",
    });
  }
}
export const createCharacterRelationSchema =
  characterRelationBaseSchema.superRefine(
    validateCharacterRelation
  );

export const updateCharacterRelationSchema =
  characterRelationBaseSchema
    .partial()
    .superRefine(
      validateCharacterRelation
    );

/* -------------------------------------------------------------------------- */
/*                         Character Organization                             */
/* -------------------------------------------------------------------------- */

const characterOrganizationBaseSchema = z
  .object({
    characterId: objectIdSchema,

    organizationId: objectIdSchema,

    role: z.enum(OrganizationRole),

    contributionPoints:
      nonNegativeIntSchema.optional(),

    reputation:
      nonNegativeIntSchema.optional(),

    joinedAt:
      worldDateSchema.optional(),

    leftAt:
      worldDateSchema.optional(),

    reason:
      descriptionSchema.optional(),

    isCurrent:
      z.boolean().default(true),

    allowTimelineAnomaly:
      z.boolean().default(false),
  })
type CharacterOrganizationValidation = {
  joinedAt?: z.infer<
    typeof worldDateSchema
  >;

  leftAt?: z.infer<
    typeof worldDateSchema
  >;

  allowTimelineAnomaly?: boolean;
};

function validateCharacterOrganization(
  data: CharacterOrganizationValidation,
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
        "A character cannot leave an organization before joining unless timeline anomalies are allowed.",
    });
  }
}
export const createCharacterOrganizationSchema =
  characterOrganizationBaseSchema.superRefine(
    validateCharacterOrganization
  );

export const updateCharacterOrganizationSchema =
  characterOrganizationBaseSchema
    .partial()
    .superRefine(
      validateCharacterOrganization
    );
