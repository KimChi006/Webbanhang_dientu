# THÔNG TIN TÀI KHOẢN USER VÀ ADMIN – TECHSTORE

Tài liệu này tổng hợp cách đăng nhập, chức năng và dữ liệu của hai nhóm tài khoản trong website TechStore.

## 1. Tài khoản khách hàng (User)

### Đăng ký và đăng nhập
- Khách hàng đăng ký trực tiếp tại `index.html`.
- Sau khi đăng ký, khách hàng sử dụng email và mật khẩu đã tạo để đăng nhập.
- Thông tin tài khoản khách hàng được lưu trong Local Storage của trình duyệt.
- Tài khoản demo đang được khai báo trong README của dự án (nếu dữ liệu mẫu được khởi tạo trên trình duyệt):
  - `hoangnam@example.com` / `Khach123!` – hoạt động.
  - `quocbao@example.com` / `Khach123!` – bị khóa để kiểm thử.
  - `minhanh@example.com`, `thuha@example.com`, `ngoclinh@example.com`, `giahuy@example.com` / `Khach123!` – tài khoản mẫu.

### Chức năng khách hàng
- Xem, tìm kiếm, lọc và phân trang sản phẩm tại `index.html`.
- Xem thông tin chi tiết sản phẩm tại `chi_tiet_sp.html`.
- Quản lý thông tin cá nhân và giỏ hàng.
- Đặt hàng, cung cấp địa chỉ nhận hàng và theo dõi lịch sử đơn hàng tại `don-hang.html`.

## 2. Tài khoản quản trị (Admin)

### Đăng nhập quản trị demo
- Trang đăng nhập: `admin/index.html`.
- Email: `admin@techstore.vn`
- Mật khẩu: `Admin123!`

Thông tin đăng nhập demo được ghi trong tài liệu dự án, không hiển thị trên giao diện đăng nhập. Không sử dụng mật khẩu này cho hệ thống thật.

### Chức năng quản trị
- Quản lý sản phẩm, danh mục và thông tin giá bán.
- Quản lý tồn kho, phiếu nhập, xuất kho và lịch sử nhập – xuất – tồn.
- Quản lý tài khoản khách hàng; khóa/mở khóa và hỗ trợ đặt lại mật khẩu theo chức năng có sẵn.
- Quản lý đơn hàng và cập nhật trạng thái xử lý.
- Theo dõi dữ liệu hoạt động của cửa hàng trên giao diện quản trị.

## 3. Lưu trữ và lưu ý

- Website sử dụng HTML, CSS, JavaScript và Local Storage; không có backend hoặc cơ sở dữ liệu máy chủ.
- Dữ liệu chỉ dùng chung trên cùng trình duyệt và cùng origin; không tự đồng bộ giữa các máy tính hoặc trình duyệt khác nhau.
- Dữ liệu quản trị/giao dịch sử dụng khóa Local Storage `techstore_admin_v2`; phiên đăng nhập admin sử dụng `techstore_admin_session_v2`.
- Đây là tài khoản và dữ liệu phục vụ demo/đồ án. Không dùng mật khẩu thật hoặc lưu dữ liệu nhạy cảm trong phiên bản này.

## 4. Cách chạy

1. Mở thư mục dự án bằng VS Code.
2. Chạy Live Server từ `index.html`.
3. Đăng ký/đăng nhập khách hàng trên trang chủ.
4. Mở `admin/index.html` trên cùng origin để đăng nhập quản trị.

Website chỉ giữ bốn trang HTML theo yêu cầu: `index.html`, `don-hang.html`, `chi_tiet_sp.html` và `admin/index.html`.
