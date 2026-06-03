import fs from "fs";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const NDJSON_PATH =
  process.env.DRIVE_NDJSON_PATH ||
  path.resolve(ROOT, "../drive_scaner/output/drive.ndjson");
const OUT_DIR = path.join(ROOT, "data");
const COURSES_DIR = path.join(OUT_DIR, "courses");
const COURSE_PATH_DEPTH = Number(process.env.COURSE_PATH_DEPTH || 4);

function isVideo(record) {
  return record.mimeType?.startsWith("video/");
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

function hasVideoDescendant(id, childrenMap, memo) {
  if (memo.has(id)) return memo.get(id);
  const kids = childrenMap.get(id) || [];
  let result = kids.some((k) => isVideo(k));
  if (!result) {
    for (const k of kids) {
      if (k.isFolder && hasVideoDescendant(k.id, childrenMap, memo)) {
        result = true;
        break;
      }
    }
  }
  memo.set(id, result);
  return result;
}

function getCourseIdForVideo(video, byId, pathByFullPath) {
  const parts = video.path.split("/").filter(Boolean);
  if (parts.length >= COURSE_PATH_DEPTH) {
    const coursePath = parts.slice(0, COURSE_PATH_DEPTH).join("/");
    const found = pathByFullPath.get(coursePath);
    if (found) return found;
  }

  let cur = byId.get(video.parentId);
  const videoMemo = new Map();
  let deepest = null;
  while (cur?.isFolder) {
    if (hasVideoDescendant(cur.id, childrenMap, videoMemo)) {
      deepest = cur.id;
    }
    cur = byId.get(cur.parentId);
  }
  return deepest;
}

let childrenMap;

function buildTree(node, map) {
  const kids = map.get(node.id) || [];
  const folders = kids.filter((k) => k.isFolder);
  const videos = kids.filter((k) => isVideo(k));

  if (videos.length > 0 && folders.length === 0) {
    return {
      id: node.id,
      name: node.name,
      type: "lesson",
      parentId: node.parentId || null,
      children: videos.map((v) => ({
        id: v.id,
        name: v.name,
        type: "video",
        parentId: node.id,
        fileId: v.id,
        mimeType: v.mimeType,
        children: [],
      })),
    };
  }

  const childNodes = [];
  for (const f of folders) {
    childNodes.push(buildTree(f, map));
  }
  for (const v of videos) {
    childNodes.push({
      id: v.id,
      name: v.name,
      type: "video",
      parentId: node.id,
      fileId: v.id,
      mimeType: v.mimeType,
      children: [],
    });
  }

  return {
    id: node.id,
    name: node.name,
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
    id: node.id,
    courseId,
    type: node.type === "video" ? "video" : node.type,
    name: node.name,
    path: `${prefix}/${node.name}`,
  });
  for (const c of node.children) {
    collectSearchEntries(c, courseId, entries, `${prefix}/${node.name}`);
  }
}

async function main() {
  console.log("Reading NDJSON:", NDJSON_PATH);
  if (!fs.existsSync(NDJSON_PATH)) {
    console.error("NDJSON not found:", NDJSON_PATH);
    process.exit(1);
  }

  const byId = new Map();
  childrenMap = new Map();
  const pathByFullPath = new Map();

  await streamNdjson(NDJSON_PATH, (record) => {
    byId.set(record.id, record);
    if (record.isFolder && record.path) {
      pathByFullPath.set(record.path, record.id);
    }
    if (record.parentId) {
      if (!childrenMap.has(record.parentId)) {
        childrenMap.set(record.parentId, []);
      }
      const list = childrenMap.get(record.parentId);
      const idx = list.findIndex((x) => x.id === record.id);
      if (idx === -1) list.push(record);
      else list[idx] = record;
    }
  });

  console.log("Records loaded:", byId.size);

  const courseIds = new Set();
  const videos = [...byId.values()].filter(isVideo);

  for (const video of videos) {
    const cid = getCourseIdForVideo(video, byId, pathByFullPath);
    if (cid) courseIds.add(cid);
  }

  console.log("Courses detected:", courseIds.size);

  if (fs.existsSync(COURSES_DIR)) {
    for (const f of fs.readdirSync(COURSES_DIR)) {
      fs.unlinkSync(path.join(COURSES_DIR, f));
    }
  }
  fs.mkdirSync(COURSES_DIR, { recursive: true });

  const catalogIndex = [];
  const searchIndex = [];
  let totalVideos = 0;

  for (const courseId of courseIds) {
    const courseNode = byId.get(courseId);
    if (!courseNode) continue;

    const tree = buildTree(courseNode, childrenMap);
    const videoCount = countVideos(tree);
    totalVideos += videoCount;

    catalogIndex.push({
      id: courseId,
      name: courseNode.name,
      path: courseNode.path,
      videoCount,
      rootSource: courseNode.rootSource,
      categoryPath: courseNode.path.split("/").slice(0, 3).join("/"),
    });

    fs.writeFileSync(
      path.join(COURSES_DIR, `${courseId}.json`),
      JSON.stringify(tree)
    );

    searchIndex.push({
      id: courseId,
      courseId,
      type: "course",
      name: courseNode.name,
      path: courseNode.path,
    });
    collectSearchEntries(tree, courseId, searchIndex, courseNode.name);
  }

  catalogIndex.sort((a, b) => a.name.localeCompare(b.name, "vi"));

  fs.writeFileSync(
    path.join(OUT_DIR, "catalog-index.json"),
    JSON.stringify(catalogIndex)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "search-index.json"),
    JSON.stringify(searchIndex)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "catalog-stats.json"),
    JSON.stringify({
      courseCount: catalogIndex.length,
      videoCount: totalVideos,
      builtAt: new Date().toISOString(),
    })
  );

  console.log("Done:", catalogIndex.length, "courses,", totalVideos, "videos");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
