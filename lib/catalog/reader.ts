import fs from "fs";
import zlib from "zlib";
import path from "path";
import type {
  CatalogCourse,
  CourseTreeNode,
  SearchIndexEntry,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");

export function getCatalogIndex(): CatalogCourse[] {
  const file = path.join(DATA_DIR, "catalog-index.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8")) as CatalogCourse[];
}

export function getCatalogStats(): {
  courseCount: number;
  videoCount: number;
} {
  const file = path.join(DATA_DIR, "catalog-stats.json");
  if (!fs.existsSync(file)) {
    const index = getCatalogIndex();
    return {
      courseCount: index.length,
      videoCount: index.reduce((s, c) => s + c.videoCount, 0),
    };
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function getCourseTree(courseId: string): CourseTreeNode | null {
  const file = path.join(DATA_DIR, "courses", `${courseId}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as CourseTreeNode;
}

export function getSearchIndex(): SearchIndexEntry[] {
  const jsonFile = path.join(DATA_DIR, "search-index.json");
  if (fs.existsSync(jsonFile)) {
    return JSON.parse(fs.readFileSync(jsonFile, "utf8")) as SearchIndexEntry[];
  }
  const gzFile = path.join(DATA_DIR, "search-index.json.gz");
  if (fs.existsSync(gzFile)) {
    const raw = zlib.gunzipSync(fs.readFileSync(gzFile));
    return JSON.parse(raw.toString("utf8")) as SearchIndexEntry[];
  }
  return [];
}

export function findCourseInIndex(
  courseId: string
): CatalogCourse | undefined {
  return getCatalogIndex().find((c) => c.id === courseId);
}

export function flattenVideos(
  node: CourseTreeNode,
  courseId: string
): Array<{ id: string; name: string; courseId: string }> {
  const out: Array<{ id: string; name: string; courseId: string }> = [];
  const walk = (n: CourseTreeNode) => {
    if (n.type === "video" && n.fileId) {
      out.push({ id: n.fileId, name: n.name, courseId });
    }
    for (const c of n.children) walk(c);
  };
  walk(node);
  return out;
}

export function getNextVideoId(
  tree: CourseTreeNode,
  currentVideoId: string
): string | null {
  const videos = flattenVideos(tree, "");
  const idx = videos.findIndex((v) => v.id === currentVideoId);
  if (idx === -1 || idx >= videos.length - 1) return null;
  return videos[idx + 1].id;
}
