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

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } =
  process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  console.error("Missing GOOGLE_* in .env.local");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
);
oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth: oauth2 });

const fields =
  "id,name,mimeType,size,capabilities,resourceKey,driveId,owners,viewersCanCopyContent,copyRequiresWriterPermission,webViewLink,webContentLink,permissionIds,hasAugmentedPermissions,linkShareMetadata";

async function main() {
  const token = await oauth2.getAccessToken();
  console.log("access_token:", token.token ? "ok" : "missing");

  try {
    const { data: me } = await google
      .oauth2({ version: "v2", auth: oauth2 })
      .userinfo.get();
    console.log("oauth_user:", me.email);
  } catch (e) {
    console.log("oauth_user: (need userinfo scope?)", e.message);
  }

  try {
    const { data } = await drive.files.get({
      fileId,
      supportsAllDrives: true,
      fields,
    });
    console.log("\n=== metadata ===");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("\n=== metadata error ===");
    console.error(err.response?.data || err.message);
  }

  try {
    const res = await drive.files.get(
      {
        fileId,
        alt: "media",
        supportsAllDrives: true,
        acknowledgeAbuse: true,
      },
      { responseType: "stream", headers: { Range: "bytes=0-1023" } }
    );
    let bytes = 0;
    for await (const chunk of res.data) {
      bytes += chunk.length;
      if (bytes >= 1024) break;
    }
    console.log("\n=== media sample ===");
    console.log("ok, bytes:", bytes, "content-type:", res.headers["content-type"]);
  } catch (err) {
    console.error("\n=== media error ===");
    console.error(JSON.stringify(err.response?.data, null, 2));
  }

  try {
    const { data: perms } = await drive.permissions.list({
      fileId,
      supportsAllDrives: true,
      fields: "permissions(type,role,emailAddress,allowFileDiscovery)",
    });
    console.log("\n=== permissions ===");
    console.log(JSON.stringify(perms, null, 2));
  } catch (err) {
    console.error("\n=== permissions error ===");
    console.error(err.response?.data || err.message);
  }
}

main();
