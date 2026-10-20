# Admin TechStore — hướng dẫn sử dụng

## Chạy giao diện

1. Mở **`admin/index.html`** bằng Chrome. Đây là file ở bên trong thư mục `admin`, không phải `index.html` ngoài thư mục gốc.
2. Đăng nhập:
   - Email: **admin@techstore.vn**
   - Mật khẩu: **Admin123!**
3. Chọn một trong bảy mục quản lý ở menu. Bảy mục nghiệp vụ và màn hình đăng nhập riêng bao phủ các nhóm **I.1–I.8 của phần admin**.

Không cần cài thư viện, chạy Node.js, SQL Server, Live Server hoặc có Internet. Các tệp CSS, JavaScript và ảnh đều lấy từ dự án. Tìm kiếm/lọc được thực hiện khi bấm **Áp dụng** hoặc Enter trong ô tìm kiếm.

Phiên bản này lấy bố cục TechStore trong ZIP làm cơ sở: menu xanh đậm, nút xanh dương, thanh quản trị viên, ba thẻ thống kê và bảng dữ liệu. Phần quản trị được viết lại, thay màn hình đang xây dựng bằng các chức năng hoàn chỉnh trong phạm vi prototype.

## File cần đọc để học

```text
admin/
├── index.html                  # Khung đăng nhập, menu, vùng nội dung và hộp thoại
├── css/admin.css               # Màu sắc, bố cục TechStore và màn hình nhỏ
├── js/store.js                 # Dữ liệu và quy tắc nghiệp vụ
├── js/app.js                   # Hiển thị bảng/form và xử lý thao tác
├── HUONG-DAN.md
├── DOI-CHIEU-YEU-CAU.md         # Bảng đối chiếu từng dòng yêu cầu phần I
└── tests/
    ├── store.test.cjs          # Kiểm tra nghiệp vụ
    └── browser.test.cjs        # Kiểm tra thao tác trên Chrome
```

Dữ liệu sản phẩm gốc nằm ở `../products.js`, hình ảnh nằm ở `../images/`. File `products.js` không bị sửa khi quản trị viên thao tác; một bản dữ liệu riêng được lưu trong trình duyệt.

Học theo trình tự: xem HTML → xem các nhóm CSS có chú thích → đọc `renderCustomers()` trong `app.js` → đọc hàm mở form → theo dõi `persist()` gọi `TechStore.transact()` → đọc hàm nghiệp vụ tương ứng trong `store.js`.

## Thực hành từng chức năng

### Khách hàng

- Bảng hiển thị mã, tên, email, số điện thoại, trạng thái và ngày tạo.
- Nút **Chi tiết** hiển thị thêm địa chỉ, thời điểm đặt lại mật khẩu.
- **Khóa/Mở khóa** có hộp thoại xác nhận.
- **Đặt lại mật khẩu** yêu cầu mật khẩu mới 8–64 ký tự và nhập lại trùng khớp. Không hiển thị mật khẩu trong bảng.

### Loại sản phẩm

- Thêm, sửa tên/mô tả/lợi nhuận mặc định.
- Ẩn/hiện loại. Sản phẩm thuộc loại đã ẩn được ghi rõ trạng thái “Loại đã ẩn”.
- Chỉ xóa loại chưa có sản phẩm. Loại đã có sản phẩm nên dùng Ẩn để giữ liên kết.

### Sản phẩm

- Thêm đủ loại, mã, tên, ảnh, mô tả; bổ sung hãng, thông số điện tử và ngưỡng cảnh báo.
- Mã không được trùng và được giữ cố định sau khi tạo.
- Chọn ảnh có sẵn trong thư mục images hoặc tải ảnh từ máy tối đa 500 KB. Ảnh tải lên được lưu cùng dữ liệu để xem offline.
- Form sửa tự điền thông tin hiện tại; nút Xem hiển thị mô tả và thông số.
- Có ẩn/hiện; chỉ xóa được sản phẩm chưa có chứng từ hay lịch sử kho.
- Không nhập trực tiếp giá vốn hoặc tồn kho trong form sản phẩm. Sản phẩm mới có tồn bằng 0 và giá bán được thiết lập sau khi nhập hàng.

### Phiếu nhập

- Tìm theo mã phiếu, ghi chú hoặc tên sản phẩm; lọc khoảng ngày và trạng thái.
- Một phiếu có nhiều dòng; mỗi dòng gồm sản phẩm, số lượng nguyên dương và giá nhập dương.
- Không quản lý nhà cung cấp.
- **Lưu phiếu** tạo/sửa phiếu chưa hoàn thành; chưa tăng tồn kho.
- **Hoàn thành** có xác nhận, tăng tồn đúng một lần, tính lại giá vốn/giá bán và khóa sửa phiếu.
- Ngày, giờ nhập không được ở tương lai. Thời điểm nhập dùng để tra cứu kho; thời điểm bấm Hoàn thành cũng được ghi riêng.

### Giá bán

- Tìm theo tên/mã/hãng, lọc loại để xem giá vốn, lợi nhuận và giá bán.
- Bảng bên dưới cho sửa lợi nhuận theo loại.
- Nút Sửa lợi nhuận ở từng sản phẩm cho đặt mức riêng; để trống để dùng mức của loại.
- 0% là bán bằng giá vốn, không có nghĩa là quay về mức mặc định.
- Giá vốn bình quân di động sau mỗi lần nhập: `(tồn trước nhập × giá vốn cũ + số nhập × giá nhập) / (tồn trước nhập + số nhập)`.
- Giá bán: `giá vốn × (1 + lợi nhuận / 100)`, làm tròn đến đồng.

### Đơn hàng

