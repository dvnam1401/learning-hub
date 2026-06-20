import fs from "fs";
import http from "http";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { google } from "googleapis";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DRIVE_SCANER = path.resolve(ROOT, "..", "drive_scaner");
const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

function loadEnvLocal() {
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

function loadCredentials() {
  const credPath = path.join(DRIVE_SCANER, "credentials.json");
  if (fs.existsSync(credPath)) {
    const credentials = JSON.parse(fs.readFileSync(credPath, "utf8"));
    const key = credentials.installed || credentials.web;
    if (!key) throw new Error("credentials.json thiếu installed hoặc web");
    return {
      clientId: key.client_id,
      clientSecret: key.client_secret,
      redirectUri: key.redirect_uris?.[0] ?? "http://127.0.0.1:8888",
      tokenPath: path.join(DRIVE_SCANER, "token.json"),
    };
  }

  loadEnvLocal();
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Thiếu credentials.json (drive_scaner) hoặc GOOGLE_CLIENT_ID/SECRET trong .env.local"
    );
  }
  return {
    clientId,
    clientSecret,
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? "http://127.0.0.1:8888",
    tokenPath: path.join(DRIVE_SCANER, "token.json"),
  };
}

function upsertEnvLocal(refreshToken) {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return false;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  let found = false;
  const next = lines.map((line) => {
    if (!line.startsWith("GOOGLE_REFRESH_TOKEN=")) return line;
    found = true;
    return `GOOGLE_REFRESH_TOKEN=${refreshToken}`;
  });
  if (!found) next.push(`GOOGLE_REFRESH_TOKEN=${refreshToken}`);
  fs.writeFileSync(envPath, next.join("\n"), "utf8");
  return true;
}

function findPidOnPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr ":${port}"`, {
        encoding: "utf8",
      });
      for (const line of out.split("\n")) {
        if (!line.includes("LISTENING")) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) return Number(pid);
      }
      return null;
    }
    const out = execSync(`lsof -ti :${port}`, { encoding: "utf8" }).trim();
    if (!out) return null;
    return Number(out.split("\n")[0]);
  } catch {
    return null;
  }
}

function isNodeProcess(pid) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
        encoding: "utf8",
      });
      return out.toLowerCase().includes("node.exe");
    }
    const out = execSync(`ps -p ${pid} -o comm=`, { encoding: "utf8" });
    return out.toLowerCase().includes("node");
  } catch {
    return false;
  }
}

function killProcess(pid) {
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
    } else {
      process.kill(pid, "SIGTERM");
    }
    return true;
  } catch {
    return false;
  }
}

async function releaseStaleNodePort(port) {
  const pid = findPidOnPort(port);
  if (!pid || pid === process.pid || !isNodeProcess(pid)) return false;
  console.log(`Port ${port} đang bị node (PID ${pid}) chiếm — giải phóng...`);
  if (!killProcess(pid)) return false;
  await new Promise((r) => setTimeout(r, 400));
  return !findPidOnPort(port);
}

function waitForAuthCode(oAuth2Client, redirectUri) {
  const port = Number(new URL(redirectUri).port) || 80;

  const run = (retried) =>
    new Promise((resolve, reject) => {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent",
      });

      const server = http.createServer(async (req, res) => {
        try {
          const url = new URL(req.url, redirectUri);
          const code = url.searchParams.get("code");
          if (!code) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Missing authorization code");
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            "<h1>Authorization successful</h1><p>You can close this window.</p>"
          );
          server.close();
          resolve(code);
        } catch (err) {
          server.close();
          reject(err);
        }
      });

      const onInterrupt = () => {
        server.close();
        process.exit(130);
      };
      process.once("SIGINT", onInterrupt);
      process.once("SIGTERM", onInterrupt);

      server.once("error", async (err) => {
        process.off("SIGINT", onInterrupt);
        process.off("SIGTERM", onInterrupt);
        if (err.code === "EADDRINUSE" && !retried) {
          const freed = await releaseStaleNodePort(port);
          if (freed) {
            run(true).then(resolve).catch(reject);
            return;
          }
          const pid = findPidOnPort(port);
          reject(
            new Error(
              `Port ${port} đang bị sử dụng${pid ? ` (PID ${pid})` : ""}. ` +
                "Có thể do lần chạy auth:google trước chưa tắt. " +
                (process.platform === "win32" && pid
                  ? `Chạy: taskkill /PID ${pid} /F rồi thử lại.`
                  : "Giải phóng port rồi chạy lại npm run auth:google.")
            )
          );
          return;
        }
        reject(
          new Error(
            `Không mở được OAuth server tại ${redirectUri}. ` +
              `Kiểm tra redirect URI trong Google Cloud Console. (${err.message})`
          )
        );
      });

      server.listen(port, "127.0.0.1", () => {
        console.log("Mở URL sau trong trình duyệt và đăng nhập Google:\n");
        console.log(authUrl, "\n");
      });
    });

  return run(false);
}
const { clientId, clientSecret, redirectUri, tokenPath } = loadCredentials();
const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

const code = await waitForAuthCode(oauth2, redirectUri);
const { tokens } = await oauth2.getToken(code);
oauth2.setCredentials(tokens);

if (!tokens.refresh_token) {
  console.error(
    "Google không trả refresh_token. Vào https://myaccount.google.com/permissions, " +
      "gỡ quyền app này rồi chạy lại npm run auth:google."
  );
  process.exit(1);
}

fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2), "utf8");

const updatedEnv = upsertEnvLocal(tokens.refresh_token);
console.log("Đã lưu token.json:", tokenPath);
if (updatedEnv) {
  console.log("Đã cập nhật GOOGLE_REFRESH_TOKEN trong .env.local");
} else {
  console.log("\nThêm vào .env.local:");
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
}

const { token } = await oauth2.getAccessToken();
console.log("\nXác minh OAuth OK — access token length:", token?.length ?? 0);
