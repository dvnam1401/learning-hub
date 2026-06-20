import fs from "fs";
import path from "path";
import { dbGet } from "@/lib/db/client";
import {
  getGoogleAccessToken,
  isDriveConfigured,
} from "@/lib/drive/client";
import { isServiceAccountConfigured } from "@/lib/drive/service-account";
import { getCatalogStats } from "@/lib/catalog/reader";

type CheckResult = {
  ok: boolean;
  message?: string;
  [key: string]: unknown;
};

export type HealthReport = {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  uptime: number;
  checks: {
    jwt: CheckResult;
    database: CheckResult;
    drive: CheckResult;
    catalog: CheckResult;
  };
};

function jwtCheck(): CheckResult {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    return { ok: false, message: "Thiếu JWT_SECRET" };
  }
  if (secret.length < 32) {
    return { ok: false, message: "JWT_SECRET quá ngắn (nên >= 32 ký tự)" };
  }
  return { ok: true };
}

function databaseBackend(): "d1" | "sqlite" {
  const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN } =
    process.env;
  if (
    process.env.VERCEL === "1" ||
    (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_D1_DATABASE_ID && CLOUDFLARE_API_TOKEN)
  ) {
    return "d1";
  }
  return "sqlite";
}

async function databaseCheck(): Promise<CheckResult> {
  const backend = databaseBackend();
  try {
    await dbGet("SELECT 1 AS ok");
    return { ok: true, backend };
  } catch (err) {
    return {
      ok: false,
      backend,
      message: err instanceof Error ? err.message : "Database không phản hồi",
    };
  }
}

async function driveCheck(): Promise<CheckResult> {
  if (!isDriveConfigured()) {
    return { ok: false, mode: "none", message: "Google Drive chưa cấu hình" };
  }

  const mode = isServiceAccountConfigured() ? "service_account" : "oauth";
  try {
    const token = await getGoogleAccessToken();
    return { ok: true, mode, tokenLength: token.length };
  } catch (err) {
    return {
      ok: false,
      mode,
      message: err instanceof Error ? err.message : "Không lấy được access token",
    };
  }
}

function catalogCheck(): CheckResult {
  const indexPath = path.join(process.cwd(), "data", "catalog-index.json");
  if (!fs.existsSync(indexPath)) {
    return { ok: false, message: "Thiếu data/catalog-index.json" };
  }

  const stats = getCatalogStats();
  if (stats.courseCount <= 0) {
    return { ok: false, message: "Catalog rỗng", ...stats };
  }

  return { ok: true, ...stats };
}

export async function getHealthReport(): Promise<HealthReport> {
  const jwt = jwtCheck();
  const database = await databaseCheck();
  const drive = await driveCheck();
  const catalog = catalogCheck();

  const criticalOk = jwt.ok && database.ok;
  const allOk = criticalOk && drive.ok && catalog.ok;

  return {
    status: !criticalOk ? "down" : allOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    checks: { jwt, database, drive, catalog },
  };
}

export function healthHttpStatus(report: HealthReport): number {
  return report.status === "down" ? 503 : 200;
}
