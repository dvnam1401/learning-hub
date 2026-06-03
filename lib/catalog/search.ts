import MiniSearch from "minisearch";
import { getSearchIndex } from "./reader";
import type { SearchIndexEntry } from "@/lib/types";

let mini: MiniSearch<SearchIndexEntry> | null = null;

function getMiniSearch(): MiniSearch<SearchIndexEntry> {
  if (mini) return mini;
  const docs = getSearchIndex();
  mini = new MiniSearch({
    fields: ["name", "path"],
    storeFields: ["id", "courseId", "type", "name", "path"],
    searchOptions: { boost: { name: 2 } },
  });
  mini.addAll(docs);
  return mini;
}

export function searchCatalog(q: string, limit = 50): SearchIndexEntry[] {
  if (!q.trim()) return [];
  const ms = getMiniSearch();
  return ms
    .search(q, { prefix: true, fuzzy: 0.2 })
    .slice(0, limit)
    .map((r) => ({
      id: String(r.id),
      courseId: String(r.courseId),
      type: r.type as SearchIndexEntry["type"],
      name: String(r.name),
      path: String(r.path),
    }));
}
