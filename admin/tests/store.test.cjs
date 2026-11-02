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
test("Sao lưu (exportBackup) và Khôi phục (restoreBackup) bảo toàn dữ liệu", () => {
  S.save(db);
  const backupStr = S.exportBackup(db);
  const parsed = JSON.parse(backupStr);
  assert.equal(parsed.schema, 2);
  assert.ok(Array.isArray(parsed.data.products));
  assert.equal(parsed.data.products.length, db.products.length);

  // Thử khôi phục từ chuỗi backup
  const stats = S.restoreBackup(db, backupStr);
  assert.equal(stats.productCount, db.products.length);
  assert.equal(stats.categoryCount, db.categories.length);

  // Chặn dữ liệu backup hỏng
  assert.throws(() => S.restoreBackup(db, '{"schema": 1}'), /không tương thích/);
  assert.throws(() => S.restoreBackup(db, 'invalid-json'), /JSON/);
});

test("Nhập dữ liệu theo đợt (importBatch): thêm danh mục và sản phẩm mới kèm tồn kho", () => {
  const batch1 = {
    batchId: "batch-test-01",
    categories: [
      { id: "L99", name: "Loại Thử Nghiệm", description: "Mô tả test", profitRate: 25 }
    ],
    products: [
      {
        masp: "SP-TEST-01",
        name: "Sản phẩm test đợt 1",
        company: "TestBrand",
        categoryId: "L99",
        img: "images/" + S.assets[0],
        price: 10000000,
        stock: 15,
        threshold: 4,
        description: "Mô tả sản phẩm test",
        detail: { ram: "8 GB", rom: "128 GB" }
      }
    ]
  };

  let stats;
  change((d) => {
    stats = S.importBatch(d, batch1);
  });

  assert.equal(stats.addedCategories, 1);
  assert.equal(stats.addedProducts, 1);
  assert.equal(stats.skippedExisting, 0);

  const importedProd = db.products.find((p) => p.masp === "SP-TEST-01");
  assert.ok(importedProd);
  assert.equal(importedProd.company, "TestBrand");
  assert.equal(S.stock(db, "SP-TEST-01"), 15);
  assert.ok(S.sellingPrice(db, importedProd) > 0);
  assert.ok(db.importedBatches.includes("batch-test-01"));
});

test("Nhập dữ liệu theo đợt (importBatch): tính lũy tiến (idempotent), không nhân đôi sản phẩm", () => {
  const batch1Duplicate = {
    batchId: "batch-test-01",
    products: [
      {
        masp: "SP-TEST-01",
        name: "Tên bị thay đổi trong batch trùng",
        company: "TestBrand",
        categoryId: "L99",
        price: 20000000,
        stock: 50
      }
    ]
  };

  const initialProdCount = db.products.length;
  let stats;
  change((d) => {
    stats = S.importBatch(d, batch1Duplicate);
  });

  assert.equal(stats.addedProducts, 0);
  assert.equal(stats.skippedExisting, 1);
  assert.equal(db.products.length, initialProdCount);

  // Không bị ghi đè thông tin sản phẩm cũ
  const prod = db.products.find((p) => p.masp === "SP-TEST-01");
  assert.equal(prod.name, "Sản phẩm test đợt 1");
  assert.equal(S.stock(db, "SP-TEST-01"), 15);
});

