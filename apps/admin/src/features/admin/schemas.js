import { z } from "zod";

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .optional()
    .or(z.literal(""));

const optionalLongText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""));

const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal(""));

export const UNIT_OPTIONS = [
  { code: "mg", label: "mg" },
  { code: "g", label: "g" },
  { code: "kg", label: "kg" },
  { code: "ml", label: "ml" },
  { code: "l", label: "L" },
  { code: "page", label: "page" },
  { code: "pages", label: "pages" },
  { code: "pc", label: "pc" },
  { code: "pcs", label: "pcs" },
  { code: "pair", label: "pair" },
  { code: "dozen", label: "dozen" },
  { code: "pack", label: "pack" },
  { code: "packet", label: "packet" },
  { code: "pouch", label: "pouch" },
  { code: "sachet", label: "sachet" },
  { code: "bottle", label: "bottle" },
  { code: "can", label: "can" },
  { code: "jar", label: "jar" },
  { code: "box", label: "box" },
  { code: "carton", label: "carton" },
  { code: "roll", label: "roll" },
  { code: "tray", label: "tray" },
];

const unitCodes = UNIT_OPTIONS.map((unit) => unit.code);
const variantSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  quantity: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number({ error: "Enter a quantity" }).positive("Quantity must be greater than zero"),
  ),
  unit_code: z.string().refine((value) => unitCodes.includes(value), "Choose a unit"),
  mrp: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number({ error: "Enter MRP" }).positive("Enter MRP"),
  ),
  barcode: optionalText(120),
  image_url: optionalUrl,
  is_active: z.boolean(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password"),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name").max(120, "Name is too long"),
  category_id: z.string().uuid("Choose a category"),
  brand_id: z.string().optional().or(z.literal("")),
  description: optionalLongText,
  image_url: optionalUrl,
  variants: z.array(variantSchema).min(1, "Add at least one variant"),
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
