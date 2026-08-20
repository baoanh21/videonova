# Frontend integration

## Cấu hình

Trên branch frontend của Tuyền, tạo `.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_API_POLL_INTERVAL=3000
VITE_NOTIFICATION_POLL_INTERVAL=8000
```

Backend CORS mặc định cho `http://localhost:5173`. Nếu Vite chạy origin khác, thêm origin đó vào `CORS_ORIGINS` của backend, phân tách bằng dấu phẩy.

## Contract đang khớp frontend

- Auth trả `access_token`, `refresh_token`, `user`; register tự đăng nhập.
- User dùng `full_name`, `display_name`, `avatar_url`, role chữ thường.
- `POST /videos` nhận đúng field hiện tại: `image`, `prompt`, `model`, `duration`, `aspect_ratio`, `style`, `enhance_quality`.
- Video trả `thumbnail_url`, `input_image_url`, `output_video_url`, `credit_cost`, `created_at`, `completed_at`.
- List trả `{ items, total, page, limit, total_pages, summary }`.
- Credit trả `balance`, `paid_credit`, `free_remaining`, `free_limit`.
- Transaction trả các field frontend normalize hiện tại.
- Notification và user settings khớp API client trên `origin/tuyen_frontend`.

Các URL ảnh/video yêu cầu bearer token. Thẻ `<img src>` không tự gắn Authorization; frontend nên fetch media thành Blob bằng API client rồi dùng `URL.createObjectURL`, hoặc backend/frontend có thể bổ sung signed URL ở giai đoạn tích hợp. Download cũng nên dùng authenticated fetch.

## Refresh token

Frontend hiện lưu refresh token nhưng chưa tự refresh khi access token hết hạn. Khi nhận 401, gọi `POST /auth/refresh` với `{ "refresh_token": "..." }`, lưu cả cặp token mới rồi retry request đúng một lần. Token cũ bị revoke ngay khi rotate.

## Admin

Các trang `Admin*` trên frontend khảo sát vẫn dùng mock tĩnh. Contract thật có tại `/admin/dashboard`, `/admin/users`, `/admin/videos`, `/admin/jobs/failed`, `/admin/transactions`, `/admin/audit-logs`. Chỉ token role `admin` truy cập được.

## Thanh toán

`GET /billing/packages` trả catalog để UI hiển thị. `POST /billing/checkout` cố ý trả 501 cho đến khi có payment provider thật; không hiển thị checkout thành công giả. Admin có thể cấp credit test qua `POST /admin/users/:id/credits`, có audit log.
