import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import type { JWT } from "google-auth-library";
import { DriveStreamError } from "@/lib/drive/errors";
import {
  getServiceAccountClient,
  isServiceAccountConfigured,
} from "@/lib/drive/service-account";

const OAUTH_EXPIRED_MESSAGE =
  "Google OAuth refresh token đã hết hạn hoặc bị thu hồi. Chạy npm run auth:google hoặc chuyển sang Service Account (GOOGLE_SERVICE_ACCOUNT_*).";

function isInvalidGrant(err: unknown): boolean {
  const e = err as { response?: { data?: { error?: string } } };
  return e.response?.data?.error === "invalid_grant";
}

export function mapOAuthError(err: unknown): DriveStreamError | null {
  if (err instanceof DriveStreamError) return err;
  if (isInvalidGrant(err)) {
    return new DriveStreamError(OAUTH_EXPIRED_MESSAGE, 503, "oauthExpired");
  }
  return null;
}

export function getOAuthClient(): OAuth2Client | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

export function getGoogleAuthClient(): JWT | OAuth2Client | null {
  return getServiceAccountClient() ?? getOAuthClient();
}

export async function getGoogleAccessToken(): Promise<string> {
  const auth = getGoogleAuthClient();
  if (!auth) {
    throw new DriveStreamError("Google Drive chưa cấu hình", 503);
  }

  try {
    const { token } = await auth.getAccessToken();
    if (!token) {
      throw new DriveStreamError("Không lấy được access token Google", 503);
    }
    return token;
  } catch (err) {
    if (isServiceAccountConfigured()) {
      const detail =
        (err as { message?: string }).message ?? "unknown error";
      throw new DriveStreamError(
        `Service Account lỗi: ${detail}. Kiểm tra private key và quyền SA trên Shared Drive.`,
        503,
        "serviceAccountAuthFailed"
      );
    }
    const mapped = mapOAuthError(err);
    if (mapped) throw mapped;
    throw err;
  }
}

export function getDrive() {
  const auth = getGoogleAuthClient();
  if (!auth) return null;
  return google.drive({ version: "v3", auth });
}

async function probeFileAccess(
  auth: JWT | OAuth2Client,
  fileId: string
): Promise<boolean> {
  const drive = google.drive({ version: "v3", auth });
  try {
    await drive.files.get({
      fileId,
      supportsAllDrives: true,
      fields: "id",
    });
    return true;
  } catch (err) {
    const status = (err as { response?: { status?: number } }).response
      ?.status;
    if (status === 404 || status === 403) return false;
    throw err;
  }
}

export async function resolveAuthForFile(
  fileId: string
): Promise<JWT | OAuth2Client> {
  const sa = getServiceAccountClient();
  const oauth = getOAuthClient();

  if (!sa && !oauth) {
    throw new DriveStreamError("Google Drive chưa cấu hình", 503);
  }

  if (sa && (await probeFileAccess(sa, fileId))) return sa;

  if (oauth) {
    try {
      if (await probeFileAccess(oauth, fileId)) return oauth;
    } catch (err) {
      const mapped = mapOAuthError(err);
      if (mapped) throw mapped;
      throw err;
    }
  }

  const hints: string[] = [];
  if (sa) hints.push("Thêm Service Account vào Shared Drive chứa video");
  if (oauth) hints.push("Chạy npm run auth:google để làm mới OAuth");
  throw new DriveStreamError(
    `Không truy cập được file trên Drive. ${hints.join(" hoặc ")}.`,
    403,
    "fileAccessDenied"
  );
}

export async function getDriveForFile(fileId: string) {
  const auth = await resolveAuthForFile(fileId);
  return google.drive({ version: "v3", auth });
}

export async function getGoogleAccessTokenForFile(
  fileId: string
): Promise<string> {
  const auth = await resolveAuthForFile(fileId);
  try {
    const { token } = await auth.getAccessToken();
    if (!token) {
      throw new DriveStreamError("Không lấy được access token Google", 503);
    }
    return token;
  } catch (err) {
    const mapped = mapOAuthError(err);
    if (mapped) throw mapped;
    throw err;
  }
}

export function isDriveConfigured(): boolean {
  return getGoogleAuthClient() !== null;
}

export { isServiceAccountConfigured };
