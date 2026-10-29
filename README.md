# TechStore — Web bán hàng điện tử

## Công nghệ

- HTML, CSS, JavaScript thuần.
- Local Storage lưu dữ liệu quản trị, tài khoản demo, giỏ hàng và đơn hàng.
- Không dùng backend, Node.js, SQL Server hoặc API.

## Bốn trang HTML

1. `index.html` — trang chủ, tài khoản khách hàng, tìm kiếm/lọc/phân trang sản phẩm.
2. `chi_tiet_sp.html` — chi tiết sản phẩm và thêm giỏ.
3. `admin/index.html` — đăng nhập quản trị riêng và các tab quản lý.
4. `don-hang.html` — giỏ hàng, đặt hàng và lịch sử mua.

## Chạy website

Khuyến nghị VS Code + tiện ích **Live Server**:

1. Giải nén ZIP.
2. Mở thư mục dự án trong VS Code.
3. Bấm chuột phải `index.html` → **Open with Live Server**.
4. Mở admin trên cùng origin bằng liên kết quản trị hoặc `admin/index.html`.

Không mở riêng từng file bằng `file://`, vì Local Storage có thể bị cô lập giữa các file tùy trình duyệt.

## Tài khoản quản trị demo

- Email: `admin@techstore.vn`
- Mật khẩu: `Admin123!`

Tài khoản khách hàng đăng ký ngay trên trang chủ. Tài khoản khách demo có sẵn:

- `hoangnam@example.com` / `Khach123!` — hoạt động.
- `quocbao@example.com` / `Khach123!` — bị khóa để kiểm thử chức năng khóa tài khoản.
- Các tài khoản mẫu khác: `minhanh@example.com`, `thuha@example.com`, `ngoclinh@example.com`, `giahuy@example.com` — cùng mật khẩu `Khach123!`.

Nếu trước đó đã mở website, hãy tải lại trang bằng `Ctrl + F5`. Tài khoản demo chỉ được thêm vào Local Storage khi mở trang; dữ liệu tài khoản cũ khác email vẫn được giữ nguyên.

## Quy ước dữ liệu sản phẩm

Sản phẩm giữ các trường `masp`, `name`, `company`, `price`, `img`, `promo`, `detail`, `star`, `rateCount`. Dữ liệu gốc được khởi tạo từ `products.js`; đây là danh mục sản phẩm ban đầu, không phải nơi bắt buộc để thêm sản phẩm mới. Có thể thêm sản phẩm trong Admin → Quản lý sản phẩm. Chọn loại, điền mã/tên/hãng/mô tả, chọn ảnh (mặc định có ảnh đầu tiên), rồi lưu. Sau đó tạo phiếu nhập với số lượng và giá nhập để hệ thống tính giá vốn, giá bán và tồn kho. Dữ liệu quản trị và giao dịch được lưu trong Local Storage (`techstore_admin_v2`). Giá bán tính từ giá vốn và tỉ lệ lợi nhuận; số tồn tính từ lịch sử nhập/xuất.

## Giới hạn cần trình bày khi demo

Local Storage không đồng bộ dữ liệu giữa các máy/người dùng, không có xác thực an toàn phía máy chủ và không phù hợp để lưu mật khẩu thật. Chuyển khoản/trực tuyến chỉ mô phỏng. Đây là frontend demo, không phải hệ thống production.

## Triển khai lên Internet (điểm cộng)

Có thể dùng GitHub Pages vì dự án là website tĩnh:

1. Đưa thư mục dự án lên một repository GitHub (giữ nguyên cấu trúc thư mục và bốn trang HTML).
2. Mở **Settings → Pages** của repository.
3. Ở phần Build and deployment, chọn **Deploy from a branch**, chọn nhánh chứa code và thư mục `/ (root)`, rồi **Save**.
4. Đợi GitHub Pages cấp URL; mở URL đó và kiểm tra trang chủ, chi tiết, giỏ hàng, admin.
5. Chạy kiểm thử trên URL đã triển khai. Các trang phải cùng origin để dùng chung Local Storage.

**Giới hạn khi triển khai:** GitHub Pages chỉ lưu frontend tĩnh. Local Storage của mỗi khách nằm trong trình duyệt riêng, nên đơn hàng và tồn kho không được chia sẻ giữa khách hàng hoặc máy tính khác. Nếu thầy yêu cầu một cửa hàng thực tế có dữ liệu tập trung, cần backend/database — điều này khác với yêu cầu hiện tại chỉ dùng Local Storage.
