import { getDrive } from "@/lib/drive/client";

export const DRIVE_FILE_FIELDS =
  "id,name,mimeType,size,capabilities,resourceKey,owners,viewersCanCopyContent";

export type DriveFileMeta = {
  id?: string | null;
  name?: string | null;
  mimeType?: string | null;
  size?: string | null;
  resourceKey?: string | null;
  capabilities?: { canDownload?: boolean } | null;
  owners?: Array<{ emailAddress?: string | null; displayName?: string | null }> | null;
  viewersCanCopyContent?: boolean | null;
};

export async function getDriveFileMetadata(
  fileId: string
): Promise<DriveFileMeta | null> {
  const drive = getDrive();
  if (!drive) return null;
  const { data } = await drive.files.get({
    fileId,
    supportsAllDrives: true,
    fields: DRIVE_FILE_FIELDS,
  });
  return data;
}

export function ownerEmail(meta: DriveFileMeta): string | null {
  return meta.owners?.[0]?.emailAddress ?? null;
}

export function downloadBlockedMessage(meta: DriveFileMeta): string {
  const owner = ownerEmail(meta);
  return owner
    ? `File Drive chặn tải xuống với tài khoản OAuth hiện tại. Chủ sở hữu: ${owner}. Đặt GOOGLE_REFRESH_TOKEN của chủ sở hữu (hoặc cấp Editor + bật tải xuống trên Drive), rồi chạy: npm run cache:videos`
    : `File Drive chặn tải xuống. Dùng refresh token của chủ sở hữu file hoặc bật quyền tải trên Google Drive.`;
}
