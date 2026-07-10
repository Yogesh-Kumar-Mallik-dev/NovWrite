import {
  HistoricalEventScale,
  HistoricalEventType,
} from "@/lib/prisma";

import { z } from "zod";

import {
  descriptionSchema,
  nameSchema,
  objectIdSchema,
  shortTextSchema,
  worldDateSchema,
} from "./common";

/* -------------------------------------------------------------------------- */
/*                             Historical Event                               */
/* -------------------------------------------------------------------------- */

export const createHistoricalEventSchema =
  z.object({
    title: nameSchema,

    type: z.enum(HistoricalEventType),

    scale: z.enum(HistoricalEventScale),

    description:
      descriptionSchema.optional(),

    date: worldDateSchema,

    locationId:
      objectIdSchema.optional(),

    parentEventId:
      objectIdSchema.optional(),
  });

export type CreateHistoricalEventInput =
  z.infer<
    typeof createHistoricalEventSchema
  >;

export const updateHistoricalEventSchema =
  createHistoricalEventSchema.partial();

export type UpdateHistoricalEventInput =
  z.infer<
    typeof updateHistoricalEventSchema
  >;

/* -------------------------------------------------------------------------- */
/*                        Character Historical Event                          */
/* -------------------------------------------------------------------------- */

const characterHistoricalEventSchema =
  z.object({
    characterId: objectIdSchema,

    eventId: objectIdSchema,

    role: shortTextSchema.optional(),

    description:
      descriptionSchema.optional(),
  });

export const createCharacterHistoricalEventSchema =
  characterHistoricalEventSchema;

export type CreateCharacterHistoricalEventInput =
  z.infer<
    typeof createCharacterHistoricalEventSchema
  >;

export const updateCharacterHistoricalEventSchema =
  characterHistoricalEventSchema.partial();

export type UpdateCharacterHistoricalEventInput =
  z.infer<
    typeof updateCharacterHistoricalEventSchema
  >;

/* -------------------------------------------------------------------------- */
/*                      Organization Historical Event                         */
/* -------------------------------------------------------------------------- */

const organizationHistoricalEventSchema =
  z.object({
    organizationId:
      objectIdSchema,

    eventId: objectIdSchema,

    role: shortTextSchema.optional(),

    description:
      descriptionSchema.optional(),
  });

export const createOrganizationHistoricalEventSchema =
  organizationHistoricalEventSchema;

export type CreateOrganizationHistoricalEventInput =
  z.infer<
    typeof createOrganizationHistoricalEventSchema
  >;

export const updateOrganizationHistoricalEventSchema =
  organizationHistoricalEventSchema.partial();

export type UpdateOrganizationHistoricalEventInput =
  z.infer<
    typeof updateOrganizationHistoricalEventSchema
  >;

/* -------------------------------------------------------------------------- */
/*                        Location Historical Event                           */
/* -------------------------------------------------------------------------- */

const locationHistoricalEventSchema =
  z.object({
    locationId: objectIdSchema,

    eventId: objectIdSchema,

    role: shortTextSchema.optional(),

    description:
      descriptionSchema.optional(),
  });

export const createLocationHistoricalEventSchema =
  locationHistoricalEventSchema;

export type CreateLocationHistoricalEventInput =
  z.infer<
    typeof createLocationHistoricalEventSchema
  >;

export const updateLocationHistoricalEventSchema =
  locationHistoricalEventSchema.partial();

export type UpdateLocationHistoricalEventInput =
  z.infer<
    typeof updateLocationHistoricalEventSchema
  >;

/* -------------------------------------------------------------------------- */
/*                          Item Historical Event                             */
/* -------------------------------------------------------------------------- */

const itemHistoricalEventSchema = z.object({
  itemId: objectIdSchema,

  eventId: objectIdSchema,

  role: shortTextSchema.optional(),

  description:
    descriptionSchema.optional(),
});

export const createItemHistoricalEventSchema =
  itemHistoricalEventSchema;

export type CreateItemHistoricalEventInput =
  z.infer<
    typeof createItemHistoricalEventSchema
  >;

export const updateItemHistoricalEventSchema =
  itemHistoricalEventSchema.partial();

export type UpdateItemHistoricalEventInput =
  z.infer<
    typeof updateItemHistoricalEventSchema
  >;
