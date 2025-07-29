import { z } from "zod";
export const userSchema = z.object({
    name: z
        .string()
        .min(2, "Name is required")
        .max(100, "Name must be less than 100 characters"),
    email: z.string().email("Invalid email address"),
    role: z.enum(["INTERN", "SUPERVISOR"]).optional().refine(val => val, {
        message: "Role is required",
    }),
    image: z.string().optional(),
});