test("Nhập dữ liệu theo đợt: không tự khôi phục sản phẩm đã bị xóa bởi admin", () => {
  // Tạo sản phẩm mới chưa có lịch sử kho
  change((d) => {
    S.saveProduct(d, {
      masp: "SP-DELETE-ME",
      name: "Sản phẩm sẽ bị xóa",
      company: "TestBrand",
      categoryId: "L99",
      img: "../images/" + S.assets[0],
      description: "Test delete",
      threshold: 5
    });
  });
  assert.ok(db.products.some((p) => p.masp === "SP-DELETE-ME"));

  // Admin xóa sản phẩm
  change((d) => {
    S.deleteProduct(d, "SP-DELETE-ME");
  });
  assert.ok(!db.products.some((p) => p.masp === "SP-DELETE-ME"));
  assert.ok(db.deletedProductCodes.includes("SP-DELETE-ME"));

  // Nhập đợt chứa sản phẩm vừa bị xóa
  const batchWithDeleted = {
    batchId: "batch-test-deleted",
    products: [
      {
        masp: "SP-DELETE-ME",
        name: "Sản phẩm sẽ bị xóa (tái nhập)",
        company: "TestBrand",
        categoryId: "L99",
        price: 5000000
      }
    ]
  };

  let stats;
  change((d) => {
    stats = S.importBatch(d, batchWithDeleted);
  });

  assert.equal(stats.addedProducts, 0);
  assert.equal(stats.skippedDeleted, 1);
  assert.ok(!db.products.some((p) => p.masp === "SP-DELETE-ME"));
});

test("Nhập dữ liệu theo đợt: fallback an toàn khi đường dẫn ảnh thiếu hoặc không hợp lệ", () => {
  const batchBadImage = {
    batchId: "batch-test-bad-img",
    products: [
      {
        masp: "SP-SAFE-IMG",
        name: "Sản phẩm ảnh không chuẩn",
        company: "TestBrand",
        categoryId: "L99",
        img: "javascript:evil()",
        price: 3000000,
        stock: 5
      }
    ]
  };

  let stats;
  change((d) => {
    stats = S.importBatch(d, batchBadImage);
  });

  assert.equal(stats.addedProducts, 1);
  const p = db.products.find((item) => item.masp === "SP-SAFE-IMG");
  assert.ok(S.safeImage(p.img));
  assert.equal(p.img, "../images/" + S.assets[0]);
});

test("Bộ 4 đợt dữ liệu chuẩn (EXPANSION_BATCHES) đạt tối thiểu 25 ĐT, 15 Tablet, 25 Laptop", () => {
  assert.equal(S.EXPANSION_BATCHES.length, 8);
  assert.equal(S.EXPANSION_BATCHES[0].products.length, 10);
  assert.equal(S.EXPANSION_BATCHES[1].products.length, 11);
  assert.equal(S.EXPANSION_BATCHES[2].products.length, 12);
  assert.equal(S.EXPANSION_BATCHES[3].products.length, 12);

  // Nạp toàn bộ 4 đợt chuẩn vào cơ sở dữ liệu
  let expandedDb;
  change((d) => {
    expandedDb = S.importStandardBatches(d);
  });

  const phones = expandedDb.products.filter((p) => p.categoryId === "L01");
  const tablets = expandedDb.products.filter((p) => p.categoryId === "L02");
  const laptops = expandedDb.products.filter((p) => p.categoryId === "L04");

  assert.equal(phones.length, 25, "Đạt đúng 25 điện thoại");
  assert.equal(tablets.length, 15, "Đạt đúng 15 máy tính bảng");
  assert.equal(laptops.length, 25, "Đạt đúng 25 laptop");
  assert.equal(phones.length + tablets.length + laptops.length, 65, "Tổng cộng 65 sản phẩm theo 3 danh mục chuẩn");

  // Kiểm tra mỗi nhóm có tối thiểu 3 hãng
  const phoneBrands = new Set(phones.map((p) => p.company.toLowerCase()));
  const tabletBrands = new Set(tablets.map((p) => p.company.toLowerCase()));
  const laptopBrands = new Set(laptops.map((p) => p.company.toLowerCase()));

  assert.ok(phoneBrands.size >= 3, "Điện thoại có ít nhất 3 hãng");
  assert.ok(tabletBrands.size >= 3, "Máy tính bảng có ít nhất 3 hãng");
  assert.ok(laptopBrands.size >= 3, "Laptop có ít nhất 3 hãng");

  // Kiểm tra tính lũy tiến (idempotency): Nạp lại đợt chuẩn không tạo trùng
  const currentCount = expandedDb.products.length;
  change((d) => {
    S.importStandardBatches(d);
  });
  assert.equal(db.products.length, currentCount, "Nạp lại không làm tăng số sản phẩm");

  // Kiểm tra không ghi đè sản phẩm admin đã sửa
  const p13 = db.products.find((p) => p.masp === "DT-IP13");
  assert.ok(p13);
  change((d) => {
    const target = d.products.find((p) => p.masp === "DT-IP13");
    target.name = "iPhone 13 128GB Đã Đổi Tên Bởi Admin";
  });
  change((d) => {
    S.importStandardBatches(d);
  });
  assert.equal(db.products.find((p) => p.masp === "DT-IP13").name, "iPhone 13 128GB Đã Đổi Tên Bởi Admin");
});


