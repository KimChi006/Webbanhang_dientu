# TV4 — Giỏ hàng, đặt hàng, lịch sử mua và quản lý đơn

## Kiến trúc

Website dùng HTML, CSS, JavaScript và Local Storage; không có API, Node.js backend hoặc SQL Server. Bốn trang HTML chính là `index.html`, `chi_tiet_sp.html`, `admin/index.html`, `don-hang.html`.

## Kịch bản kiểm thử

1. Chạy website bằng Live Server/static HTTP server để các trang dùng chung Local Storage.
2. Tại `index.html`, đăng ký và đăng nhập tài khoản khách hàng.
3. Thêm sản phẩm từ danh sách hoặc chi tiết; thử thêm nhiều lần, mở `don-hang.html`, đổi số lượng và xóa dòng.
4. Tiến hành đặt hàng, nhập/chọn địa chỉ giao hàng và chọn phương thức thanh toán. COD là mặc định; chuyển khoản/trực tuyến chỉ mô phỏng.
5. Xác nhận đơn; mở Lịch sử mua, xem chi tiết và hủy đơn khi còn trạng thái Mới đặt.
6. Mở `admin/index.html` trên cùng origin, đăng nhập `admin@techstore.vn` / `Admin123!`, mở tab Đơn hàng và thử chuyển trạng thái. Khi đơn chuyển sang Đã giao, kho ghi nhận xuất một lần.

## File chính

- `js/cart-bridge.js`: thêm vào giỏ, kiểm tra đăng nhập, giá bán và tồn kho.
- `don-hang.html`: giỏ hàng, checkout, tạo đơn, lịch sử, chi tiết và hủy đơn mới đặt.
- `admin/js/store.js`: lưu mô hình dữ liệu chung trong `techstore_admin_v2`.
- `admin/js/app.js`: giao diện quản trị và cập nhật trạng thái đơn.

## Giới hạn

- Dữ liệu chỉ tồn tại trong Local Storage của trình duyệt/origin đang sử dụng; xóa dữ liệu trang hoặc đổi trình duyệt có thể làm mất dữ liệu.
- Thanh toán không kết nối ngân hàng/cổng thanh toán.
- Không dùng mật khẩu thật. Bản Local Storage là đồ án/demo, không phải hệ thống thương mại điện tử có bảo mật production.
