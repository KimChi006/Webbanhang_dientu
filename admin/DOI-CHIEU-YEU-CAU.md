# Đối chiếu phần admin với phiếu chấm

Nguồn: `BB_DoAn_LTWeb&UD (1) (1).docx`, phần **I. Các chức năng cho người chủ / quản lý cửa hàng (admin)**. Đây là bảng đối chiếu chức năng, không phải cam kết điểm của giảng viên.

| Tiêu chí                                                                             | Cách thực hiện trong TechStore                                                          | Cách kiểm tra                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| I.1 — Đăng nhập không dùng chung với khách hàng                                      | Màn hình đăng nhập riêng tại `admin/index.html`, tài khoản quản trị và khóa phiên riêng | Nhập sai bị báo lỗi, đúng vào quản trị; đăng xuất trở lại form |
| I.1 — Danh mục chức năng quản trị                                                    | Menu có khách hàng, loại, sản phẩm, nhập hàng, giá bán, đơn hàng, tồn kho               | Bấm từng mục, không có trang “đang xây dựng”                   |
| I.2 — Danh sách thông tin khách hàng                                                 | Bảng và Chi tiết gồm mã, tên, email, điện thoại, địa chỉ, ngày tạo, trạng thái          | Mở Chi tiết một khách                                          |
| I.2 — Reset mật khẩu                                                                 | Form nhập mới, xác nhận trùng, kiểm tra độ dài, lưu trên dữ liệu mẫu                    | Reset rồi tải lại trang; ngày reset được ghi nhận              |
| I.2 — Khóa/mở khóa                                                                   | Nút và hộp thoại xác nhận, bảng/thống kê cập nhật                                       | Khóa rồi mở khóa cùng tài khoản                                |
| I.3 — Thêm, sửa, xóa/ẩn loại                                                         | Có form, kiểm tra trùng tên, ẩn/hiện, xóa loại chưa có sản phẩm                         | Loại có sản phẩm không xóa; có thể ẩn                          |
| I.4 — Thêm sản phẩm gồm loại, mã, tên, hình, mô tả                                   | Form có đủ trường bắt buộc và thông số điện tử                                          | Thử bỏ trống, nhập trùng mã; thêm với ảnh local                |
| I.4 — Sửa hiển thị đúng thông tin trước sửa                                          | Form điền sẵn cả ảnh, loại, mô tả và thông số                                           | Mở Sửa, so với Chi tiết                                        |
| I.4 — Xóa/ẩn sản phẩm                                                                | Ẩn/hiện; xóa khi chưa có chứng từ/lịch sử                                               | Sản phẩm đã nhập chỉ được ẩn để giữ lịch sử                    |
| I.5 — Hiển thị và tìm danh mục phiếu nhập                                            | Bảng có mã, ngày, số lượng, tổng tiền, trạng thái; tìm kiếm và lọc                      | Tìm mã phiếu, ghi chú, tên sản phẩm, ngày                      |
| I.5 — Thêm phiếu: ngày, giá nhập, số lượng từng sản phẩm, không quản lý nhà cung cấp | Phiếu nhiều dòng, tổng tiền tự tính, số lượng/giá dương, chống trùng                    | Thêm ít nhất hai dòng khác nhau                                |
| I.5 — Sửa và hoàn thành, chỉ sửa trước hoàn thành                                    | Sửa nháp, xác nhận hoàn thành, ghi kho một lần, khóa sửa                                | Tồn chỉ tăng sau Hoàn thành; không còn nút Sửa                 |
| I.6 — Nhập/sửa % lợi nhuận theo loại và sản phẩm                                     | Hai bảng trong Giá bán, mức riêng ưu tiên, có 0% hoặc dùng theo loại                    | Đổi mức loại rồi mức riêng; để trống mức riêng                 |
| I.6 — Tra cứu giá vốn, % lợi nhuận, giá bán                                          | Bảng giá có đủ ba cột, tìm kiếm và lọc loại                                             | Nhập hàng, đổi lợi nhuận và đối chiếu công thức                |
| I.7 — Tra cứu theo khoảng ngày đặt và tình trạng                                     | Các bộ lọc kết hợp trong một lần Áp dụng                                                | Chọn cùng ngày từ/đến và một trạng thái                        |
| I.7 — Chi tiết và cập nhật mới đặt/đã xử lý/đã giao/hủy                              | Chi tiết đủ hàng/khách/địa chỉ/thanh toán, chuyển trạng thái hợp lệ                     | Chuyển xử lý → giao; thử hủy một đơn khác                      |
| I.8 — Tồn sản phẩm hoặc theo loại tại một thời điểm                                  | Tìm tên/mã, chọn loại hoặc sản phẩm, chọn ngày giờ                                      | So sánh trước/sau một lần nhập                                 |
| I.8 — Cảnh báo sắp hết                                                               | Ngưỡng riêng sản phẩm, nhãn Hết/Sắp hết, bộ lọc cảnh báo                                | Tồn ≤ ngưỡng được cảnh báo                                     |
| I.8 — Nhập–xuất–tồn theo sản phẩm/loại trong khoảng thời gian                        | Báo cáo có thời điểm từ/đến, từng sản phẩm hoặc tổng hợp loại, tổng cộng                | Kiểm tra tồn đầu + nhập − xuất = tồn cuối                      |
| Ghi chú chấm — Mở HTML local, hình/tiếng Việt đầy đủ                                 | Script thường, ảnh local, UTF-8; không gọi API hay CDN                                  | Tắt mạng, mở trực tiếp `admin/index.html` trên Chrome          |

## Quy ước triển khai không được phiếu chấm định nghĩa chi tiết

- Giá vốn dùng bình quân di động; giá bán là giá vốn cộng tỉ lệ lợi nhuận trên vốn.
- Kho giảm ở thời điểm chuyển đơn thành Đã giao. Đơn đã giao/hủy không chuyển ngược trạng thái.
- Tra cứu thời điểm chính xác đến phút. Khoảng báo cáo bao gồm cả hai mốc đầu/cuối.
- Dữ liệu ban đầu là mẫu; lịch sử tồn đầu kỳ được ghi trước ngày khởi tạo 40 ngày.
- Loại hoặc sản phẩm có liên kết không xóa cứng; sử dụng ẩn để bảo vệ dữ liệu.
- Tất cả thao tác của bản local lưu trong trình duyệt; không có máy chủ xác thực hoặc cơ sở dữ liệu dùng chung.

## Phạm vi còn nằm ngoài admin

Phần II của phiếu chấm (đăng ký/đăng nhập khách hàng, tìm mua sản phẩm, giỏ hàng, đặt hàng, lịch sử mua) chưa được triển khai trong lần làm lại này. Điểm cộng thiết kế đồ họa/triển khai Internet cũng không được tự coi là đã đạt. Để hoàn thành toàn bộ đồ án, nhóm cần làm và kiểm thử phần khách hàng cùng tích hợp dữ liệu giữa hai phần.