test("Toàn bộ 45 sản phẩm mở rộng đợt 2 dùng ảnh hoàn chỉnh, không dùng placeholder", () => {
  const expansionProds = S.EXPANSION_BATCHES.slice(0, 4).flatMap((b) => b.products);
  assert.equal(expansionProds.length, 45, "Đúng 45 sản phẩm đợt 2");

  const imagesDir = path.resolve(root, "images");
  for (const p of expansionProds) {
    const filename = path.basename(p.img);
    const fullPath = path.join(imagesDir, filename);

    // 1. Kiểm tra file tồn tại
    assert.ok(fs.existsSync(fullPath), `Ảnh ${p.img} của ${p.masp} (${p.name}) phải tồn tại trên ổ đĩa`);

    assert.notEqual(filename, "image-updating.svg", `${p.masp} không được dùng placeholder làm ảnh chính`);

    // 2. Kiểm tra dung lượng hợp lệ (> 5KB)
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 5000, `Ảnh ${filename} phải có dung lượng thực tế > 5KB (hiện tại: ${stat.size} bytes)`);

    // 3. Kiểm tra magic bytes ảnh nhị phân hợp lệ (không phải trang lỗi HTML)
    const buf = fs.readFileSync(fullPath);
    const magic = buf.slice(0, 4).toString("hex");
    const isJpeg = magic.startsWith("ffd8");
    const isPng = magic.startsWith("89504e47");
    const isWebp = magic.startsWith("52494646");
    assert.ok(
      isJpeg || isPng || isWebp,
      `Ảnh ${filename} phải có magic bytes hợp lệ (JPEG/PNG/WebP), nhận được ${magic}`
    );

    // 4. Kiểm tra nghiêm ngặt: MacBook KHÔNG dùng ảnh iPhone
    if (p.masp.startsWith("LT-AP")) {
      assert.ok(
        !p.img.toLowerCase().includes("iphone"),
        `MacBook ${p.masp} không được dùng ảnh iPhone: ${p.img}`
      );
      assert.ok(
        p.img.toLowerCase().includes("macbook"),
        `MacBook ${p.masp} phải dùng ảnh MacBook thật: ${p.img}`
      );
    }

    // 5. Kiểm tra nghiêm ngặt: Các đời iPad KHÔNG dùng chung ảnh iPad 2018 cũ
    if (p.masp.startsWith("TB-IP")) {
      assert.ok(
        !p.img.includes("ipad-wifi-32gb-2018"),
        `iPad ${p.masp} không được dùng ảnh iPad 2018 cũ: ${p.img}`
      );
    }

    // 6. Kiểm tra nghiêm ngặt: Laptop KHÔNG dùng ảnh điện thoại
    if (p.categoryId === "L04") {
      const phoneKeywords = ["iphone", "xiaomi-mi-8", "nokia-51-plus", "samsung-galaxy-j", "oppo-f9", "huawei-mate"];
      for (const kw of phoneKeywords) {
        assert.ok(
          !p.img.toLowerCase().includes(kw),
          `Laptop ${p.masp} không được dùng ảnh điện thoại ${kw}: ${p.img}`
        );
      }
    }
  }
});

