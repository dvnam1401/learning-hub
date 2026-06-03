import bcrypt from "bcryptjs";
import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const dbPath = path.join(ROOT, "data", "app.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const migration = fs.readFileSync(
  path.join(ROOT, "migrations", "0001_init.sql"),
  "utf8"
);

const db = new DatabaseSync(dbPath);
db.exec(migration);

const adminId = randomUUID();
const userId = randomUUID();
const adminHash = bcrypt.hashSync("admin123", 10);
const userHash = bcrypt.hashSync("user123", 10);

db.prepare(
  `INSERT OR REPLACE INTO users (id, username, password_hash, role, status, display_name)
   VALUES (?, ?, ?, ?, ?, ?)`
).run(adminId, "admin", adminHash, "ADMIN", "active", "Administrator");

db.prepare(
  `INSERT OR REPLACE INTO users (id, username, password_hash, role, status, display_name)
   VALUES (?, ?, ?, ?, ?, ?)`
).run(userId, "student", userHash, "USER", "active", "Học viên Demo");

console.log("Seed complete:");
console.log("  admin / admin123");
console.log("  student / user123");

db.close();
