import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));

const suites = [
  "auth.test.ts",
  "gmail.test.ts",
  "calendar.test.ts",
  "ai.test.ts",
  "webhooks.test.ts",
  "settings.test.ts",
  "command-center.test.ts",
  "razorpay.test.ts",
];

console.log("=== Running all test suites ===\n");

let anyFailed = false;

for (const suite of suites) {
  const result = spawnSync("npx", ["tsx", resolve(directory, suite)], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) anyFailed = true;
}

console.log("\n=== Done ===");
if (anyFailed) process.exit(1);
