import { z } from "zod";
export const RegisterSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name too long").trim(),
    email: z.email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password too long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
});
export const LoginSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});
export const GoogleAuthSchema = z.object({
    idToken: z.string().min(1, "ID token is required"),
});
//# sourceMappingURL=auth.modal.js.map