import { spawnSync } from "child_process";
import { randomBytes } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnvLocal } from "./lib/load-env.mjs";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const targets = ["production", "preview"];

function setVercelEnv(name, value, target) {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", name, target, "--force", "--yes"],
    { input: value, cwd: rootDir, encoding: "utf8", shell: true }
  );
  if (result.status !== 0) {
    throw new Error(
      `Failed to set ${name} (${target}): ${result.stderr || result.stdout}`
    );
  }
  console.log(`OK ${name} -> ${target}`);
}

loadEnvLocal(rootDir);

const jwtSecret = randomBytes(32).toString("hex");
const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
const serviceKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();

if (!serviceEmail || !serviceKey) {
  console.error(
    "Thiếu GOOGLE_SERVICE_ACCOUNT_EMAIL hoặc GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY trong .env.local"
  );
  process.exit(1);
}

for (const target of targets) {
  setVercelEnv("JWT_SECRET", jwtSecret, target);
  setVercelEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", serviceEmail, target);
  setVercelEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", serviceKey, target);
}

console.log("Done. Redeploy Vercel để env có hiệu lực.");
