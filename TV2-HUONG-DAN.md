# TV2 — Giao diện mua sắm và quản lý loại sản phẩm

## Kiến trúc thống nhất

Dự án hiện chỉ dùng HTML, CSS, JavaScript và Local Storage. Không dùng backend Node.js, API hay SQL Server. Bốn trang HTML được giữ đúng quy ước: `index.html`, `chi_tiet_sp.html`, `admin/index.html`, `don-hang.html`. Không tạo lại `san-pham.html`.

## Chức năng đã tích hợp

- `index.html`: danh sách sản phẩm, lọc theo loại, tìm tên không phân biệt dấu/hoa thường, lọc khoảng giá, phân trang 8 sản phẩm/trang và nút thêm giỏ.
- `chi_tiet_sp.html`: hiển thị ảnh, mã, hãng, giá, mô tả và thông số kỹ thuật; có nút thêm giỏ.
- `admin/index.html` → tab Loại sản phẩm: thêm, sửa, ẩn/hiện; không cho xóa loại còn sản phẩm.
- `products.js`: dữ liệu sản phẩm ban đầu. Dữ liệu làm việc được lưu trong `localStorage` với khóa `techstore_admin_v2`.
- `admin/js/store.js`: nghiệp vụ loại, sản phẩm, giá vốn/lợi nhuận/giá bán, phiếu nhập, đơn hàng và báo cáo kho.
- `js/catalog.js`: tìm kiếm/lọc/phân trang và render danh sách/chi tiết.
- `js/cart-bridge.js`: kiểm tra tài khoản khách cục bộ, giá, tồn kho và lưu giỏ theo tài khoản.

## Chạy và demo

1. Giải nén toàn bộ thư mục dự án.
2. Mở thư mục bằng VS Code và chạy **Live Server** ở `index.html` (hoặc dùng static HTTP server bất kỳ). Không mở riêng từng HTML bằng `file://`, vì trình duyệt có thể cô lập Local Storage theo từng file.
3. Đăng ký tài khoản khách hàng trên trang chủ rồi đăng nhập.
4. Thử tìm kiếm, lọc loại/khoảng giá, chuyển trang, mở chi tiết và thêm giỏ.
5. Mở `don-hang.html`, đặt hàng và kiểm tra đơn trong admin.
6. Mở `admin/index.html`, đăng nhập `admin@techstore.vn` / `Admin123!`.

## Lưu ý

- Giá bán trong storefront được tính từ giá vốn bình quân trong lịch sử nhập kho và tỉ lệ lợi nhuận.
- Local Storage chỉ dùng chung trên cùng trình duyệt và cùng origin. Nó không đồng bộ giữa máy tính/người dùng khác nhau và không phù hợp để bảo vệ dữ liệu nhạy cảm.
- Chuyển khoản/trực tuyến chỉ mô phỏng, không thu tiền thật. Không dùng mật khẩu thật trong bản demo.
