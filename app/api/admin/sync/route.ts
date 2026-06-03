import { spawn } from "child_process";
import path from "path";
import { getSession } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getCatalogStats } from "@/lib/catalog/reader";
import { dbRun, newId } from "@/lib/db/client";

export async function POST() {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const logId = newId();
  const started = new Date().toISOString();

  await dbRun(
    `INSERT INTO sync_logs (id, started_at, status) VALUES (?, ?, 'running')`,
    [logId, started]
  );

  const script = path.join(process.cwd(), "scripts", "build-catalog.mjs");

  await new Promise<void>((resolve, reject) => {
    const child = spawn("node", [script], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error("build failed"))));
    child.on("error", reject);
  }).catch(async (err) => {
    await dbRun(
      `UPDATE sync_logs SET finished_at = datetime('now'), status = 'failed', message = ? WHERE id = ?`,
      [String(err), logId]
    );
    return jsonError("Đồng bộ thất bại. Chạy npm run build:catalog local.");
  });

  const stats = getCatalogStats();
  const finished = new Date().toISOString();

  await dbRun(
    `UPDATE sync_logs SET finished_at = ?, status = 'success', courses_count = ?, videos_count = ?, message = ? WHERE id = ?`,
    [finished, stats.courseCount, stats.videoCount, "OK", logId]
  );

  await dbRun(
    `INSERT INTO settings (key, value) VALUES ('last_catalog_build', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [finished]
  );

  return jsonOk({ ok: true, stats });
}

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const { dbQuery } = await import("@/lib/db/client");
  const logs = await dbQuery(
    "SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 20"
  );
  const setting = await dbQuery(
    "SELECT value FROM settings WHERE key = 'last_catalog_build'"
  );

  return jsonOk({
    lastBuild: setting[0]?.value ?? null,
    stats: getCatalogStats(),
    logs,
  });
}
