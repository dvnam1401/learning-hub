import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import { loadEnvLocal } from "./lib/load-env.mjs";
import { createGoogleAuth } from "./lib/google-auth.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CACHE_DIR = path.join(ROOT, "data", "video-cache");
const COURSES_DIR = path.join(ROOT, "data", "courses");
const onlyId = process.argv[2];

function collectVideoIds(node, out) {
  if (node.type === "video" && node.fileId) out.add(node.fileId);
  for (const c of node.children || []) collectVideoIds(c, out);
}

function walkCourses() {
  const ids = new Set();
  if (!fs.existsSync(COURSES_DIR)) return ids;
  for (const f of fs.readdirSync(COURSES_DIR)) {
    if (!f.endsWith(".json")) continue;
    const tree = JSON.parse(
      fs.readFileSync(path.join(COURSES_DIR, f), "utf8")
    );
    collectVideoIds(tree, ids);
  }
  return ids;
}

loadEnvLocal(ROOT);

const auth = createGoogleAuth();
if (!auth) {
  console.error("Thiếu GOOGLE_SERVICE_ACCOUNT_* hoặc GOOGLE_* OAuth trong .env.local");
  process.exit(1);
}

console.log("auth:", auth.mode, auth.email ?? "");
const drive = google.drive({ version: "v3", auth: auth.client });

async function downloadOne(fileId) {
  const outPath = path.join(CACHE_DIR, `${fileId}.mp4`);
  if (fs.existsSync(outPath)) {
    console.log("skip (cached):", fileId);
    return "cached";
  }

  const { data: meta } = await drive.files.get({
    fileId,
    supportsAllDrives: true,
    fields: "id,name,capabilities,resourceKey,owners",
  });

  if (meta.capabilities?.canDownload === false) {
    const owner = meta.owners?.[0]?.emailAddress ?? "?";
    console.error(
      "blocked:",
      fileId,
      meta.name,
      "| owner:",
      owner,
      "| OAuth account cannot download — use owner refresh_token"
    );
    return "blocked";
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const headers = {};
  if (meta.resourceKey) {
    headers["X-Goog-Drive-Resource-Keys"] = `${fileId}/${meta.resourceKey}`;
  }

  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true, acknowledgeAbuse: true },
    { responseType: "stream", headers }
  );

  await new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(outPath);
    res.data.on("error", reject);
    ws.on("error", reject);
    ws.on("finish", resolve);
    res.data.pipe(ws);
  });

  console.log("cached:", fileId, meta.name);
  return "ok";
}

const ids = onlyId ? new Set([onlyId]) : walkCourses();
console.log("Videos to process:", ids.size);

let ok = 0;
let blocked = 0;
let cached = 0;
let failed = 0;

for (const fileId of ids) {
  try {
    const r = await downloadOne(fileId);
    if (r === "ok") ok++;
    else if (r === "blocked") blocked++;
    else if (r === "cached") cached++;
  } catch (err) {
    failed++;
    console.error("fail:", fileId, err.response?.data?.error?.message || err.message);
  }
}

console.log("\nDone:", { ok, cached, blocked, failed });
