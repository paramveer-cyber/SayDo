export const BASE_URL = process.env.API_URL ?? "http://localhost:3000";

let passed = 0;
let failed = 0;

export async function test(
  label: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (error) {
    console.error(`  ✗ ${label}`);
    console.error(`    ${(error as Error).message}`);
    failed++;
  }
}

export function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export async function assertStatus(
  response: Response,
  expectedStatus: number,
): Promise<void> {
  if (response.status !== expectedStatus) {
    const body = await response.text().catch(() => "(unreadable body)");
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}. Body: ${body}`,
    );
  }
}

export async function json<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Response is not JSON: ${text}`);
  }
}

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function jsonHeaders(token?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function summary(suiteName: string): void {
  const total = passed + failed;
  console.log(`\n${suiteName}: ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ""}\n`);
  if (failed > 0) process.exitCode = 1;
  passed = 0;
  failed = 0;
}
