# Giới hạn thực tế

- Đây là đồ án frontend: dữ liệu nằm trong Local Storage, không đồng bộ giữa máy/trình duyệt và không phù hợp cho mật khẩu thật.
- Thanh toán, chuyển khoản và giao hàng chỉ mô phỏng; không có cổng thanh toán hay vận chuyển thực.
- Không có backend/database tập trung, xác thực server, phân quyền server, rate limiting hoặc audit trail production.
- Ảnh sản phẩm được lưu local; việc cập nhật catalogue trong tương lai cần tiếp tục đối chiếu model/SKU và quyền sử dụng ảnh.
- `file://` hoạt động trong browser test, nhưng một số trình duyệt có chính sách Local Storage riêng; Live Server cùng origin là cách demo khuyến nghị.
