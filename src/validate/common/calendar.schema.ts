import { z } from "zod";

import {
  descriptionSchema,
  nameSchema,
} from "./string.schema";

/* -------------------------------------------------------------------------- */
/*                              Calendar Month                                */
/* -------------------------------------------------------------------------- */

export const calendarMonthSchema = z.object({
  number: z
    .int()
    .min(1)
    .max(12),

  name: nameSchema,

  description:
    descriptionSchema.optional(),
});

export type CalendarMonthInput = z.infer<
  typeof calendarMonthSchema
>;

/* -------------------------------------------------------------------------- */
/*                             Calendar Weekday                               */
/* -------------------------------------------------------------------------- */

export const calendarWeekdaySchema = z.object({
  number: z
    .int()
    .min(1)
    .max(7),

  name: nameSchema,

  description:
    descriptionSchema.optional(),
});

export type CalendarWeekdayInput = z.infer<
  typeof calendarWeekdaySchema
>;
