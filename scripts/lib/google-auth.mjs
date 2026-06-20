import fs from "fs";
import path from "path";
import { google } from "googleapis";

const DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

function normalizePrivateKey(key) {
  return key.replace(/\\n/g, "\n");
}

function parseServiceAccountJson(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.client_email && parsed.private_key) {
      return {
        client_email: parsed.client_email,
        private_key: normalizePrivateKey(parsed.private_key),
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function loadServiceAccountCredentials() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH?.trim();
  if (keyPath && fs.existsSync(keyPath)) {
    const fromFile = parseServiceAccountJson(fs.readFileSync(keyPath, "utf8"));
    if (fromFile) return fromFile;
  }

  const jsonRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonRaw) {
    const fromEnv = parseServiceAccountJson(jsonRaw);
    if (fromEnv) return fromEnv;
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();
  if (email && privateKey) {
    return {
      client_email: email,
      private_key: normalizePrivateKey(privateKey),
    };
  }

  return null;
}

export function createGoogleAuth() {
  const sa = loadServiceAccountCredentials();
  if (sa) {
    const subject = process.env.GOOGLE_SERVICE_ACCOUNT_SUBJECT?.trim();
    return {
      mode: "service_account",
      client: new google.auth.JWT({
        email: sa.client_email,
        key: sa.private_key,
        scopes: [DRIVE_READONLY_SCOPE],
        subject: subject || undefined,
      }),
      email: sa.client_email,
    };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return { mode: "oauth", client: oauth2, email: null };
}

export function isGoogleConfigured() {
  return createGoogleAuth() !== null;
}

export async function getGoogleAccessToken() {
  const auth = createGoogleAuth();
  if (!auth) {
    throw new Error(
      "Thiếu Service Account (GOOGLE_SERVICE_ACCOUNT_*) hoặc OAuth (GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN)"
    );
  }
  const { token } = await auth.client.getAccessToken();
  if (!token) throw new Error("Không lấy được access token Google");
  return { token, mode: auth.mode, email: auth.email };
}
