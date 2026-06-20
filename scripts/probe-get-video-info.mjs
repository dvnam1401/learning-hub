import { loadEnvLocal } from "./lib/load-env.mjs";
import { getGoogleAccessToken } from "./lib/google-auth.mjs";

const fileId = process.argv[2] || "11sGyyvTfJMcyWUG9jvoDkzzmH0E-Gx52";

loadEnvLocal();

const { token, mode } = await getGoogleAccessToken();
console.log("auth:", mode);

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
