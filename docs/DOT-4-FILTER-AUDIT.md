# Đợt 4 — kiểm kê schema và nghiệm thu bộ lọc

Ngày nghiệm thu: 01/11/2026. Dữ liệu hiện tại có 120 sản phẩm hoạt động trong
7 danh mục. Bộ lọc chỉ chuẩn hóa ở tầng đọc; không sửa ngầm dữ liệu sản phẩm
trong Local Storage.

## Schema thực tế

| Danh mục | Số SP | Trường đủ dùng | Mức phủ |
|---|---:|---|---|
| Điện thoại (`L01`) | 25 | `company`, `ram`, `rom`, `os`, `screen`, `cpu`, `camara` | 25/25; một số giá trị `Không` được coi là thiếu |
| Máy tính bảng (`L02`) | 15 | `company`, `ram`, `rom`, `os`, `screen`, `cpu` | 15/15 |
| Laptop (`L04`) | 25 | `company`, `ram`, `rom`, `os`, `screen`, `cpu`, `gpu` | 25/25; `camara` chỉ 4/25 nên không lọc webcam |
| Tai nghe (`L05`) | 15 | `type`, `connection`, `noiseCancellation` | 15/15 |
| Đồng hồ (`L06`) | 10 | `size`, `screen`, `compatibility`, `waterResistance` | 10/10 |
| Loa (`L07`) | 10 | `connection`, `power` | kết nối 10/10; công suất đầu ra xác định được 8/10 |
| Phụ kiện (`L03`) | 20 | `accessoryType` và các field theo nhóm | 4 sản phẩm cho mỗi nhóm |

Chi tiết phụ kiện:

- Chuột: `connection` 4/4; DPI số có nghĩa 3/4, Apple không công bố bị loại khỏi lựa chọn.
- Bàn phím: `connection`, `layout`, `keyType` đều 4/4.
- Củ sạc: `power`, `ports`, `chargingStandard` đều 4/4.
- Cáp: `connectors`, `length` 4/4; công suất số xác định được 2/4.
- Pin dự phòng: `capacity`, `power`, `ports` đều 4/4.

## Chuẩn hóa tầng đọc

- Dung lượng: `8GB`, `8 GB`, `8 gb` → cùng giá trị so sánh `8 GB`.
- Lưu trữ vẫn phân biệt dung lượng; hậu tố `SSD` không làm `256GB` lệch khỏi
  `256 GB SSD` khi so sánh.
- Hãng bỏ khoảng trắng thừa và không phân biệt hoa/thường.
- Kết nối được tách thành các đặc tính có thể đồng thời đúng: Bluetooth,
  Wi‑Fi/AirPlay, USB, jack 3,5 mm và có dây.
- Công suất chuẩn hóa về W; biểu thức `2 × 10 W` thành `20 W`. Chuỗi “không
  công bố” hoặc công suất adapter/tiêu thụ không bị giả thành công suất loa.
- Dung lượng pin dự phòng chuẩn hóa `10000mAh`/`10.000 mAh`.
- GPU laptop được nhóm đúng họ Apple, Intel và từng dòng NVIDIA RTX.
- Giá trị trong cùng nhóm dùng OR bằng tham số URL lặp; các nhóm khác dùng AND.

## Nhóm lọc đã triển khai

- Tất cả sản phẩm: từ khóa, danh mục, hãng, giá, sắp xếp.
- Điện thoại: RAM, bộ nhớ, hệ điều hành, nhóm kích thước, CPU, camera đơn/đa.
- Tablet: RAM, bộ nhớ, hệ điều hành, nhóm kích thước, CPU.
- Laptop: RAM, SSD, hệ điều hành, kích thước, CPU và GPU.
- Tai nghe: kiểu, họ kết nối và chống ồn.
- Đồng hồ: kích thước mặt, loại màn hình, tương thích hệ điều hành, chống nước.
- Loa: họ kết nối và công suất đầu ra.
- Phụ kiện: loại phụ kiện; sau khi chọn đúng một loại sẽ hiện field riêng:
  chuột, bàn phím, củ sạc, cáp hoặc pin dự phòng. Cổng sạc/pin được tách thành
  số cổng và loại cổng.

## Chưa triển khai vì dữ liệu chưa đủ nhất quán

- Wi‑Fi/Cellular cho tablet: chưa có field riêng; chữ “WiFi” trong tên không
  đủ để suy ra mọi model.