test("Đợt 3 có đúng 55 sản phẩm, cân bằng phụ kiện, ảnh hợp lệ và nhập lặp an toàn", () => {
  const batch3 = S.EXPANSION_BATCHES.slice(4);
  assert.equal(batch3.map((batch) => batch.products.length).join(","), "15,10,10,20");

  const sourceProducts = vm.runInContext("list_products", context);
  const first = S.importStandardBatches(S.load(sourceProducts));
  const second = S.importStandardBatches(first);
  assert.equal(second.products.length, first.products.length, "Nhập lại không tạo sản phẩm trùng");
  assert.equal(new Set(second.products.map((p) => p.masp)).size, second.products.length);

  const expected = { L01: 25, L02: 15, L03: 20, L04: 25, L05: 15, L06: 10, L07: 10 };
  for (const [categoryId, count] of Object.entries(expected)) {
    assert.equal(
      second.products.filter((p) => p.categoryId === categoryId).length,
      count,
    );
  }
  assert.equal(
    second.products.filter((p) => Object.hasOwn(expected, p.categoryId)).length,
    120,
  );

  const accessories = second.products.filter((p) => p.categoryId === "L03");
  for (const type of ["Chuột", "Bàn phím", "Củ sạc", "Cáp", "Pin dự phòng"]) {
    assert.equal(
      accessories.filter((p) => p.detail.accessoryType === type).length,
      4,
      `Phụ kiện ${type} phải có đúng 4 sản phẩm`,
    );
  }

  for (const product of batch3.flatMap((batch) => batch.products)) {
    assert.equal(product.star, 0, `${product.masp} không được có đánh giá giả`);
    assert.equal(product.rateCount, 0, `${product.masp} không được có lượt đánh giá giả`);
    assert.match(product.description, /dữ liệu demo/i);
    assert.ok(Object.values(product.detail || {}).filter(Boolean).length >= 3);

    const fullPath = path.join(root, "images", path.basename(product.img));
    assert.ok(fs.existsSync(fullPath), `Thiếu ảnh ${product.img}`);
    assert.ok(fs.statSync(fullPath).size > 10000, `Ảnh ${product.img} quá nhỏ`);
    const magic = fs.readFileSync(fullPath).subarray(0, 4).toString("hex");
    assert.ok(
      magic.startsWith("ffd8") || magic.startsWith("89504e47") || magic.startsWith("52494646"),
      `Ảnh ${product.img} không có chữ ký JPEG/PNG/WebP hợp lệ`,
    );
  }
});

test("patchProductImagePaths cập nhật an toàn dữ liệu Local Storage cũ, giữ nguyên ảnh tùy chỉnh của Admin", () => {
  // Tạo cơ sở dữ liệu giả lập chứa các sản phẩm với đường dẫn ảnh cũ
  const testDb = {
    products: [
      { masp: "LT-APM1", name: "MacBook Air M1", img: "../images/iphone-x-256gb-silver-400x400.jpg" },
      { masp: "LT-APPR14", name: "MacBook Pro 14", img: "../images/iphone-x-256gb-silver-400x400.jpg" },
      { masp: "TB-IP9", name: "iPad Gen 9", img: "../images/ipad-wifi-32gb-2018-thumb-600x600.jpg" },
      { masp: "LT-ASVIVO15", name: "Asus Vivobook", img: "../images/xiaomi-mi-8-lite-black-1-600x600.jpg" },
      // Một sản phẩm do Admin tự sửa ảnh riêng
      { masp: "LT-DELLXPS13", name: "Dell XPS 13", img: "../images/anh-do-admin-tu-chup-xps13.jpg" },
    ]
  };

  const report = S.patchProductImagePaths(testDb);
  assert.equal(report.updated, 4, "Đã cập nhật đúng 4 sản phẩm có ảnh cũ");
  assert.equal(report.customKept, 1, "Giữ nguyên đúng 1 sản phẩm có ảnh tùy chỉnh riêng của admin");

  // Kiểm tra đường dẫn sau cập nhật
  assert.equal(testDb.products.find(p => p.masp === "LT-APM1").img, "../images/pilot-macbook-air-m1.jpg");
  assert.equal(testDb.products.find(p => p.masp === "LT-APPR14").img, "../images/macbook-pro-14-m3.jpg");
  assert.equal(testDb.products.find(p => p.masp === "TB-IP9").img, "../images/ipad-gen-9.png");
  assert.equal(testDb.products.find(p => p.masp === "LT-ASVIVO15").img, "../images/asus-vivobook-15.png");
  // Ảnh riêng của Admin được bảo vệ
  assert.equal(testDb.products.find(p => p.masp === "LT-DELLXPS13").img, "../images/anh-do-admin-tu-chup-xps13.jpg");

  // Chạy lại lần 2: phải idempotent (không thay đổi lặp lại)
  const report2 = S.patchProductImagePaths(testDb);
  assert.equal(report2.updated, 0, "Lần 2 không cập nhật thêm");
  assert.equal(report2.skipped, 4, "Lần 2 nhận diện 4 sản phẩm đã chuẩn");
  assert.equal(report2.customKept, 1, "Lần 2 vẫn giữ nguyên ảnh tùy chỉnh");
});

