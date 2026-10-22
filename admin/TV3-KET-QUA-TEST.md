# Kết quả kiểm thử TV3 — 22/10/2026

## Đã thực thi và đạt

| Bộ kiểm thử | Kết quả |
| --- | --- |
| `node admin/tests/store.test.cjs` | 13 nhóm nghiệp vụ, có kiểm tra hồi quy các phần liên quan |
| `node admin/tests/tv3.test.cjs` | Luồng sản phẩm/nhập hàng và 47 ca dữ liệu sai/không tồn tại |
| `node admin/tests/browser.test.cjs` | Chrome thật mở file HTML offline; desktop/mobile; không có lỗi JavaScript |
| `node admin/tests/tv3-browser.test.cjs` | Chrome thật, API giả lập; không chạy backend SQL |
| `git diff --check` | Không có lỗi whitespace trong diff |

## Các chức năng đã kiểm tra

- Sản phẩm: danh sách/phân trang, tìm kiếm, thêm đủ trường, thông số, sửa điền sẵn, xem chi tiết, ẩn/hiện, xóa sản phẩm chưa sử dụng, chặn xóa khi đã có lịch sử.
- Hình ảnh: chọn ảnh local; upload ảnh JPEG hợp lệ; từ chối file text và ảnh vượt 500 KB; giữ ảnh khi mở lại form.
- Phiếu nhập: tạo nhiều dòng, thêm/bỏ dòng, tổng tiền, sửa nháp và điền sẵn; nháp không cộng kho.
- Tìm phiếu theo mã, ghi chú, tên/mã sản phẩm; kết hợp trạng thái/khoảng ngày; báo lỗi ngày đầu sau ngày cuối.
- Hoàn thành: đúng số lượng, khóa sửa; gọi nghiệp vụ lần hai bị từ chối, không cộng kho thêm.
- Dữ liệu sai: mã trùng/không hợp lệ, thiếu trường, quá độ dài, loại không tồn tại, ảnh không hợp lệ, số lượng/giá âm, 0, lẻ, quá giới hạn, trùng dòng, ngày không hợp lệ/tương lai, tổng tiền mất độ chính xác.
- Lưu và tải lại ở bản offline; bản API tải dữ liệu lại từ nguồn giả lập.
- API UI: đăng nhập/đăng xuất, phản hồi 409 khi dữ liệu thay đổi, lỗi mạng khi lưu; form giữ lại và nút lưu dùng được sau lỗi.
- Nội dung nhập được hiển thị như văn bản; không thực thi HTML chèn vào tên sản phẩm.

## Chưa thể xác nhận

Checkout chưa có `.env` và `node_modules`. Kiểm tra SQL Server bằng kết nối Windows chỉ đọc: không tìm thấy database `WebBanHang` trên instance mặc định, MSSQLSERVER01, MSSQLSERVER02, MSSQLSERVER03 và SQLEXPRESS. `sqlcmd` còn báo thiếu driver ODBC; đã dùng .NET SqlClient để kiểm tra các instance thay thế.

Chưa chạy migration, API với SQL thật, transaction rollback do lỗi SQL, cạnh tranh giữa hai kết nối SQL, hay kiểm tra trang mua hàng đọc thay đổi từ SQL. Test API giả lập không chứng minh các trường hợp này hoạt động.

Để hoàn tất kiểm thử tích hợp: cần cấu hình database kiểm thử của nhóm và quyền kết nối. Sau đó chạy migration trên database kiểm thử, xác nhận sản phẩm và ảnh round-trip, hoàn thành phiếu nhiều dòng, gửi hai yêu cầu cùng revision, kiểm tra chỉ một lần cộng kho, gây lỗi dòng thứ hai để xác nhận rollback cả phiếu, và kiểm tra `/api/products` sau sửa/ẩn sản phẩm.

Trong lượt kiểm thử này chỉ mở rộng file test và ghi báo cáo; không sửa code chức năng, không thay đổi dữ liệu SQL, không commit/push.
