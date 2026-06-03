import fs from "fs";
import zlib from "zlib";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(ROOT, "data", "search-index.json");
const dst = path.join(ROOT, "data", "search-index.json.gz");

if (!fs.existsSync(src)) {
  console.error("Missing data/search-index.json — run npm run build:catalog first");
  process.exit(1);
}

const json = fs.readFileSync(src);
fs.writeFileSync(dst, zlib.gzipSync(json));
const mb = (n) => (n / 1024 / 1024).toFixed(2);
console.log(`OK: ${mb(src.length)} MB -> ${mb(fs.statSync(dst).size)} MB (${dst})`);
