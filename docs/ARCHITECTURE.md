# VideoNova backend architecture

## Tổng quan

Backend là modular monolith NestJS với hai entry point dùng chung domain code:

```text
Frontend -> HTTP API -> PostgreSQL
                    -> Redis/BullMQ -> Worker -> local-ffmpeg -> protected local storage
```

API chịu trách nhiệm xác thực, validation, ownership, giao dịch credit và enqueue. Worker chịu trách nhiệm render, progress, retry, kết quả, thông báo và refund cuối cùng. Việc tách process ngăn request HTTP chờ FFmpeg và cho phép scale worker độc lập.

## Module

- `auth`: access JWT 15 phút, refresh token rotation, session revoke, reset token một lần; database chỉ lưu SHA-256 hash của bearer token ngẫu nhiên.
- `users`: profile, settings, avatar được bảo vệ.
- `videos`: upload, ownership, lifecycle, protected streaming/download.
- `queue`: BullMQ job có `jobId = videoId`, retry 3 lần với exponential backoff.
- `storage`: local storage abstraction, key tương đối được kiểm tra chống path traversal.
- `local-ffmpeg`: implementation của `VideoProvider`; không được mô tả là AI.
- `credits`/`transactions`: balance và immutable ledger cập nhật trong Serializable transaction, unique idempotency key chống double charge/refund.
- `admin`: dashboard, user lock, credit grant, video/job/transaction và audit log; toàn bộ yêu cầu role `ADMIN`.
- `health`: liveness không phụ thuộc external service; readiness kiểm tra PostgreSQL.

## Luồng tạo video

1. Multer giữ ảnh trong memory; server kiểm tra số lượng, kích thước và magic bytes JPEG/PNG/WebP.
2. File được lưu bằng UUID key trong storage ngoài web root.
3. Serializable transaction trừ balance có điều kiện, tạo `Video`, `MediaAsset`, `VideoJob` và ledger debit.
4. API enqueue job duy nhất và trả `202` với video `QUEUED`.
5. Worker chuyển sang `PROCESSING`, chạy FFmpeg và cập nhật progress.
6. Thành công: tạo output asset, chuyển `SUCCEEDED`, progress 100 và tạo notification.
7. Sau retry cuối thất bại: chuyển `FAILED`, lưu lỗi rút gọn, xóa output dở và refund idempotent. Cancel cũng refund idempotent.

## Security decisions

- Password bcrypt cost 12; JWT/reset/refresh không được log và token hash không thể dùng lại như bearer token.
- Mọi media endpoint query cả `id` và `userId`; admin đi qua route riêng có RBAC.
- Helmet, allow-list CORS, DTO whitelist/forbid unknown, throttling, upload limit, request ID và structured redacted logs.
- Không expose storage như static directory. File name từ client chỉ dùng làm metadata sau `basename`.
- Production error response không chứa raw exception stack. FFmpeg được spawn trực tiếp với argument array, không qua shell.

## Mở rộng

`VideoProvider` là seam để thêm provider AI có cấu hình rõ ràng; `StorageService` là seam để thay local bằng S3/MinIO. Payment chưa có provider: packages chỉ là catalog và checkout trả 501, credit development chỉ cấp qua admin endpoint có audit.
