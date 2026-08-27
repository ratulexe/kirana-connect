import { z } from "zod";

/**
 * Client-side validation for the onboarding wizard.
 *
 * These rules mirror the database CHECK constraints and the server validator.
 * They exist for fast, friendly feedback; the backend re-validates everything
 * independently, because nothing arriving over the network can be trusted.
 */

const trimmed = (value) => (typeof value === "string" ? value.trim() : value);

const phoneRule = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s()]{6,20}$/, "Enter a valid phone number");

/** Store phone is shown directly to customers, so it is kept to plain digits, up to 10. */
const storePhoneRule = z
  .string()
  .trim()
  .regex(/^[0-9]{1,10}$/, "Enter up to 10 digits, numbers only");

export const accountSchema = z
  .object({
    fullName: z
      .string()
      .transform(trimmed)
      .pipe(z.string().min(2, "Enter your name").max(120, "Name is too long")),
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(72, "Password is too long")
      .regex(/[a-zA-Z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
    phone: phoneRule,
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(72, "Password is too long")
      .regex(/[a-zA-Z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const storeDetailsSchema = z.object({
  name: z
    .string()
    .transform(trimmed)
    .pipe(z.string().min(2, "Enter your store name").max(120, "Store name is too long")),
  description: z
    .string()
    .transform(trimmed)
    .pipe(z.string().max(500, "Keep the description under 500 characters"))
    .optional()
    .or(z.literal("")),
  phone: storePhoneRule.optional().or(z.literal("")),
});

export const ownerDetailsSchema = z.object({
  full_name: z
    .string()
    .transform(trimmed)
    .pipe(z.string().min(2, "Enter the owner name").max(120, "Name is too long")),
  phone: phoneRule.optional().or(z.literal("")),
});

export const addressSchema = z.object({
  address_line_1: z
    .string()
    .transform(trimmed)
    .pipe(z.string().min(3, "Enter the street address").max(200, "Address is too long")),
  address_line_2: z
    .string()
    .transform(trimmed)
    .pipe(z.string().max(200, "Address is too long"))
    .optional()
    .or(z.literal("")),
  locality: z
    .string()
    .transform(trimmed)
    .pipe(z.string().min(2, "Enter the locality or area").max(120, "Locality is too long")),
  city: z
    .string()
    .transform(trimmed)
    .pipe(z.string().min(2, "Enter the city").max(120, "City is too long")),
  state: z
    .string()
    .transform(trimmed)
    .pipe(z.string().min(2, "Enter the state").max(120, "State is too long")),
  postal_code: z
    .string()
    .transform(trimmed)
    .pipe(
      z
        .string()
        .min(4, "Enter a valid postal code")
        .max(12, "Enter a valid postal code")
        .regex(/^[0-9A-Za-z\s-]+$/, "Enter a valid postal code"),
    ),
  latitude: z
    .number({ error: "Pick your store location on the map" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number({ error: "Pick your store location on the map" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
});

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const hoursSchema = z.object({
  hours: z
    .array(
      z
        .object({
          day_of_week: z.number().int().min(0).max(6),
          is_closed: z.boolean(),
          opens_at: z.string(),
          closes_at: z.string(),
        })
        .refine((day) => day.is_closed || (TIME.test(day.opens_at) && TIME.test(day.closes_at)), {
          message: "Enter opening and closing times, or mark the day closed",
          path: ["opens_at"],
        })
        .refine((day) => day.is_closed || day.opens_at !== day.closes_at, {
          message: "Opening and closing times cannot be the same",
          path: ["closes_at"],
        }),
    )
    .length(7),
});

export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Sensible default a kirana owner can accept or adjust: closed Sunday. */
export function defaultHours() {
  return DAY_LABELS.map((_, index) => ({
    day_of_week: index,
    is_closed: index === 0,
    opens_at: index === 0 ? "" : "08:00",
    closes_at: index === 0 ? "" : "21:00",
  }));
}
