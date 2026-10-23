# TV2 — Giao diện mua sắm và quản lý loại sản phẩm

## Đối chiếu tài liệu gốc

Đã đọc `Phân chia đồ án Web.docx` và `BB_DoAn_LTWeb&UD.docx` trong Downloads. Phiếu yêu cầu gốc quy định các chức năng; bản phân chia xác định TV2 làm I.3, II.2 và nút mua trong II.3. Các đề xuất kỹ thuật trong bản phân chia được xem là hướng dẫn phối hợp, không phải tiêu chí bổ sung của giảng viên.

## Hiện trạng trước khi tiếp tục

- Admin đã có I.3: danh sách, thêm, sửa, ẩn/hiện và xóa loại chưa có sản phẩm. Tên trùng bị chặn, loại có sản phẩm không xóa cứng. Giữ nguyên nghiệp vụ này.
- Trang chủ đã có layout TechStore và đăng ký/đăng nhập/hồ sơ thông qua Node.js + SQL Server. Có danh sách và chi tiết hiển thị bên trong trang, chưa có tìm kiếm/phân trang; nút mua gọi hàm chưa tồn tại.
- `chi_tiet_sp.html` và `don-hang.html` là file trống.
- Danh sách sản phẩm, giá và tồn kho của trang bán đọc API SQL `/api/products`; màn hình sản phẩm và tồn kho trong admin đọc `/api/admin/products` sau đăng nhập quản trị thật.

## Phần đã thực hiện

| Yêu cầu | Thực hiện và kiểm tra |
| --- | --- |
| I.3 quản lý loại | Dùng màn hình Loại sản phẩm trong admin/index.html; không tạo bộ dữ liệu thứ hai. Thêm/sửa/ẩn/xóa đã có kiểm thử nghiệp vụ. |
| II.2 hiển thị theo loại | Bộ chọn loại lấy trực tiếp dữ liệu admin; loại ẩn và sản phẩm ẩn bị loại khỏi danh sách và chi tiết. |
| II.2 phân trang | 8 sản phẩm/trang; giữ tên, loại, giá trên URL khi đổi trang, mở chi tiết và quay lại. |
| II.2 tìm cơ bản | Nhập tên rồi Tìm kiếm/Enter; hỗ trợ tiếng Việt không dấu và không phân biệt hoa thường. |
| II.2 tìm nâng cao | Tên + loại + giá từ/đến áp dụng cùng thao tác; lọc trên toàn bộ kết quả trước khi phân trang. |
| II.2 kiểm tra giá | Số nguyên không âm; giá từ không vượt giá đến; kết quả rỗng có thông báo. |
| II.2 chi tiết | Tên, ảnh local, mã, mô tả, thông số điện tử, giá bán dùng chung TV5 và tồn kho. URL dùng mã sản phẩm, không dùng vị trí mảng. |
| II.3 tích hợp nút mua | Có tại danh sách và chi tiết, chung TechStoreCart.add; yêu cầu phiên CUSTOMER của /api/me; không mua hàng ẩn, hết hàng hoặc chưa có giá. |
| Bàn giao giỏ cho TV4 | Giỏ tối thiểu có xem, thay số lượng, xóa và tổng tiền, lưu riêng mỗi tài khoản. Chưa làm đặt hàng, thanh toán hoặc lịch sử đơn của TV4. |

## Mở và demo

1. Mở `index.html` hoặc `san-pham.html` để xem danh sách, lọc và phân trang. Mở HTML trực tiếp không cần Internet cho danh mục/chi tiết/quản lý loại.
2. Chọn Điện thoại, nhập tên Samsung, đặt khoảng giá rồi Tìm kiếm; xóa bộ lọc để thử phân trang với 20 sản phẩm ban đầu.
3. Mở Chi tiết và Quay lại kết quả để kiểm tra giữ bộ lọc/trang.
4. Mở `admin/index.html`, đăng nhập `admin@techstore.vn` / `Admin123!`, vào Loại sản phẩm. Ẩn một loại rồi tải lại trang mua sắm: sản phẩm thuộc loại biến mất. Hiện lại sau demo.
5. Thay giá, thêm sản phẩm và hoàn thành nhập hàng bằng nghiệp vụ admin: trang mua sắm đọc cùng giá/tồn/danh mục.
6. Chạy `node server.js` với SQL Server và `.env` của nhóm. Màn hình admin đăng nhập qua `/api/admin/login`; cửa hàng đọc sản phẩm SQL. Giỏ kiểm tra tồn qua `/api/products` trước khi lưu.

## Hợp đồng dữ liệu và bàn giao

- Giá và tồn hiển thị dùng các trường `gia` và `soLuongTon` từ API hiện có. Trạng thái lấy từ `trangThai`.
- Database không định nghĩa loại sản phẩm. Mã loại và mối gán loại hiện lấy từ dữ liệu quản lý loại/sản phẩm cục bộ, ghép với bản ghi SQL bằng `MaSP`. Bản ghi SQL chưa có gán loại được hiển thị là “Chưa phân loại”, không tự đoán.
- Ảnh admin dạng `../images/...` được đổi thành `images/...` khi hiển thị ở thư mục gốc. Data URI do admin tải lên vẫn được giữ.
- `products.js` vẫn xuất được cho Node.js, đồng thời chạy được trong trình duyệt nhờ kiểm tra biến module.
- TV4 có thể thay `window.TechStoreCart.add({productId, quantity})` bằng module chính thức. Chỉ resolve khi thực sự đã lưu, reject nếu không thể mua.
- Adapter hiện tại lưu mảng `{productId, quantity}` ở `techstore_cart_v1:<maKH>` và phát `techstore:cart-changed` sau thêm. Không lưu thông tin đăng nhập, không trừ kho khi thêm giỏ.
- `don-hang.html` trước đây trống, hiện làm trang giỏ tạm để liên kết có đích hoạt động; khi TV4 làm lịch sử đơn cần thống nhất tên file/đổi liên kết giỏ.
- API admin chỉ cung cấp danh sách/sửa sản phẩm theo schema hiện có; nó không cung cấp loại, lịch sử tồn kho, phiếu nhập hoặc giá vốn/lợi nhuận. Không coi các màn hình nghiệp vụ local khác là dữ liệu database.
- Dữ liệu localStorage cùng origin trên HTTP; dưới file:// cách chia dữ liệu theo đường dẫn tùy trình duyệt. Nên demo tích hợp các trang trên cùng origin HTTP.

## Kiểm tra đã chạy

- `node admin/tests/store.test.cjs`: qua 13 nhóm nghiệp vụ hiện có, bao gồm I.3.
- `node tests/catalog.test.cjs`: qua phân trang, lọc kết hợp, giá sai, kết quả rỗng, loại ẩn, chi tiết hợp lệ/không tồn tại, giỏ riêng tài khoản, chặn admin và vượt tồn.
- Kiểm tra cú pháp các script mới và các script inline trong HTML.
- Kiểm thử catalog dùng DOM mô phỏng trong Node, chưa thay thế kiểm tra giao diện thực tế. Công cụ duyệt trang từ chối URL file:// nên chưa xác nhận trực quan qua trình duyệt trong phiên này.
- Chưa kiểm thử endpoint với SQL Server thật vì thư mục làm việc không có `.env`. Thanh toán/đặt hàng/lịch sử đơn vẫn thuộc TV4.
