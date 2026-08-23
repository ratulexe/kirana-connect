import { z } from "zod";

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .optional()
    .or(z.literal(""));

const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal(""));

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password"),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name").max(120, "Name is too long"),
  category_id: z.string().uuid("Choose a category"),
  brand_id: z.string().optional().or(z.literal("")),
  description: optionalText(500),
  image_url: optionalUrl,
  barcode: optionalText(120),
  unit_label: z.string().trim().min(1, "Enter a unit").max(60, "Unit is too long"),
  mrp: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number({ error: "Enter the MRP" }).min(0, "MRP cannot be negative"),
  ),
  is_active: z.boolean(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Enter a category name").max(120, "Name is too long"),
  description: optionalText(500),
  image_url: optionalUrl,
  is_active: z.boolean(),
});

export const brandSchema = z.object({
  name: z.string().trim().min(2, "Enter a brand name").max(120, "Name is too long"),
  logo_url: optionalUrl,
});
