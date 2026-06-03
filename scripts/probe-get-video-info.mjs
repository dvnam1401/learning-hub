import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fileId = process.argv[2] || "11sGyyvTfJMcyWUG9jvoDkzzmH0E-Gx52";

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
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

loadEnv();

const oauth2 = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const { token } = await oauth2.getAccessToken();

const url = `https://docs.google.com/get_video_info?docid=${fileId}&access_token=${token}`;
const res = await fetch(url);
const text = await res.text();
console.log("status", res.status);
const params = new URLSearchParams(text);
console.log("status_param", params.get("status"));
const map = params.get("url_encoded_fmt_stream_map") || params.get("fmt_stream_map");
if (!map) {
  console.log(text.slice(0, 500));
  process.exit(1);
}
const streams = map.split(",");
console.log("streams", streams.length);
for (let i = 0; i < streams.length; i++) {
  const part = streams[i];
  const inner = new URLSearchParams(part);
  console.log("\n#", i, {
    type: inner.get("type"),
    quality: inner.get("quality"),
    width: inner.get("width"),
    height: inner.get("height"),
    size: inner.get("size"),
    itag: inner.get("itag"),
    bitrate: inner.get("bitrate"),
  });
}

const first = map.split(",")[0];
const firstUrl = new URLSearchParams(first.trim()).get("url");
if (firstUrl) {
  const probe = await fetch(firstUrl, {
    headers: { Range: "bytes=0-1023", Referer: "https://drive.google.com/" },
  });
  console.log("\nproxy sample (first stream):", probe.status);
}
