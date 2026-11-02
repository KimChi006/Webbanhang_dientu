# Báo cáo kiểm thử cuối

Ký hiệu **A**: tự động; **M**: kiểm tra thủ công theo kịch bản. Kết quả tại thời điểm nghiệm thu: PASS.

| Mã | Loại | Tính năng | Thao tác/dữ liệu | Mong đợi | KQ |
|---|---|---|---|---|---|
| T01 | A | HTML | 6 trang | script/asset tồn tại | PASS |
| T02 | A | Catalog | 120 sản phẩm | đủ 7 danh mục | PASS |
| T03 | A | Ảnh | toàn bộ catalog | local, không placeholder | PASS |
| T04 | A | Import | import lặp | không trùng mã | PASS |
| T05 | A | Migration | ảnh cũ/Admin | giữ ảnh Admin | PASS |
| T06 | A | Tìm kiếm | dấu/không dấu | kết quả đúng | PASS |
| T07 | A | Lọc | nhiều hãng | OR trong nhóm | PASS |
| T08 | A | Lọc | nhóm khác nhau | AND giữa nhóm | PASS |
| T09 | A | URL | Back/Forward | giữ điều kiện | PASS |
| T10 | A | URL | page=999 | clamp an toàn | PASS |
| T11 | A | Catalog | sắp xếp/trang | không lặp sản phẩm | PASS |
| T12 | A | Chi tiết | ID hợp lệ | mở đúng sản phẩm | PASS |
| T13 | A | Giỏ | sản phẩm mở rộng | tự import batch | PASS |
| T14 | A | Loại | thêm/sửa/xóa | chặn loại còn SP | PASS |
| T15 | A | Sản phẩm | mã/tồn | mã duy nhất | PASS |
| T16 | A | Phiếu nhập | nháp/nhiều dòng | validation đúng | PASS |
| T17 | A | Kho | hoàn thành phiếu | cộng đúng một lần | PASS |
| T18 | A | Giá | giá vốn/lợi nhuận | tính đúng | PASS |
| T19 | A | Đơn | trạng thái | chặn thiếu hàng | PASS |
| T20 | A | Kho | báo cáo thời điểm | cân bằng tồn | PASS |
| T21 | A | Khách | reset mật khẩu | giữ dữ liệu | PASS |
| T22 | A | Đồng thời | hai tab | chặn ghi đè | PASS |
| T23 | A | Dữ liệu | JSON hỏng | không tự xóa | PASS |
| T24 | A | Backup | export/restore | bảo toàn dữ liệu | PASS |
| T25 | A | Responsive | mobile Admin | không tràn ngang | PASS |
| T26 | A | Filter UI | Escape/click ngoài | popup đóng | PASS |
| T27 | A | Accessibility | Enter | popup mở | PASS |
| T28 | A | Browser | console | không lỗi | PASS |
| T29 | M | Desktop | 1920/1366 | header/card/filter rõ | PASS* |
| T30 | M | Tablet/mobile | 768/375 | không tràn ngang | PASS* |
| T31 | M | Giỏ trống | bỏ hết dòng | CTA quay mua sắm | PASS* |
| T32 | M | Hết hàng | số lượng vượt tồn | cảnh báo rõ | PASS* |

`*` được bao phủ một phần bởi browser test; nên lặp lại khi trình diễn trên máy nộp.
