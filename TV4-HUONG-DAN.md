# TV4 — Giỏ hàng, đặt hàng, lịch sử mua và quản lý đơn

## Chạy prototype theo yêu cầu chấm file HTML local

1. Giải nén nguyên thư mục `Webbanhang_dientu` và không di chuyển riêng các file HTML ra khỏi thư mục.
2. Mở `index.html` bằng Chrome hoặc Firefox.
3. Chọn đăng ký, tạo khách hàng demo rồi đăng nhập.
4. Tại danh sách sản phẩm, thử tìm kiếm/lọc/phân trang, sau đó bấm **Thêm vào giỏ**. Mở chi tiết sản phẩm và thử nút mua ở đó.
5. Bấm giỏ hàng, tăng/giảm số lượng hoặc xóa sản phẩm, kiểm tra tổng tiền rồi đi đến thanh toán.
6. Chọn địa chỉ hồ sơ hoặc nhập địa chỉ mới; chọn phương thức thanh toán. **Tiền mặt khi nhận hàng (COD) được chọn mặc định**. Chuyển khoản và thanh toán trực tuyến là mô phỏng, không gọi cổng thanh toán thật.
7. Xác nhận đơn; mở tab **Lịch sử mua** để xem đơn, xem chi tiết và thử hủy đơn còn ở trạng thái **Mới đặt**.
8. Từ màn hình đặt hàng thành công, bấm **Mở quản lý đơn hàng (admin)**. Đăng nhập `admin@techstore.vn` / `Admin123!`, kiểm tra danh sách/chi tiết đơn và đổi trạng thái. Dùng nút **Trang khách hàng** để quay lại với snapshot dữ liệu đã cập nhật.

## Những file TV4 đã tích hợp

- `js/cart-bridge.js`: adapter nút mua chung cho trang danh sách và chi tiết; kiểm tra phiên khách, trạng thái sản phẩm, giá và tồn kho.
- `don-hang.html`: giỏ hàng, checkout, xác nhận đặt hàng, lịch sử, chi tiết và hủy đơn mới đặt.
- `js/catalog.js`, `index.html`, `san-pham.html`, `chi_tiet_sp.html`: liên kết các nút mua/giỏ/chi tiết và chế độ prototype local.
- `admin/js/app.js`: nhận snapshot đơn từ luồng local và cho phép vào trang quản lý đơn hàng trong prototype; phần tích hợp server/SQL hiện có của TV2/TV3 được giữ lại.

## Cấu trúc dữ liệu và giới hạn cần biết

- Giỏ hàng lưu ở `localStorage` trong `techstore_customer_carts_v1`, tách theo tài khoản.
- Đơn hàng dùng mô hình `TechStore` hiện có (`techstore_admin_v2`). Khi mở file trực tiếp, snapshot được truyền trong fragment `#tv4=...` hoặc `#tv4db=...` để dữ liệu vẫn đi theo người dùng giữa các file HTML.
- Backend hiện có `/api/me`, `/api/profile` và `/api/products`, cùng API quản trị sản phẩm. Trong source TV2/TV3 chưa có API/database đơn hàng; do đó phần đặt hàng/lịch sử hiện là prototype localStorage, không phải giao dịch SQL được lưu trên máy chủ.
- COD là phương thức mặc định. Chuyển khoản/online chỉ mô phỏng kết quả, không kết nối ngân hàng/cổng thanh toán.
- Không dùng dữ liệu thật hoặc mật khẩu thật trong bản demo. Tài khoản admin `Admin123!` chỉ dành cho prototype local; khi chạy server, đăng nhập admin sử dụng API backend hiện tại.

## Kiểm tra đã chạy trong lúc tích hợp

- `node --check` với `js/cart-bridge.js`, `js/catalog.js`, `admin/js/app.js`, `admin/js/store.js`.
- Kiểm tra cú pháp các script inline trong `index.html`, `san-pham.html`, `chi_tiet_sp.html`, `don-hang.html`.
- `node --test tests/catalog.test.cjs tests/html.test.cjs admin/tests/store.test.cjs`: cả 3 tệp test qua; gồm kiểm thử lọc/tìm kiếm/phân trang/chi tiết/giỏ và 13 nhóm nghiệp vụ trong store admin.
- Chưa xác nhận E2E trực quan bằng browser hoặc tích hợp SQL Server thật trong môi trường này. Khi nộp, nhóm nên thực hiện kịch bản ở trên trên laptop/máy chấm.
