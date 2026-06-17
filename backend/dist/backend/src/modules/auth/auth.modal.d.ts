import { z } from "zod";
export declare const RegisterSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
}, z.core.$strip>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
}, z.core.$strip>;
export declare const GoogleAuthSchema: z.ZodObject<{
    idToken: z.ZodString;
}, z.core.$strip>;
export type RegisterBody = z.infer<typeof RegisterSchema>;
export type LoginBody = z.infer<typeof LoginSchema>;
export type GoogleAuthBody = z.infer<typeof GoogleAuthSchema>;
//# sourceMappingURL=auth.modal.d.ts.map