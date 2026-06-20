import { loadEnvLocal } from "./lib/load-env.mjs";
import { createGoogleAuth, getGoogleAccessToken } from "./lib/google-auth.mjs";

if (!loadEnvLocal()) {
  console.error("Thiếu .env.local");
  process.exit(1);
}

const auth = createGoogleAuth();
if (!auth) {
  console.error(
    "Thiếu cấu hình Google Drive.\n" +
      "Service Account: GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY\n" +
      "Hoặc OAuth: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN"
  );
  process.exit(1);
}

console.log("Chế độ:", auth.mode);
if (auth.email) console.log("Service account:", auth.email);

try {
  const { token, mode } = await getGoogleAccessToken();
  console.log(`${mode === "service_account" ? "Service Account" : "OAuth"} OK — access token length:`, token.length);
} catch (err) {
  const desc =
    err.response?.data?.error_description ??
    err.response?.data?.error ??
    err.message;
  console.error("FAIL:", desc);
  process.exit(1);
}
