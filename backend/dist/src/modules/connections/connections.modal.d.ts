import { z } from "zod";
export declare const PluginParamSchema: z.ZodObject<{
    plugin: z.ZodEnum<{
        [x: string]: string;
    }>;
}, z.core.$strip>;
export declare const ExchangeAuthCodeSchema: z.ZodObject<{
    authCode: z.ZodString;
}, z.core.$strip>;
export type PluginParam = z.infer<typeof PluginParamSchema>;
export type ExchangeAuthCodeBody = z.infer<typeof ExchangeAuthCodeSchema>;
//# sourceMappingURL=connections.modal.d.ts.map