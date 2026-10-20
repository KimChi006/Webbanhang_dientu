// Kiểm thử nghiệp vụ bằng Node, không sửa dữ liệu trình duyệt.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../..");
const memory = new Map();
const context = vm.createContext({
  window: {},
  localStorage: {
    getItem: (k) => memory.get(k) || null,
    setItem: (k, v) => memory.set(k, v),
  },
});
vm.runInContext(
  fs.readFileSync(path.join(root, "products.js"), "utf8"),
  context,
);
vm.runInContext(
  fs.readFileSync(path.join(root, "admin/js/store.js"), "utf8"),
  context,
);
const S = context.window.TechStore;
let db = S.load(context.list_products);
let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log("PASS " + name);
}
function change(fn) {
  db = S.transact(db, fn);
}
test("20 sản phẩm có ảnh offline đúng đường dẫn", () => {
  assert.equal(db.products.length, 20);
  for (const p of db.products)
    assert.ok(fs.existsSync(path.resolve(root, "admin", p.img)));
});
test("Tìm kiếm tiếng Việt không dấu, không phân biệt hoa thường", () => {
  assert.equal(S.normalize("ĐIỆN THOẠI"), "dien thoai");
});
test("Loại: thêm, sửa, chặn trùng và xóa khi còn sản phẩm", () => {
  change((d) => S.saveCategory(d, { name: "Kiểm thử", profitRate: 20 }));
  const c = db.categories.at(-1);
  assert.throws(
    () =>
      change((d) => S.saveCategory(d, { name: "KIỂM THỬ", profitRate: 20 })),
    /đã tồn tại/,
  );
  change((d) =>
    S.saveCategory(d, { name: "Loại kiểm thử", profitRate: 10 }, c.id),
  );
  assert.equal(db.categories.at(-1).name, "Loại kiểm thử");
  assert.throws(
    () => change((d) => S.deleteCategory(d, "L01")),
    /đã có sản phẩm/,
  );
});
const testCategory = db.categories.at(-1).id;
const input = {
  masp: "QA01",
  name: "Điện thoại thử nghiệm",
  company: "TechStore",
  categoryId: testCategory,
  img: "../images/" + S.assets[0],
  description: "Mô tả sản phẩm thử nghiệm",
  threshold: 3,
  detail: { ram: "8 GB" },
};
test("Sản phẩm: đủ trường, mã duy nhất và không sửa trực tiếp tồn", () => {
  change((d) => S.saveProduct(d, input));
  assert.equal(S.stock(db, "QA01"), 0);
  assert.equal(S.cost(db, "QA01"), 0);
  assert.throws(() => change((d) => S.saveProduct(d, input)), /đã tồn tại/);
  assert.throws(
    () =>
      change((d) =>
        S.saveProduct(d, { ...input, masp: "QA02", description: "" }),
      ),
    /Mô tả/,
  );
  assert.throws(
    () =>
      change((d) =>
        S.saveProduct(d, {
          ...input,
          masp: "QA02",
          img: "javascript:alert(1)",
        }),
      ),
    /ảnh/,
  );
  change((d) => S.saveProduct(d, { ...input, name: "Tên đã sửa" }, "QA01"));
  assert.equal(db.products.at(-1).name, "Tên đã sửa");
});
let receiptId;
test("Phiếu nháp: nhiều dòng, kiểm tra trùng/số lượng/giá/ngày", () => {
  const p = db.products[0];
  const draft = {
    at: S.now(),
    note: "Phiếu test",
    items: [
      { productId: "QA01", quantity: 10, cost: 1000000 },
      { productId: p.masp, quantity: 2, cost: 500000 },
    ],
  };
  change((d) => S.saveReceipt(d, draft));
  receiptId = db.imports[0].id;
  assert.equal(S.stock(db, "QA01"), 0);
  for (const bad of [{ quantity: 0 }, { quantity: 1.5 }, { cost: -1 }])
    assert.throws(() =>
      change((d) =>
        S.saveReceipt(d, { ...draft, items: [{ ...draft.items[0], ...bad }] }),
      ),
    );
  assert.throws(
    () =>
      change((d) =>
        S.saveReceipt(d, { ...draft, items: [draft.items[0], draft.items[0]] }),
      ),
    /trùng/,
  );
  assert.throws(
    () => change((d) => S.saveReceipt(d, { ...draft, at: "2099-01-01T12:00" })),
    /tương lai/,
  );
  assert.throws(
    () => change((d) => S.saveReceipt(d, { ...draft, at: "2026-02-30T12:00" })),
    /không hợp lệ/,
  );
});
test("Hoàn thành đúng một lần, sau đó khóa sửa phiếu", () => {
  change((d) => S.completeReceipt(d, receiptId));
  assert.equal(S.stock(db, "QA01"), 10);
  assert.equal(S.cost(db, "QA01"), 1000000);
  assert.throws(
    () => change((d) => S.completeReceipt(d, receiptId)),
    /hai lần/,
  );
  assert.equal(S.stock(db, "QA01"), 10);
  assert.throws(
    () =>
      change((d) =>
        S.saveReceipt(
          d,
          {
            at: S.now(),
            items: [{ productId: "QA01", quantity: 100, cost: 1000 }],
          },
          receiptId,
        ),
      ),
    /Chỉ sửa/,
  );
});
test("Giá vốn bình quân, lợi nhuận theo loại / riêng / 0%", () => {
  change((d) =>
    S.saveReceipt(d, {
      at: S.now(),
      items: [{ productId: "QA01", quantity: 10, cost: 2000000 }],
    }),
  );
  change((d) => S.completeReceipt(d, d.imports[0].id));
  assert.equal(S.cost(db, "QA01"), 1500000);
  assert.equal(S.sellingPrice(db, db.products.at(-1)), 1650000);
  change((d) => S.setMargin(d, "QA01", 20));
  assert.equal(db.products.at(-1).price, 1800000);
  change((d) => S.setMargin(d, testCategory, 30, true));
  assert.equal(db.products.at(-1).price, 1800000);
  change((d) => S.setMargin(d, "QA01", 0));
  assert.equal(db.products.at(-1).price, 1500000);
  change((d) => S.setMargin(d, "QA01", ""));
  assert.equal(db.products.at(-1).price, 1950000);
});
test("Đơn hàng: 4 trạng thái, xuất kho một lần, bảo vệ thiếu hàng", () => {
  change((d) =>
    d.orders.push({
      id: "QA-DH",
      status: "new",
      items: [{ productId: "QA01", name: "QA", quantity: 3, price: 1500000 }],
    }),
  );
  assert.throws(
    () => change((d) => S.changeOrder(d, "QA-DH", "delivered")),
    /Không thể/,
  );
  change((d) => S.changeOrder(d, "QA-DH", "processed"));
  assert.equal(S.stock(db, "QA01"), 20);
  change((d) => S.changeOrder(d, "QA-DH", "delivered"));
  assert.equal(S.stock(db, "QA01"), 17);
  assert.throws(() => change((d) => S.changeOrder(d, "QA-DH", "delivered")));
  assert.throws(() => change((d) => S.changeOrder(d, "QA-DH", "cancelled")));
  change((d) =>
    d.orders.push({
      id: "QA-EMPTY",
      status: "processed",
      items: [{ productId: "QA01", name: "QA", quantity: 99, price: 1 }],
    }),
  );
  const length = db.ledger.length;
  assert.throws(
    () => change((d) => S.changeOrder(d, "QA-EMPTY", "delivered")),
    /Không đủ/,
  );
  assert.equal(db.ledger.length, length);
  change((d) => S.changeOrder(d, "QA-EMPTY", "cancelled"));
  assert.equal(S.stock(db, "QA01"), 17);
});
test("Tồn theo thời điểm, báo cáo cân bằng, phiếu nháp không cộng kho", () => {
  assert.equal(S.stock(db, "QA01", S.ago(1, "23:59")), 0);
  for (const p of db.products) {
    const r = S.report(db, p.masp, S.ago(20, "00:00"), S.now());
    assert.equal(r.opening + r.incoming - r.outgoing, r.closing);
  }
  assert.throws(() => S.report(db, "QA01", S.now(), S.ago(1)), /bắt đầu/);
});
test("Sản phẩm có lịch sử không xóa được; sản phẩm mới xóa được", () => {
  assert.throws(() => change((d) => S.deleteProduct(d, "QA01")), /lịch sử/);
  change((d) => S.saveProduct(d, { ...input, masp: "REMOVE" }));
  change((d) => S.deleteProduct(d, "REMOVE"));
  assert.equal(
    db.products.some((p) => p.masp === "REMOVE"),
    false,
  );
  change((d) => S.saveCategory(d, { name: "Loại trống", profitRate: 0 }));
  const id = db.categories.at(-1).id;
  change((d) => S.deleteCategory(d, id));
  assert.equal(
    db.categories.some((c) => c.id === id),
    false,
  );
});
test("Reset mật khẩu: kiểm tra độ dài, lưu lại và không mất dữ liệu", () => {
  assert.throws(() => change((d) => S.resetPassword(d, "KH001", "123")));
  change((d) => S.resetPassword(d, "KH001", "Password123!"));
  assert.equal(S.load([]).customers[0].password, "Password123!");
});
test("Không ghi đè dữ liệu khi hai tab cùng sửa", () => {
  const stale = db;
  change((d) => (d.customers[0].locked = true));
  assert.throws(
    () => S.transact(stale, (d) => (d.customers[0].locked = false)),
    /tab khác/,
  );
});
test("JSON hỏng không bị tự động xóa hoặc khởi tạo lại", () => {
  memory.set(S.KEY, "broken");
  assert.throws(() => S.load([]), /lỗi định dạng/);
  assert.equal(memory.get(S.KEY), "broken");
});
console.log(`Hoàn tất ${passed} nhóm kiểm tra nghiệp vụ.`);
