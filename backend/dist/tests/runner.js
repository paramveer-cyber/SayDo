export const BASE_URL = process.env.API_URL ?? "http://localhost:3000";
let passed = 0;
let failed = 0;
export async function test(label, fn) {
    try {
        await fn();
        console.log(`  ✓ ${label}`);
        passed++;
    }
    catch (error) {
        console.error(`  ✗ ${label}`);
        console.error(`    ${error.message}`);
        failed++;
    }
}
export function assert(condition, message) {
    if (!condition)
        throw new Error(message);
}
export async function assertStatus(response, expectedStatus) {
    if (response.status !== expectedStatus) {
        const body = await response.text().catch(() => "(unreadable body)");
        throw new Error(`Expected status ${expectedStatus}, got ${response.status}. Body: ${body}`);
    }
}
export async function json(response) {
    const text = await response.text();
    try {
        return JSON.parse(text);
    }
    catch {
        throw new Error(`Response is not JSON: ${text}`);
    }
}
export function authHeader(token) {
    return { Authorization: `Bearer ${token}` };
}
export function jsonHeaders(token) {
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}
export function summary(suiteName) {
    const total = passed + failed;
    console.log(`\n${suiteName}: ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ""}\n`);
    if (failed > 0)
        process.exitCode = 1;
    passed = 0;
    failed = 0;
}
//# sourceMappingURL=runner.js.map