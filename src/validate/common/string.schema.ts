import { z } from "zod";

export const nameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100);

export const shortTextSchema = z
  .string()
  .trim()
  .max(500);

export const descriptionSchema = z
  .string()
  .trim()
  .max(5000);

export const aliasSchema = z.array(nameSchema);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]+$/);

export const urlSchema = z
  .string()
  .trim()
  .url();
