/**
 * build-catalog.mjs  —  PATCHED v2
 * Replace: scripts/build-catalog.mjs
 *
 * Root cause fixes:
 *
 * BUG 1 — Videos from multiple sub-courses mixed in one playlist
 *   Old: COURSE_PATH_DEPTH=4 groups "0. Tặng kèm" (which contains 4 separate
 *        TOEIC courses) as ONE course → flattenVideos() walks all 233 videos
 *        from 4 unrelated courses into one sidebar list.
 *   Fix: Auto-detect course boundaries via findCourseBoundaries().
 *        A folder is a course when it DIRECTLY contains videos, OR
 *        its immediate sub-folders directly contain videos (chapter→lesson).
 *        Parent folders that bundle multiple courses become CATEGORY nodes only.
 *
 * BUG 2 — Videos sorted randomly inside each course
 *   Old: buildTree() inserts children in NDJSON read order (random).
 *   Fix: naturalSort() applied at every level — folders first, then videos,
 *        each group sorted numerically ("Bài 2" < "Bài 10").
 *
 * BUG 3 — Google Drive shortcuts appear as broken "video" entries
 *   Old: isVideo() matched mimeType startsWith("video/") only.
 *   Fix: Exclude application/vnd.google-apps.shortcut explicitly.
 */

import fs from "fs";
import zlib from "zlib";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");
const NDJSON_PATH =
  process.env.DRIVE_NDJSON_PATH ||
  path.resolve(ROOT, "../drive_scaner/output/drive.ndjson");
const OUT_DIR     = path.join(ROOT, "data");
const COURSES_DIR = path.join(OUT_DIR, "courses");

// ── Helpers ──────────────────────────────────────────────────────────────────

function isVideo(r) {
  return (
    r.mimeType?.startsWith("video/") &&
    r.mimeType !== "application/vnd.google-apps.shortcut"
  );
}

// Natural sort: "Bài 2" < "Bài 10", "003" < "010" < "017"
function naturalKey(name) {
  return name
    .replace(/\.[^.]+$/, "")          // strip extension
    .split(/(\d+)/)
    .map((s) => (/^\d+$/.test(s) ? s.padStart(20, "0") : s.toLowerCase()))
    .join("\x00");
}

function naturalSort(a, b) {
  return naturalKey(a.name).localeCompare(naturalKey(b.name), "vi");
}

// Sort children: folders first → videos second, each group natural-sorted
function sortedKids(kids) {
  const folders = kids.filter((k) => k.isFolder).sort(naturalSort);
  const videos  = kids.filter((k) => isVideo(k)).sort(naturalSort);
  return [...folders, ...videos];
}

async function streamNdjson(filePath, onRecord) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    onRecord(JSON.parse(line));
  }
  rl.close();
}

// ── Course boundary detection ─────────────────────────────────────────────────
//
// Walk the tree top-down. At each folder, decide:
//   COURSE  — this folder is a self-contained course (collect it, stop recursing)
//   RECURSE — this folder is a container; go deeper to find real courses
//
// Decision rules (in order):
//   1. Folder has direct video children → COURSE
//      (it may also have sub-folders for "tài liệu", "bonus", etc — all fine)
//   2. Folder has only sub-folders AND every sub-folder with videos
//      has the same naming "style" (chapter-like: numbered, uniform prefix)
//      → COURSE  (the sub-folders are chapters, not independent courses)
//   3. Otherwise → RECURSE into each sub-folder independently

const CHAPTER_LIKE_RE = /^(\d+[\.\-\s]|bài\s*\d+|chương\s*\d+|phần\s*\d+|section\s*\d+|module\s*\d+|lesson\s*\d+|week\s*\d+)/i;

function looksLikeChapter(name) {
  return CHAPTER_LIKE_RE.test(name.trim());
}

// Returns Set of folder IDs that are course boundaries
function findCourseBoundaries(rootIds, childrenMap, byId) {
  const courseIds = new Set();

  function walk(fid) {
    const kids    = childrenMap.get(fid) || [];
    const folders = kids.filter((k) => k.isFolder);
    const videos  = kids.filter((k) => isVideo(k));

    // Rule 1: direct videos → this is the course
    if (videos.length > 0) {
      courseIds.add(fid);
      return;
    }

    // No videos, no folders → empty, skip
    if (folders.length === 0) return;

    // Filter to folders that actually contain video descendants
    const videoFolders = folders.filter((f) => hasVideoDescendant(f.id, childrenMap));
    if (videoFolders.length === 0) return;

    // Rule 2: sub-folders are chapters of one course (each chapter has direct videos)
    const chapterLike = videoFolders.filter((f) => looksLikeChapter(f.name));
    const chapterRatio = chapterLike.length / videoFolders.length;
    const allHaveDirectVideos = videoFolders.every((f) =>
      (childrenMap.get(f.id) || []).some((k) => isVideo(k))
    );

    if (
      chapterRatio >= 0.6 &&
      videoFolders.length >= 2 &&
      allHaveDirectVideos
    ) {
      courseIds.add(fid);
      return;
    }

    // Rule 3: sub-folders are independent courses → recurse into each
    for (const f of videoFolders) {
      walk(f.id);
    }
  }

  for (const rid of rootIds) {
    walk(rid);
  }

  return courseIds;
}

// Memoized: does folder `id` have any video descendant?
const _videoMemo = new Map();
function hasVideoDescendant(id, childrenMap) {
  if (_videoMemo.has(id)) return _videoMemo.get(id);
  const kids = childrenMap.get(id) || [];
  let result = kids.some((k) => isVideo(k));
  if (!result) {
    for (const k of kids) {
      if (k.isFolder && hasVideoDescendant(k.id, childrenMap)) {
        result = true;
        break;
      }
    }
  }
  _videoMemo.set(id, result);
  return result;
}

