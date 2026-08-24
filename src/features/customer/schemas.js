import { z } from "zod";

const trimmed = (value) => (typeof value === "string" ? value.trim() : value);

export const phoneRule = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s()]{6,20}$/, "Enter a valid phone number")
  .optional()
  .or(z.literal(""));

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .transform(trimmed)
      .pipe(z.string().min(2, "Enter your name").max(120, "Name is too long")),
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
    phone: phoneRule,
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

export const profileSchema = z.object({
  fullName: z
    .string()
    .transform(trimmed)
    .pipe(z.string().min(2, "Enter your name").max(120, "Name is too long"))
    .optional()
    .or(z.literal("")),
  phone: phoneRule,
});

const coordinate = (label, min, max) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number({ error: `${label} is required` }).min(min, `${label} must be between ${min} and ${max}`).max(max, `${label} must be between ${min} and ${max}`),
  );

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Add a label").max(60, "Label is too long"),
  address_line_1: z.string().trim().min(3, "Enter the address").max(200, "Address is too long"),
  address_line_2: z.string().trim().max(200, "Address is too long").optional().or(z.literal("")),
  locality: z.string().trim().max(120, "Locality is too long").optional().or(z.literal("")),
  city: z.string().trim().max(120, "City is too long").optional().or(z.literal("")),
  state: z.string().trim().max(120, "State is too long").optional().or(z.literal("")),
  postal_code: z.string().trim().max(20, "Postal code is too long").optional().or(z.literal("")),
  latitude: coordinate("Latitude", -90, 90),
  longitude: coordinate("Longitude", -180, 180),
  is_default: z.boolean().default(false),
});