- Bộ lọc kết hợp mã/tên khách, khoảng ngày đặt và tình trạng trong cùng một lần Áp dụng.
- Chi tiết có khách hàng, người nhận, số điện thoại, địa chỉ, thanh toán, dòng sản phẩm, giá lúc đặt và tổng tiền.
- Luồng dùng trong bản này: **Mới đặt → Đã xử lý → Đã giao**. Có thể **Hủy** trước khi giao.
- Chỉ chuyển Đã giao khi đủ hàng; xuất kho một lần, theo thời điểm giao. Đơn đã giao/hủy khóa tình trạng.
- Giá đã chốt trên đơn không bị đổi khi sửa giá bán sản phẩm.

### Tồn kho

- Lọc tên/mã/hãng, loại hoặc một sản phẩm cụ thể; chọn ngày và giờ cần tra cứu.
- Số tồn bao gồm các giao dịch có thời điểm nhỏ hơn hoặc bằng thời điểm đã chọn, chính xác đến phút.
- Cảnh báo nếu tồn ≤ ngưỡng của sản phẩm. Tồn bằng 0 hiển thị Hết hàng.
- Nút Lịch sử kho hiển thị chứng từ, thời điểm, nhập/xuất và tồn sau từng lần.
- Báo cáo bên dưới có khoảng thời gian riêng và lựa chọn theo từng sản phẩm hoặc tổng hợp theo loại; áp dụng cùng bộ lọc tên/loại/sản phẩm ở trên, không áp dụng ô “chỉ cảnh báo”.
- Tồn đầu là số lượng trước thời điểm bắt đầu. Nhập/xuất trong kỳ tính cả hai đầu thời gian. Luôn có **tồn đầu + nhập − xuất = tồn cuối** và dòng tổng cộng.

## Kịch bản demo ngắn

1. Thêm loại “Thiết bị demo”, lợi nhuận 20%.
2. Thêm sản phẩm `DEMO01`, chọn loại vừa tạo, ảnh có sẵn, mô tả và RAM.
3. Tạo phiếu nhập 10 sản phẩm, giá nhập 1.000.000 đồng. Lưu phiếu: tồn vẫn là 0.
4. Hoàn thành phiếu: tồn thành 10; giá vốn 1.000.000 đồng; giá bán 1.200.000 đồng.
5. Đặt lợi nhuận riêng 25%: giá bán thành 1.250.000 đồng. Để trống mức riêng để quay về mức theo loại.
6. Vào Tồn kho, chọn `DEMO01`; thử thời điểm trước và sau ngày giờ nhập. Xem báo cáo và lịch sử.
7. Với đơn mẫu, chuyển Mới đặt → Đã xử lý → Đã giao; quan sát tồn giảm và lịch sử xuất được thêm.
8. Khóa/mở khóa và reset mật khẩu một khách hàng mẫu, rồi tải lại trang để kiểm tra dữ liệu được giữ.

## Lưu trữ và phạm vi

- Dữ liệu mẫu: 20 sản phẩm có ảnh thật trong dự án, 3 loại, 6 khách hàng, 8 đơn với 4 tình trạng, phiếu nhập nháp/hoàn thành và lịch sử kho. Ngày mẫu được tính theo ngày khởi tạo.
- Dữ liệu lưu ở localStorage `techstore_admin_v2`, phiên đăng nhập ở sessionStorage `techstore_admin_session_v2`. Mỗi trình duyệt/đường dẫn có thể có bộ dữ liệu riêng.
- Mở bài bằng cùng trình duyệt, cùng đường dẫn để giữ dữ liệu. Cách xử lý localStorage dưới `file://` phụ thuộc trình duyệt; các luồng đã được thử trên Chrome.
- Bản mới dùng khóa dữ liệu riêng nên không tự sửa hay xóa dữ liệu Electro cũ.
- Đây là **clickable prototype cho phần admin**, phù hợp yêu cầu mở HTML local. Đăng nhập và mật khẩu khách hàng là mô phỏng, chỉ sử dụng thông tin thử nghiệm.
- Giao diện không sử dụng Node.js/SQL Server của ZIP. Chưa kết nối trang mua hàng, giỏ hàng hoặc đăng nhập khách hàng; khóa/reset chỉ cập nhật tài khoản mẫu của admin. Muốn dùng backend thật cần nối thêm API và kiểm thử tích hợp.
- Mục II của phiếu chấm (website khách hàng) và hai mục điểm cộng không thuộc lần làm lại admin này. Không coi việc hoàn thành admin là hoàn thành cả đồ án 10 điểm.

## Bản code cũ

Toàn bộ file admin cũ đã được thay, gồm HTML, CSS, JavaScript, hướng dẫn và kiểm thử. Bản sao lưu trước thay nằm ở:

```text
backups/admin-before-techstore-20261019.zip
```

ZIP này chứa nội dung bên trong thư mục admin cũ. Để khôi phục, nên giải nén ra một thư mục khác và đối chiếu trước khi thay bản mới. Dữ liệu ảnh và `products.js` của dự án vẫn được dùng làm nguồn.

## Kiểm thử cho người phát triển

Không cần chạy các lệnh này để sử dụng giao diện.

```text
node --check admin/js/store.js
node --check admin/js/app.js
node admin/tests/store.test.cjs
node admin/tests/browser.test.cjs
```

Kiểm thử nghiệp vụ chỉ cần Node.js. Kiểm thử trình duyệt cần Chrome và Playwright; mã thử sẽ tìm Playwright trong môi trường hoặc thư mục công cụ tạm đã cài khi phát triển. Có thể cài riêng bằng `npm install --prefix admin/tests --no-save playwright`. Các kiểm thử dùng dữ liệu riêng, không tác động tài khoản/dữ liệu đang mở của bạn.
