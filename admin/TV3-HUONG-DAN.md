# Thành viên 3 — Sản phẩm và nhập hàng

Phạm vi: Phan-viec (2).docx, I.4 và I.5 trong biên bản đồ án (1,75 điểm theo bảng phân công). Tài liệu thực hành tuần 11 hướng dẫn bảng danh sách/menu admin; tuần 12–13 hướng dẫn form và kiểm tra dữ liệu. Giữ bố cục TechStore hiện có của nhóm.

## Chạy và kiểm tra

**Chấm giao diện offline:** mở `admin/index.html`, đăng nhập `admin@techstore.vn / Admin123!`. Tất cả tab hiện có vẫn chạy bằng localStorage. Dữ liệu offline không tự đồng bộ vào SQL.

**Sản phẩm và nhập hàng dùng SQL:**

1. Cài dependency dự án bằng `npm ci`.
2. Chuẩn bị database theo các script SQL hiện có, sau đó chạy `sql/TV3-SanPham-PhieuNhap.sql` trong SQL Server Management Studio. Script giữ dữ liệu cũ, thêm bảng; mở rộng cột ảnh để lưu ảnh upload.
3. Cấu hình `.env` theo backend của nhóm: `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_INSTANCE` nếu có, `SESSION_SECRET`, `PORT` (mặc định 4000). Không commit `.env`.
4. Chạy `node server.js`, mở `http://localhost:4000/admin/index.html?source=server`.
5. Đăng nhập bằng tài khoản ADMIN thật trong SQL. Chế độ này chỉ hiển thị hai tab TV3 đã kết nối. Liên kết trên màn hình đăng nhập chuyển về bản thực hành đầy đủ.

## Chức năng theo tiêu chí

| Tiêu chí | Thao tác kiểm tra |
| --- | --- |
| I.4 thêm | Chọn loại, mã duy nhất, tên, hãng, ảnh có sẵn/upload, mô tả, thông số điện tử; sản phẩm mới có tồn 0 |
| I.4 sửa | Mở Sửa: dữ liệu cũ điền sẵn, giữ mã để bảo toàn liên kết chứng từ |
| I.4 xóa/ẩn | Ẩn/hiện; chỉ xóa sản phẩm chưa có lịch sử kho/phiếu; SQL còn ràng buộc FK sẽ từ chối xóa |
| I.5 danh sách/tìm | Tìm mã phiếu, ghi chú, tên/mã sản phẩm; lọc ngày và trạng thái; phân trang |
| I.5 tạo | Ngày giờ, nhiều dòng sản phẩm, số lượng nguyên dương, giá nhập dương; không có nhà cung cấp |
| I.5 sửa/hoàn thành | Chỉ sửa phiếu nháp; hoàn thành cộng kho, khóa sửa và chặn hoàn thành lần hai |

SQL dùng transaction và khóa ứng dụng cho các lệnh TV3, revision phát hiện dữ liệu đã thay đổi ở phiên khác. Bút toán nhập có khóa duy nhất `(MaPhieu, MaSP)`. Bất kỳ lỗi ghi nào đều rollback toàn bộ phiếu và tồn kho. Tổng tiền vượt giới hạn số nguyên chính xác bị từ chối.

## File để làm tiếp

- `admin/js/app.js`: form, danh sách, bộ lọc dùng chung.
- `admin/js/store.js`: kiểm tra và nghiệp vụ thuần, dùng cả browser và Node.
- `admin/js/tv3-api.js`: gọi API, ánh xạ thao tác của form thành lệnh.
- `server/tv3.js`: đọc/ghi SQL, giao dịch nhập kho.
- `sql/TV3-SanPham-PhieuNhap.sql`: migration.

API `GET /api/admin/tv3/state` trả products/imports/ledger/categories/revision. `POST /api/admin/tv3/command` nhận `{revision,type,id?,input?}`, type là `saveProduct`, `deleteProduct`, `toggleProduct`, `saveReceipt`, `completeReceipt`. Tất cả yêu cầu phiên ADMIN qua middleware hiện có. Lỗi revision trả 409; tải lại trang trước khi sửa tiếp.

## Bàn giao TV2, TV4, TV5

- Sản phẩm ghi vào `SanPham`, nên `/api/products` của trang mua hàng thấy tên/ảnh/thông số/trạng thái mới sau tải lại. Endpoint trả thêm `categoryId`, `description`; TV2 cần sử dụng các trường này trong giao diện. Các tên trường API cũ được giữ nguyên.
- `TV3SanPham.DuLieu` giữ loại, mô tả và ngưỡng cảnh báo; thông số chính vẫn trong các cột `SanPham`. Loại tạm dùng chung bộ mã L01 điện thoại, L02 máy tính bảng, L03 phụ kiện của admin mẫu. TV2 cần nối danh mục SQL thật vào `state()` khi triển khai phần I.3.
- `PhieuNhap.DuLieu` chứa đầu phiếu và các dòng (productId/quantity/cost); `NhatKyNhap` chỉ chứa phiếu hoàn thành, có ngày, số lượng và đơn giá cho TV5 tính giá vốn/nhập–xuất–tồn. `SanPham.SoLuongTon` cộng đúng lượng hoàn thành. TV4 cần dùng giao dịch xuất kho tương ứng khi giao hàng.
- TV3 không tự sửa giá bán. Tồn có trước tích hợp được hiển thị bằng số dư nhưng chưa có giá vốn gốc; TV5 cần bổ sung dữ liệu giá vốn đầu kỳ và sổ xuất. Không lấy giá bán làm giá vốn.
- Các API sản phẩm cũ vẫn tương thích, nhưng không còn ghi trực tiếp số lượng tồn. Khi ghép các writer của nhóm, dùng chung quy tắc giao dịch/revision để tránh sửa đè giữa API cũ và mới.

## Kiểm thử

```sh
node admin/tests/store.test.cjs
node admin/tests/tv3.test.cjs
node admin/tests/browser.test.cjs
node admin/tests/tv3-browser.test.cjs
```

Hai bộ browser cần Playwright và Chrome cài sẵn. Test tv3-browser dùng API giả lập, kiểm tra nối UI, không xác nhận SQL. Chưa kiểm chứng migration và giao dịch trên SQL thật trong phiên triển khai vì checkout không có `.env`. Khi có database kiểm thử: tạo sản phẩm, tạo/sửa phiếu 2 dòng, hoàn thành đồng thời ở 2 phiên, kiểm tra SQL chỉ cộng kho 1 lần, refresh trang mua hàng kiểm tra ẩn/hiện và sửa sản phẩm.
