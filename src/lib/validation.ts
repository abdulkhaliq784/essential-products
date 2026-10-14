import { z } from "zod";
import { INDIAN_STATES } from "./indian-states";
import { ORDER_STATUSES } from "./types";

// Shared validation for forms (client) and API routes / actions (server).

export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const PINCODE_REGEX = /^[1-9]\d{5}$/;

/** Strip spaces, dashes and a leading +91 / 0 from an Indian mobile number. */
export function normalizePhone(value: string) {
  return value.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
}

const phone = z
  .string()
  .transform(normalizePhone)
  .pipe(z.string().regex(PHONE_REGEX, { error: "Enter a valid 10-digit Indian mobile number" }));

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, { error: "Please enter your full name" }).max(100),
    phone: z.union([z.literal(""), phone]).optional(),
    email: z.email({ error: "Enter a valid email address" }),
    password: z.string().min(8, { error: "Password must be at least 8 characters" }).max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const addressSchema = z.object({
  full_name: z.string().trim().min(2, { error: "Enter the recipient's full name" }).max(100),
  phone,
  line1: z.string().trim().min(3, { error: "Enter house / flat number and street" }).max(200),
  line2: z.string().trim().max(200).optional().transform((v) => v || null),
  landmark: z.string().trim().max(100).optional().transform((v) => v || null),
  city: z.string().trim().min(2, { error: "Enter your city" }).max(100),
  state: z.enum(INDIAN_STATES, { error: "Select your state" }),
  pincode: z.string().trim().regex(PINCODE_REGEX, { error: "Enter a valid 6-digit PIN code" }),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const productSchema = z
  .object({
    name: z.string().trim().min(2, { error: "Name is required" }).max(150),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Slug may only contain lowercase letters, numbers and dashes" })
      .max(120),
    category_id: z.uuid({ error: "Choose a category" }),
    description: z.string().trim().max(5000).default(""),
    price_paise: z.number().int().positive({ error: "Price must be greater than ₹0" }),
    mrp_paise: z.number().int().positive().nullable(),
    stock: z.number().int().min(0, { error: "Stock cannot be negative" }).max(100000),
    images: z.array(z.string().trim().min(1)).max(8),
    is_active: z.boolean(),
    is_featured: z.boolean(),
  })
  .refine((p) => p.mrp_paise == null || p.mrp_paise >= p.price_paise, {
    error: "MRP must be greater than or equal to the selling price",
    path: ["mrp_paise"],
  });
export type ProductInput = z.infer<typeof productSchema>;

export const orderStatusSchema = z.enum(ORDER_STATUSES);

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}
