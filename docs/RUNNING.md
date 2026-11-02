# Chạy và nghiệm thu TechStore

Mở thư mục bằng VS Code, chạy `index.html` bằng Live Server và mở `admin/index.html` trên **cùng origin**. Có thể mở trực tiếp `file://`; bộ browser test đã kiểm tra chế độ này, nhưng Local Storage có thể bị trình duyệt cô lập theo origin.

Tài khoản Admin: `admin@techstore.vn` / `Admin123!`. Khách demo: `hoangnam@example.com` / `Khach123!`.

Chạy kiểm thử:

```text
node tests/html.test.cjs
node tests/integration.test.cjs
node tests/catalog.test.cjs
node admin/tests/store.test.cjs
node admin/tests/browser.test.cjs
```

Sao lưu/khôi phục dùng các nút trong Admin; thao tác trên dữ liệu Local Storage cùng origin. Catalog tự gọi `importStandardBatches` an toàn, lặp lại không tạo trùng và không khôi phục sản phẩm Admin đã xóa.
