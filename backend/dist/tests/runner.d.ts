export declare const BASE_URL: string;
export declare function test(label: string, fn: () => Promise<void>): Promise<void>;
export declare function assert(condition: boolean, message: string): void;
export declare function assertStatus(response: Response, expectedStatus: number): Promise<void>;
export declare function json<T>(response: Response): Promise<T>;
export declare function authHeader(token: string): Record<string, string>;
export declare function jsonHeaders(token?: string): Record<string, string>;
export declare function summary(suiteName: string): void;
//# sourceMappingURL=runner.d.ts.map