import { google } from "googleapis";
import type { JWT } from "google-auth-library";

export const DRIVE_READONLY_SCOPE =
  "https://www.googleapis.com/auth/drive.readonly";

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
};

function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, "\n");
}

export function loadServiceAccountCredentials(): ServiceAccountCredentials | null {
  const jsonRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonRaw) {
    try {
      const parsed = JSON.parse(jsonRaw) as {
        client_email?: string;
        private_key?: string;
      };
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: normalizePrivateKey(parsed.private_key),
        };
      }
    } catch {
      return null;
    }
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

export function getServiceAccountClient(): JWT | null {
  const creds = loadServiceAccountCredentials();
  if (!creds) return null;

  const subject = process.env.GOOGLE_SERVICE_ACCOUNT_SUBJECT?.trim();
  return new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [DRIVE_READONLY_SCOPE],
    subject: subject || undefined,
  });
}

export function isServiceAccountConfigured(): boolean {
  return loadServiceAccountCredentials() !== null;
}