// ── Build course tree ─────────────────────────────────────────────────────────

function buildTree(node, childrenMap) {
  const kids    = childrenMap.get(node.id) || [];
  const sorted  = sortedKids(kids);
  const folders = sorted.filter((k) => k.isFolder);
  const videos  = sorted.filter((k) => isVideo(k));

  // Leaf lesson: only videos, no sub-folders
  if (videos.length > 0 && folders.length === 0) {
    return {
      id: node.id, name: node.name, type: "lesson",
      parentId: node.parentId || null,
      children: videos.map((v) => ({
        id: v.id, name: v.name, type: "video",
        parentId: node.id, fileId: v.id, mimeType: v.mimeType, children: [],
      })),
    };
  }

  const childNodes = [];
  for (const f of folders) childNodes.push(buildTree(f, childrenMap));
  for (const v of videos) {
    childNodes.push({
      id: v.id, name: v.name, type: "video",
      parentId: node.id, fileId: v.id, mimeType: v.mimeType, children: [],
    });
  }

  return {
    id: node.id, name: node.name,
    type: childNodes.some((c) => c.type === "video") ? "lesson" : "chapter",
    parentId: node.parentId || null,
    children: childNodes,
  };
}

function countVideos(node) {
  if (node.type === "video") return 1;
  return node.children.reduce((s, c) => s + countVideos(c), 0);
}

function collectSearchEntries(node, courseId, entries, prefix) {
  entries.push({
    id: node.id, courseId,
    type: node.type === "video" ? "video" : node.type,
    name: node.name, path: `${prefix}/${node.name}`,
  });
  for (const c of node.children) {
    collectSearchEntries(c, courseId, entries, `${prefix}/${node.name}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Reading NDJSON:", NDJSON_PATH);
  if (!fs.existsSync(NDJSON_PATH)) {
    console.error("NDJSON not found:", NDJSON_PATH);
    process.exit(1);
  }

  const byId        = new Map();
  const childrenMap = new Map();

  await streamNdjson(NDJSON_PATH, (record) => {
    byId.set(record.id, record);
    if (record.parentId) {
      if (!childrenMap.has(record.parentId)) childrenMap.set(record.parentId, []);
      const list = childrenMap.get(record.parentId);
      const idx  = list.findIndex((x) => x.id === record.id);
      if (idx === -1) list.push(record);
      else list[idx] = record;
    }
  });

  console.log("Records loaded:", byId.size);

  // Find root-level folders (no parent, or parent not in dataset)
  const rootIds = [...byId.values()]
    .filter((r) => r.isFolder && (!r.parentId || !byId.has(r.parentId)))
    .map((r) => r.id);

  console.log("Root folders:", rootIds.length);

  // Detect course boundaries
  const courseIds = findCourseBoundaries(rootIds, childrenMap, byId);
  console.log("Courses detected:", courseIds.size);

  if (fs.existsSync(COURSES_DIR)) {
    for (const f of fs.readdirSync(COURSES_DIR)) fs.unlinkSync(path.join(COURSES_DIR, f));
  }
  fs.mkdirSync(COURSES_DIR, { recursive: true });

  const catalogIndex = [];
  const searchIndex  = [];
  let totalVideos    = 0;

  for (const courseId of courseIds) {
    const courseNode = byId.get(courseId);
    if (!courseNode) continue;

    const tree       = buildTree(courseNode, childrenMap);
    const videoCount = countVideos(tree);
    if (videoCount === 0) continue;   // skip empty courses
    totalVideos += videoCount;

    const pathParts = (courseNode.path || "").split("/").filter(Boolean);

    catalogIndex.push({
      id:           courseId,
      name:         courseNode.name,
      path:         courseNode.path,
      videoCount,
      rootSource:   courseNode.rootSource,
      categoryPath: pathParts.slice(0, 3).join("/"),
    });

    fs.writeFileSync(
      path.join(COURSES_DIR, `${courseId}.json`),
      JSON.stringify(tree)
    );

    searchIndex.push({ id: courseId, courseId, type: "course", name: courseNode.name, path: courseNode.path });
    collectSearchEntries(tree, courseId, searchIndex, courseNode.name);
  }

  // Sort catalog by path (category → subcategory → course name, natural order)
  catalogIndex.sort((a, b) => {
    const pa = a.path || ""; const pb = b.path || "";
    if (pa !== pb) return naturalKey(pa).localeCompare(naturalKey(pb), "vi");
    return naturalKey(a.name).localeCompare(naturalKey(b.name), "vi");
  });

  fs.writeFileSync(path.join(OUT_DIR, "catalog-index.json"), JSON.stringify(catalogIndex));

  const searchJson  = JSON.stringify(searchIndex);
  const searchPath  = path.join(OUT_DIR, "search-index.json");
  const searchGzPath = path.join(OUT_DIR, "search-index.json.gz");
  fs.writeFileSync(searchPath, searchJson);
  fs.writeFileSync(searchGzPath, zlib.gzipSync(searchJson));
  console.log(
    "search-index:",
    (fs.statSync(searchPath).size / 1024 / 1024).toFixed(2), "MB →",
    (fs.statSync(searchGzPath).size / 1024 / 1024).toFixed(2), "MB gzip"
  );

  fs.writeFileSync(
    path.join(OUT_DIR, "catalog-stats.json"),
    JSON.stringify({ courseCount: catalogIndex.length, videoCount: totalVideos, builtAt: new Date().toISOString() })
  );

  console.log("Done:", catalogIndex.length, "courses,", totalVideos, "videos");
}

main().catch((err) => { console.error(err); process.exit(1); });