test("ảnh catalogue ưu tiên được ánh xạ theo đúng ID và có file local", () => {
  const expected = {
    "HP-MAJOR4": "../images/marshall-major-iv-studio.png",
    "HP-MOTIF2": "../images/marshall-motif-ii-anc-studio.png",
    "SW-AWU2": "../images/apple-watch-ultra-2-49mm-black-ocean.jpg",
    "LT-MSIMOD14": "../images/msi-modern-14-c12mo-815-studio.jpg",
    "LT-LENLEG5": "../images/lenovo-legion-5-16irx9-83dg004yvn.png",
  };
  for (const [id, image] of Object.entries(expected)) {
    assert.equal(S.CANONICAL_PRODUCT_IMAGES[id], image);
    assert.ok(fs.existsSync(path.join(root, "images", path.basename(image))));
  }
});

test("migration kiểm tra chéo đợt 2 vá dữ liệu cũ đúng một lần và giữ sửa riêng", () => {
  const oldDb = {
    products: [
      { masp: "Xia1", detail: { screen: "IPS LCD, 6.26', Full HD+", cpu: "Qualcomm Snapdragon 660 8 nhân", ram: "4 GB", battery: "3300 mAh, có sạc nhanh" } },
      { masp: "Opp0", name: "Oppo F9", company: "Oppo", detail: {} },
      { masp: "LT-HPVICT16", name: "HP Victus 16-r0129TX i5", categoryId: "L04", detail: { cpu: "Intel Core i5 13500H" } },
      { masp: "LT-LENLOQ", name: "Tên riêng do Admin đặt", categoryId: "L04", detail: { ram: "16 GB" } },
    ],
  };
  const first = S.patchBatch2Corrections(oldDb);
  assert.equal(first.skipped, false);
  assert.equal(oldDb.products[0].detail.cpu, "Qualcomm Snapdragon 845 8 nhân");
  assert.equal(oldDb.products[0].detail.ram, "6 GB");
  assert.equal(oldDb.products[1].company, "OPPO");
  assert.equal(oldDb.products[2].detail.cpu, "Intel Core i7 13700H");
  assert.equal(oldDb.products[2].detail.gpu, "NVIDIA GeForce RTX 3050 6 GB");
  assert.equal(oldDb.products[3].name, "Tên riêng do Admin đặt", "Không ghi đè tên Admin đã sửa");
  assert.equal(oldDb.products[3].detail.ram, "8 GB");
  assert.equal(oldDb.products[3].detail.gpu, "NVIDIA GeForce RTX 2050 4 GB");
  assert.equal(Array.from(oldDb.dataMigrations).join(","), "batch-02-audit-v1");

  const snapshot = JSON.stringify(oldDb);
  const second = S.patchBatch2Corrections(oldDb);
  assert.equal(second.skipped, true);
  assert.equal(JSON.stringify(oldDb), snapshot, "Chạy lại không thay đổi dữ liệu");
});

console.log(`Hoàn tất ${passed} nhóm kiểm tra nghiệp vụ.`);
