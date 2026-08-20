# VideoNova backend

Backend API cho VideoNova, sử dụng NestJS, PostgreSQL/Prisma, Redis/BullMQ và provider video cục bộ `local-ffmpeg`. API và worker là hai process độc lập; API chỉ enqueue và trả `202 Accepted`, worker mới chạy FFmpeg.

## Chạy nhanh bằng Docker

Yêu cầu Docker Desktop đang chạy.

```powershell
cd D:\backend\videonova\backend
Copy-Item .env.example .env
```

Sửa `.env`: đặt hai JWT secret ngẫu nhiên dài ít nhất 32 ký tự. Nếu muốn seed admin, đặt `ADMIN_PASSWORD` dài ít nhất 12 ký tự. Sau đó:

```powershell
docker compose up --build
docker compose run --rm migrate npm run prisma:seed
```

- API base URL: `http://localhost:8000/api/v1`
- Swagger: `http://localhost:8000/docs`
- Liveness: `http://localhost:8000/api/v1/health/live`
- Readiness: `http://localhost:8000/api/v1/health/ready`

Docker Compose khởi động PostgreSQL, Redis, migration one-shot, API và worker. Media nằm trong volume `media_data`; upload không được public trực tiếp.

## Chạy native trên Windows

Yêu cầu Node.js 22 LTS, PostgreSQL, Redis và FFmpeg. `FFMPEG_PATH` có thể là `ffmpeg` nếu đã có trong `PATH`, hoặc đường dẫn tuyệt đối như `C:\ffmpeg\bin\ffmpeg.exe`.

```powershell
cd D:\backend\videonova\backend
Copy-Item .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

Mở terminal PowerShell thứ hai:

```powershell
cd D:\backend\videonova\backend
npm run start:worker:dev
```

Không đặt mật khẩu admin trong source. Seed chỉ tạo/nâng role admin khi cả `ADMIN_EMAIL` và `ADMIN_PASSWORD` có giá trị.

## Tạo video thử

Đăng ký hoặc đăng nhập trong Swagger, copy `access_token`, bấm **Authorize**, rồi gọi `POST /api/v1/videos` dạng multipart:

- `image`: JPEG/PNG/WebP thật;
- `prompt`: nội dung chuyển động;
- `duration`: `3`;
- `aspect_ratio`: `16:9`;
- `fps`: `24`;
- `model`: `local-ffmpeg`;
- `style`: `cinematic`.

Poll `GET /videos/{id}/status` đến `SUCCEEDED`, sau đó tải `GET /videos/{id}/download`. Có thể lặp field `images` để gửi nhiều ảnh. Worker tạo MP4 H.264, `yuv420p`, `faststart` và fade transition cơ bản.

## Kiểm tra

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run prisma:validate
docker compose config
```

Khi stack đang chạy, test e2e:

```powershell
$env:E2E_BASE_URL='http://localhost:8000'
npm run test:e2e
```

## Lỗi Windows thường gặp

- `Unable to start FFmpeg`: kiểm tra `FFMPEG_PATH` và chạy `& $env:FFMPEG_PATH -version`.
- API ready trả 503: kiểm tra `DATABASE_URL`, PostgreSQL và migration.
- Job đứng `QUEUED`: kiểm tra Redis và process worker.
- Docker báo không đọc được config: mở Docker Desktop/terminal bằng tài khoản có quyền đọc `%USERPROFILE%\.docker`.
- Port 8000/5432/6379 bận: đổi mapping port hoặc dừng service đang chiếm cổng.

Contract chi tiết ở [../docs/API_CONTRACT.md](../docs/API_CONTRACT.md), kiến trúc ở [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md), hướng dẫn frontend ở [../docs/FRONTEND_INTEGRATION.md](../docs/FRONTEND_INTEGRATION.md).
