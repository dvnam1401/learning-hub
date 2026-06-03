import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CACHE_DIR = path.join(ROOT, "data", "video-cache");
const COURSES_DIR = path.join(ROOT, "data", "courses");
const onlyId = process.argv[2];

function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

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

loadEnv();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } =
  process.env;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  console.error("Thiếu GOOGLE_* trong .env.local");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
);
oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth: oauth2 });

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
