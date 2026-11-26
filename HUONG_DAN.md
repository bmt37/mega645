# Cập nhật cấu trúc cho Cloudflare Worker

1. Trên Cloudflare: **Storage & databases > D1 > mega645db**, chép **Database ID** (chuỗi dài có gạch ngang).
2. Mở file `wrangler.jsonc`, thay `DÁN_ID_DATABASE_VÀO_ĐÂY` bằng ID đó (giữ nguyên dấu nháy kép). Lưu.
3. Trên GitHub (máy tính), repo `mega645`: xóa 3 file cũ ở thư mục gốc là `index.html`, `admin.html`, `_worker.js` (mở file > biểu tượng thùng rác > Commit).
4. **Add file > Upload files**: kéo vào TOÀN BỘ nội dung thư mục đã giải nén, gồm thư mục `public`, `worker.js`, `wrangler.jsonc`, `setup.sql`, `HUONG_DAN.md` > Commit.
5. Cloudflare tự triển khai lại (xem tab **Deployments** hoặc **Builds**). Không cần thêm binding bằng tay, vì `wrangler.jsonc` đã khai báo `DB`.
6. Mật khẩu: **Settings > Variables and secrets > Add**, loại **Secret**, tên `ADMIN_PASSWORD`, giá trị là mật khẩu dài 20 ký tự trở lên. Triển khai lại sau khi thêm.
7. Kiểm tra: mở trang chủ xem dữ liệu; mở `/admin` thử mật khẩu sai (phải báo "Sai mật khẩu"), rồi mật khẩu đúng.
