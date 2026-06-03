import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import path from "path";
import fs from "fs";

type Row = Record<string, unknown>;

function sqlParams(params: unknown[]): SQLInputValue[] {
  return params as SQLInputValue[];
}

let sqlite: DatabaseSync | null = null;

function getSqlite(): DatabaseSync {
  if (sqlite) return sqlite;
  const dbPath = path.join(process.cwd(), "data", "app.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  sqlite = new DatabaseSync(dbPath);
  sqlite.exec("PRAGMA journal_mode = WAL");
  sqlite.exec("PRAGMA foreign_keys = ON");
  return sqlite;
}

function cloudflareEnv() {
  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID?.trim(),
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID?.trim(),
    token: process.env.CLOUDFLARE_API_TOKEN?.trim(),
  };
}

function hasCloudflareEnv(): boolean {
  const { accountId, databaseId, token } = cloudflareEnv();
  return Boolean(accountId && databaseId && token);
}

async function queryRemote<T extends Row>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const { accountId, databaseId, token } = cloudflareEnv();

  if (!accountId || !databaseId || !token) {
    throw new Error("Cloudflare D1 credentials not configured");
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    }
  );

  const raw = await res.text();
  let json: {
    success: boolean;
    result?: Array<{ results: T[] }>;
    errors?: Array<{ message: string }>;
  };
  try {
    json = JSON.parse(raw) as typeof json;
  } catch {
    throw new Error(`D1 HTTP ${res.status}: invalid response`);
  }

  if (!res.ok || !json.success) {
    const msg =
      json.errors?.[0]?.message ?? `D1 HTTP ${res.status}: query failed`;
    throw new Error(msg);
  }
  return json.result?.[0]?.results ?? [];
}

function useRemote(): boolean {
  return hasCloudflareEnv();
}

function assertDbBackend(): void {
  if (process.env.VERCEL === "1" && !hasCloudflareEnv()) {
    throw new Error(
      "Vercel production requires CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN"
    );
  }
}

export async function dbQuery<T extends Row = Row>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  assertDbBackend();
  if (useRemote()) {
    return queryRemote<T>(sql, params);
  }

  const db = getSqlite();
  const stmt = db.prepare(sql);
  const bindings = sqlParams(params);
  if (sql.trim().toLowerCase().startsWith("select")) {
    return stmt.all(...bindings) as T[];
  }
  stmt.run(...bindings);
  return [];
}

export async function dbRun(
  sql: string,
  params: unknown[] = []
): Promise<void> {
  await dbQuery(sql, params);
}

export async function dbGet<T extends Row = Row>(
  sql: string,
  params: unknown[] = []
): Promise<T | undefined> {
  const rows = await dbQuery<T>(sql, params);
  return rows[0];
}

export function newId(): string {
  return crypto.randomUUID();
}

export function initLocalDb(): void {
  const migrationPath = path.join(
    process.cwd(),
    "migrations",
    "0001_init.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf8");
  getSqlite().exec(sql);
}
