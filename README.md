# Learning Hub

Hệ thống học tập trực tuyến với Google Drive.

## Cài đặt

```bash
npm install
npm run seed
```

Tài khoản mặc định: `admin` / `admin123`, `student` / `user123`

## Catalog từ Drive scanner

```bash
set DRIVE_NDJSON_PATH=..\drive_scaner\output\drive.ndjson
npm run build:catalog
```

## Chạy dev

```bash
npm run dev
```

## Env

Copy `.env.example` thành `.env.local`.

**Local dev:** chỉ cần `JWT_SECRET` (đã có trong `.env.local`). DB dùng SQLite `data/app.db` — không cần Cloudflare.

**Xem video (khuyến nghị):** Service Account — thêm `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` vào `.env.local`, và thêm SA vào Shared Drive (Viewer+). Chạy `npm run check:google` để kiểm tra.

**Fallback dev:** copy 3 biến `GOOGLE_*` OAuth từ `drive_scaner/credentials.json` và `token.json`.

**Production (Vercel):** thêm `CLOUDFLARE_*` + deploy artifact `data/` sau `build:catalog`.

DB local dùng `node:sqlite` (built-in Node ≥22.5), không cần `better-sqlite3`.
