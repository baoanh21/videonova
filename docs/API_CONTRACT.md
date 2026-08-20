# VideoNova API contract v1

Base URL: `http://localhost:8000/api/v1`. Swagger tương tác: `http://localhost:8000/docs`. Endpoint bảo vệ nhận `Authorization: Bearer <access_token>`.

## Quy ước

- JSON field dùng `snake_case`; thời gian ISO 8601 UTC.
- Pagination: query `page` (mặc định 1), `limit` (20, tối đa 100), response `{ items, total, page, limit, total_pages }`.
- Video status: `QUEUED | PROCESSING | SUCCEEDED | FAILED | CANCELED`.
- Error nhất quán: `{ statusCode, message, error, path, request_id, timestamp }`.
- `401` là thiếu/hết hạn token; `403` là sai role; resource không thuộc user trả `404` để không lộ tồn tại.

## Health

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | `/health/live` | Không | Process sống |
| GET | `/health/ready` | Không | PostgreSQL sẵn sàng |

## Authentication

| Method | Path | Body / ghi chú |
|---|---|---|
| POST | `/auth/register` | `{ full_name, email, password }`, trả token pair |
| POST | `/auth/login` | `{ email, password }` |
| POST | `/auth/refresh` | `{ refresh_token }`, rotate và revoke session cũ |
| POST | `/auth/logout` | Bearer, revoke session hiện tại, 204 |
| POST | `/auth/logout-all` | Bearer, revoke mọi session, 204 |
| POST | `/auth/forgot-password` | `{ email }`, luôn trả thông báo chung; development trả thêm `reset_token` |
| POST | `/auth/reset-password` | `{ token, new_password }`, token một lần/30 phút, 204 |
| POST | `/auth/change-password` | `{ current_password, new_password }`, revoke mọi session, 204 |

## User, settings và notification

| Method | Path | Mô tả |
|---|---|---|
| GET/PATCH | `/users/me` | Đọc/cập nhật profile |
| DELETE | `/users/me` | Body `{ password }`, xóa account |
| POST/GET | `/users/me/avatar` | Multipart `avatar` / tải avatar có auth |
| GET/PATCH | `/users/me/settings` | Notification flags và low-credit threshold |
| GET | `/notifications?limit=10` | Danh sách và `unread_count` |
| PATCH | `/notifications/:id/read` | Đánh dấu một notification |
| POST | `/notifications/read-all` | Đánh dấu tất cả, 204 |

## Video

`POST /videos` là multipart, nhận một `image` hoặc nhiều field `images`. MIME thật hỗ trợ JPEG/PNG/WebP; mặc định tối đa 10 file, 10 MiB/file.

| Method | Path | Mô tả |
|---|---|---|
| POST | `/videos` | Fields `prompt`, `duration` 1–60, `fps` 12–60, `aspect_ratio`, `model`, `style`, `enhance_quality`; trả 202 |
| GET | `/videos` | Pagination; filter `status`, `search`; sort `created_at|progress|duration`, `order=asc|desc` |
| GET | `/videos/:id` | Chi tiết có ownership |
| GET | `/videos/:id/status` | Dùng để poll progress |
| GET | `/videos/:id/input` | Ảnh input đầu tiên, có auth |
| GET | `/videos/:id/download` | MP4 khi thành công, có auth |
| POST | `/videos/:id/cancel` | Cancel queued/processing và refund |
| DELETE | `/videos/:id` | Chỉ video terminal, soft-delete record và xóa media |

Response video chính gồm `id`, `title`, `prompt`, `provider=local-ffmpeg`, `model`, `style`, `duration`, `fps`, `aspect_ratio`, `credit_cost`, `status`, `progress`, media URLs, `error`, `created_at`, `completed_at`.

## Credit, transaction, billing

| Method | Path | Mô tả |
|---|---|---|
| GET | `/credits/balance` | Balance hiện tại |
| GET | `/transactions` | Ledger của user có pagination/search |
| GET | `/billing/packages` | Catalog; `payment_enabled=false` |
| POST | `/billing/checkout` | 501 đến khi cấu hình payment provider |

## Admin (`ADMIN` only)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/admin/dashboard` | Tổng user/video/job/transaction, recent jobs |
| GET | `/admin/users` | Search và pagination |
| PATCH | `/admin/users/:id/lock` | `{ locked: boolean }`, revoke session khi đổi trạng thái |
| POST | `/admin/users/:id/credits` | `{ credits, reason }`, development/admin adjustment có audit |
| GET | `/admin/videos` | Mọi video, filter/pagination |
| DELETE | `/admin/videos/:id` | Xóa video terminal, có audit |
| GET | `/admin/jobs/failed` | Job lỗi và error detail |
| GET | `/admin/transactions` | Mọi ledger entry |
| GET | `/admin/audit-logs` | Hành động admin quan trọng |