- Webcam laptop: chỉ 4/25 sản phẩm có field.
- Pin/thời lượng pin dùng chung: dữ liệu đang trộn mAh, Wh, thời gian mỗi lần
  sạc, thời gian kèm hộp, GPS và thiết bị dùng nguồn AC.
- Camera tablet và camera theo số MP: dữ liệu đúng nhưng không phải tiêu chí ưu
  tiên, đồng thời cách mô tả camera kép chưa đủ đồng nhất cho lọc chi tiết.
- Các thông số chỉ nằm trong mô tả không được suy diễn thành field mới.

## Kịch bản nghiệm thu trên dữ liệu hiện tại

| # | Điều kiện | Mong đợi | Thực tế |
|---:|---|---:|---:|
| 1 | Không lọc | 120 | 120 |
| 2 | Tất cả, hãng Apple hoặc Samsung | 38 | 38 |
| 3 | Điện thoại, Apple hoặc Samsung | 7 | 7 |
| 4 | Điều kiện #3 AND RAM 3 GB | 3 | 3 |
| 5 | Điện thoại, RAM 6 GB AND bộ nhớ 64 GB | 2 | 2 |
| 6 | Tablet từ 11 inch | 8 | 8 |
| 7 | Laptop GPU NVIDIA RTX 4050 | 2 | 2 |
| 8 | Laptop RAM 16 GB | 15, 2 trang | 15, 2 trang |
| 9 | Tai nghe Over-ear AND ANC | 3 | 3 |
| 10 | Đồng hồ AMOLED AND 5ATM | 4 | 4 |
| 11 | Loa Bluetooth AND 20 W | 1 | 1 |
| 12 | Chuột Bluetooth | 3 | 3 |
| 13 | Bàn phím layout 80% TKL ANSI | 1 | 1 |
| 14 | Củ sạc 30 W | 1 | 1 |
| 15 | Cáp USB-C ↔ USB-C | 3 | 3 |
| 16 | Pin dự phòng 10.000 mAh | 3 | 3 |
| 17 | Laptop Apple/ASUS AND RTX 4050 | 1 | 1 |
| 18 | URL danh mục sai + `page=999` | bỏ danh mục sai, về trang 15/15 | đúng |
| 19 | Laptop → Tai nghe | bỏ RAM/GPU/CPU, giữ hãng Apple hợp lệ | 3 Apple, đúng |
| 20 | Admin thêm `NewBrand`, sửa kiểu, rồi ẩn | hiện 1 → lọc cũ còn 0 → bỏ hãng hết dùng | đúng |

Hai trang đầu của laptop sắp xếp giá tăng dần chứa 16 ID khác nhau, không có ID
trùng. Sản phẩm thiếu thuộc tính vẫn xuất hiện khi chưa lọc field đó và bị loại
khi field được chọn.

## URL và thao tác kiểm tra

- OR dùng tham số lặp, ví dụ
  `?category=L01&brand=Apple&brand=Samsung&ram=3+GB`.
- F5 hoặc sao chép URL giữ nguyên kết quả; Back/Forward được kiểm tra bằng
  browser test.
- `page=999` được thay bằng trang cuối hợp lệ; trang 1 không ghi `page=1`.
- Khi đổi danh mục, field đặc thù cũ bị xóa trước khi render và chip/URL cập
  nhật cùng lúc.
- Để kiểm tra sản phẩm Admin mới: thêm sản phẩm có field `detail`, tạo tồn đầu
  kỳ, mở storefront cùng origin; hãng và thuộc tính mới xuất hiện từ dữ liệu.
  Sửa/ẩn sản phẩm rồi quay lại storefront hoặc reload để thấy lựa chọn cập nhật.

## Hạn chế chuyển sang Đợt 5

- Nếu muốn lọc thời lượng pin, cần migration thêm các field có đơn vị rõ ràng
  như `batteryHours`, `caseBatteryHours`, `batteryWh` thay vì parse mô tả.
- Tablet cần field `connectivity` chính thức (`Wi‑Fi`, `Wi‑Fi + Cellular`).
- Có thể bổ sung test trình duyệt cho thao tác cảm ứng thật; hiện đã kiểm tra
  viewport 390 px, bàn phím, Escape, click ra ngoài và không tràn ngang.
