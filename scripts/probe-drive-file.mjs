import { google } from "googleapis";
import { loadEnvLocal } from "./lib/load-env.mjs";
import { createGoogleAuth } from "./lib/google-auth.mjs";

const fileId = process.argv[2] || "11sGyyvTfJMcyWUG9jvoDkzzmH0E-Gx52";

loadEnvLocal();

const auth = createGoogleAuth();
if (!auth) {
  console.error("Thiếu GOOGLE_SERVICE_ACCOUNT_* hoặc GOOGLE_* OAuth trong .env.local");
  process.exit(1);
}

console.log("auth:", auth.mode, auth.email ?? "");
const drive = google.drive({ version: "v3", auth: auth.client });

const fields =
  "id,name,mimeType,size,capabilities,resourceKey,driveId,owners,viewersCanCopyContent,copyRequiresWriterPermission,webViewLink,webContentLink,permissionIds,hasAugmentedPermissions,linkShareMetadata";

async function main() {
  const token = await auth.client.getAccessToken();
  console.log("access_token:", token.token ? "ok" : "missing");

  if (auth.mode === "oauth") {
    try {
      const { data: me } = await google
        .oauth2({ version: "v2", auth: auth.client })
        .userinfo.get();
      console.log("oauth_user:", me.email);
    } catch (e) {
      console.log("oauth_user: (need userinfo scope?)", e.message);
    }
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
