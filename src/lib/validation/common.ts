import { z } from "zod";

import { isValidDateKey, parseTime } from "@/lib/utils/zoned-time";

export const dateKeySchema = z.string().refine(isValidDateKey, { message: "Use a valid date (YYYY-MM-DD)." });

export const timeOfDaySchema = z
  .string()
  .refine((value) => parseTime(value) !== null, { message: "Use a valid time (HH:MM)." });

export const uuidSchema = z.uuid({ message: "Invalid id." });

/** Trims and collapses empty strings to null — for optional free-text fields. */
export const optionalTextSchema = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => (value === "" ? null : value))
    .nullable();
