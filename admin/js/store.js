/* DỮ LIỆU VÀ NGHIỆP VỤ — không chứa HTML.
 * App gọi các hàm này khi người dùng lưu form.
 * Tồn kho chỉ thay đổi qua phiếu nhập hoàn thành hoặc đơn đã giao.
 */
(function () {
  "use strict";
  const KEY = "techstore_admin_v2";
  const SESSION_KEY = "techstore_admin_session_v2";
  const ADMIN = { email: "admin@techstore.vn", password: "Admin123!" };
  const pad = (n) => String(n).padStart(2, "0");
  const localTime = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const now = () => localTime(new Date());
  const ago = (days, time = "09:00") => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return localTime(d).slice(0, 10) + "T" + time;
  };
  const uid = (prefix) =>
    prefix +
    "-" +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 5).toUpperCase();
  const normalize = (text) =>
    String(text ?? "")
      .normalize("NFD")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  function requireValue(condition, message) {
    if (!condition) throw new Error(message);
  }
  function text(value, label, limit = 200) {
    const v = String(value ?? "").trim();
    requireValue(
      v.length > 0 && v.length <= limit,
      `${label} phải có từ 1 đến ${limit} ký tự.`,
    );
    return v;
  }
  function number(value, label, min, max, integer = false) {
    requireValue(
      value !== "" && value !== null && value !== undefined,
      `Vui lòng nhập ${label.toLowerCase()}.`,
    );
    const n = Number(value);
    requireValue(
      Number.isFinite(n) &&
        n >= min &&
        n <= max &&
        (!integer || Number.isSafeInteger(n)),
      `${label} phải ${integer ? "là số nguyên và " : ""}nằm trong khoảng ${min.toLocaleString("vi-VN")}–${max.toLocaleString("vi-VN")}.`,
    );
    return n;
  }
  function timestamp(value) {
    requireValue(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) &&
        Number.isFinite(new Date(value).getTime()) &&
        localTime(new Date(value)) === value,
      "Ngày, giờ không hợp lệ.",
    );
    return value;
  }
  function safeImage(value) {
    return (
      typeof value === "string" &&
      (/^(\.\.\/images\/[a-z0-9_.-]+\.(jpg|jpeg|png|webp|gif))$/i.test(value) ||
        /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(value))
    );
  }
  const assets = [
    "samsung-galaxy-j4-plus-pink-400x400.jpg",
    "xiaomi-mi-8-lite-black-1-600x600.jpg",
    "oppo-f9-red-600x600.jpg",
    "nokia-51-plus-black-18thangbh-400x400.jpg",
    "samsung-galaxy-a8-plus-2018-gold-600x600.jpg",
    "iphone-x-256gb-silver-400x400.jpg",
    "oppo-a3s-32gb-600x600.jpg",
    "samsung-galaxy-j8-600x600-600x600.jpg",
    "ipad-wifi-32gb-2018-thumb-600x600.jpg",
    "iphone-7-plus-32gb-hh-600x600.jpg",
    "xiaomi-mi-8-1-600x600.jpg",
    "xiaomi-redmi-5-plus-600x600.jpg",
    "xiaomi-redmi-note-5-pro-600x600.jpg",
    "huawei-mate-20-pro-green-600x600.jpg",
    "huawei-nova-3-2-600x600.jpg",
    "huawei-y5-2017-300x300.jpg",
    "mobiistar-b310-orange-600x600.jpg",
    "mobiistar-e-selfie-300-1copy-600x600.jpg",
    "mobiistar-x-3-600x600.jpg",
    "mobiistar-zumbo-s2-dual-300x300.jpg",
  ];
  function seed(source) {
    const products = source
      .filter((p) => assets.includes(p.img.split("/").pop()))
      .map((p) => ({
        ...p,
        price: Number(String(p.price).replace(/\./g, "")),
        img: "../images/" + p.img.split("/").pop(),
        categoryId: /ipad/i.test(p.name) ? "L02" : "L01",
        description: `${p.name}. Bộ nhớ ${p.detail.rom || "đang cập nhật"}, RAM ${p.detail.ram || "đang cập nhật"}.`,
        hidden: false,
        profitRate: null,
        threshold: 5,
      }));
    const categories = [
      {
        id: "L01",
        name: "Điện thoại",
        description: "Điện thoại thông minh và phổ thông",
        profitRate: 20,
        hidden: false,
      },
      {
        id: "L02",
        name: "Máy tính bảng",
        description: "Máy tính bảng phục vụ học tập và giải trí",
        profitRate: 18,
        hidden: false,
      },
      {
        id: "L03",
        name: "Phụ kiện",
        description: "Phụ kiện cho thiết bị điện tử",
        profitRate: 25,
        hidden: false,
      },
    ];
    const names = [
      "Nguyễn Minh Anh",
      "Trần Hoàng Nam",
      "Lê Thu Hà",
      "Phạm Quốc Bảo",
      "Võ Ngọc Linh",
      "Đặng Gia Huy",
    ];
    const customers = names.map((name, i) => ({
      id: "KH00" + (i + 1),
      name,
      email:
        ["minhanh", "hoangnam", "thuha", "quocbao", "ngoclinh", "giahuy"][i] +
        "@example.com",
      phone: "090123456" + i,
      address: 12 + i * 8 + " Nguyễn Trãi, TP. Hồ Chí Minh",
      createdAt: ago(25 - i),
      locked: i === 3,
      password: "Khach123!",
      passwordUpdatedAt: null,
    }));
    const ledger = products.map((p, i) => ({
      id: "OPEN-" + p.masp,
      productId: p.masp,
      at: ago(40),
      quantity: i < 4 ? i + 2 : 12 + i,
      cost: Math.round(p.price / 1.2),
      kind: "opening",
      reference: "Tồn đầu kỳ",
    }));
    const imports = [];
    if (products.length > 4) {
      const p = products[4],
        cost = ledger[4].cost;
      imports.push({
        id: "PN1001",
        at: ago(10),
        status: "completed",
        note: "Phiếu nhập mẫu đã hoàn thành",
        items: [{ productId: p.masp, quantity: 8, cost }],
        completedAt: ago(10),
      });
      ledger.push({
        id: "PN1001-0",
        productId: p.masp,
        at: ago(10),
        quantity: 8,
        cost,
        kind: "import",
        reference: "PN1001",
      });
      imports.push({
        id: "PN1002",
        at: now(),
        status: "draft",
        note: "Bổ sung điện thoại sắp hết hàng",
        items: [
          { productId: products[0].masp, quantity: 10, cost: ledger[0].cost },
        ],
      });
    }
    const orders = products.length
      ? Array.from({ length: 8 }, (_, i) => {
          const p = products[i % products.length],
            c = customers[i % customers.length],
            status = ["new", "processed", "delivered", "cancelled"][i % 4],
            id = "DH" + (1008 - i);
          const order = {
            id,
            customerId: c.id,
            createdAt: ago(i + 1, "10:00"),
            status,
            address: c.address,
            recipient: c.name,
            phone: c.phone,
            payment: i % 2 ? "Chuyển khoản" : "Tiền mặt khi nhận hàng",
            note: "Đơn hàng mẫu",
            items: [
              { productId: p.masp, name: p.name, quantity: 1, price: p.price },
            ],
          };
          if (status === "delivered") {
            order.deliveredAt = ago(i + 1, "16:00");
            ledger.push({
              id: "OUT-" + id,
              productId: p.masp,
              at: order.deliveredAt,
              quantity: -1,
              kind: "sale",
              reference: id,
            });
          }
          return order;
        })
      : [];
    const db = {
      schema: 2,
      revision: 0,
      initializedAt: now(),
      categories,
      products,
      customers,
      imports,
      orders,
      ledger,
    };
    db.products.forEach((p) => (p.price = sellingPrice(db, p)));
    return db;
  }
  function save(db) {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      throw new Error(
        "Không lưu được dữ liệu. Bộ nhớ trình duyệt có thể bị chặn hoặc đã đầy; hãy dùng ảnh nhỏ hơn.",
      );
    }
  }
  function load(source) {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const db = seed(source);
      save(db);
      return db;
    }
    let db;
    try {
      db = JSON.parse(raw);
    } catch {
      throw new Error(
        "Dữ liệu TechStore bị lỗi định dạng. Hãy sao lưu dữ liệu trước khi xử lý.",
      );
    }
    requireValue(
      db.schema === 2 &&
        [
          "categories",
          "products",
          "customers",
          "imports",
          "orders",
          "ledger",
        ].every((k) => Array.isArray(db[k])),
      "Dữ liệu lưu không tương thích với phiên bản TechStore này.",
    );
    return db;
  }
  function transact(db, operation) {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const current = JSON.parse(saved);
      requireValue(
        current.revision === db.revision,
        "Dữ liệu đã thay đổi ở tab khác. Đóng hộp thoại và tải lại trang trước khi lưu.",
      );
    }
    const next = JSON.parse(JSON.stringify(db));
    operation(next);
    next.revision++;
    next.products.forEach((p) => (p.price = sellingPrice(next, p)));
    save(next);
    return next;
  }
  function stock(db, id, at = "9999-12-31T23:59") {
    return db.ledger
      .filter((e) => String(e.productId) === String(id) && e.at <= at)
      .reduce((n, e) => n + e.quantity, 0);
  }
  function cost(db, id) {
    let quantity = 0,
      average = 0;
    db.ledger
      .filter((e) => String(e.productId) === String(id))
      .slice()
      .sort((a, b) => a.at.localeCompare(b.at))
      .forEach((e) => {
        if (e.quantity > 0)
          average =
            (quantity * average + e.quantity * e.cost) /
            (quantity + e.quantity);
        quantity += e.quantity;
      });
    return Math.round(average);
  }
  function margin(db, p) {
    return p.profitRate === null
      ? (db.categories.find((c) => c.id === p.categoryId)?.profitRate ?? 0)
      : p.profitRate;
  }
  function sellingPrice(db, p) {
    return Math.round(cost(db, p.masp) * (1 + margin(db, p) / 100));
  }
  function total(document) {
    return document.items.reduce(
      (sum, item) => sum + item.quantity * (item.price ?? item.cost),
      0,
    );
  }
  function report(db, id, from, to) {
    timestamp(from);
    timestamp(to);
    requireValue(
      from <= to,
      "Thời điểm bắt đầu phải trước hoặc bằng thời điểm kết thúc.",
    );
    const events = db.ledger.filter((e) => String(e.productId) === String(id));
    const inside = events.filter((e) => e.at >= from && e.at <= to);
    return {
      opening: events
        .filter((e) => e.at < from)
        .reduce((n, e) => n + e.quantity, 0),
      incoming: inside
        .filter((e) => e.quantity > 0)
        .reduce((n, e) => n + e.quantity, 0),
      outgoing: -inside
        .filter((e) => e.quantity < 0)
        .reduce((n, e) => n + e.quantity, 0),
      closing: stock(db, id, to),
    };
  }
  function saveCategory(db, input, id) {
    const code = text(input.id ?? (id || uid("L")), "Mã loại", 30);
    requireValue(
      /^[a-z0-9_-]+$/i.test(code),
      "Mã loại chỉ gồm chữ không dấu, số, gạch ngang hoặc gạch dưới.",
    );
    requireValue(
      !db.categories.some(
        (c) => c.id !== id && normalize(c.id) === normalize(code),
      ),
      "Mã loại sản phẩm đã tồn tại.",
    );
    if (id) requireValue(code === id, "Không đổi mã loại sau khi tạo.");
    const name = text(input.name, "Tên loại", 80);
    requireValue(
      !db.categories.some(
        (c) => c.id !== id && normalize(c.name) === normalize(name),
      ),
      "Tên loại sản phẩm đã tồn tại.",
    );
    const data = {
      name,
      description: String(input.description ?? "").trim(),
      profitRate: number(input.profitRate, "Lợi nhuận", 0, 1000),
    };
    if (id) {
      const c = db.categories.find((c) => c.id === id);
      requireValue(c, "Không tìm thấy loại sản phẩm.");
      Object.assign(c, data);
    } else db.categories.push({ id: code, ...data, hidden: false });
  }
  function deleteCategory(db, id) {
    requireValue(
      !db.products.some((p) => p.categoryId === id),
      "Loại đã có sản phẩm. Hãy chọn Ẩn để giữ liên kết dữ liệu.",
    );
    db.categories = db.categories.filter((c) => c.id !== id);
  }
  function saveProduct(db, input, id) {
    const code = text(input.masp, "Mã sản phẩm", 30);
    requireValue(
      /^[a-z0-9_-]+$/i.test(code),
      "Mã sản phẩm chỉ gồm chữ không dấu, số, gạch ngang hoặc gạch dưới.",
    );
    requireValue(
      !db.products.some(
        (p) => p.masp !== id && normalize(p.masp) === normalize(code),
      ),
      "Mã sản phẩm đã tồn tại.",
    );
    if (id) requireValue(code === id, "Không đổi mã sản phẩm sau khi tạo.");
    const existing = db.products.find((p) => p.masp === id);
    const category = db.categories.find((c) => c.id === input.categoryId);
    requireValue(
      category && (!category.hidden || existing?.categoryId === category.id),
      "Vui lòng chọn loại sản phẩm đang hiển thị.",
    );
    requireValue(
      safeImage(input.img),
      "Hãy chọn ảnh có sẵn trong thư mục images hoặc tải ảnh từ máy.",
    );
    const data = {
      masp: code,
      name: text(input.name, "Tên sản phẩm", 200),
      company: text(input.company, "Hãng sản xuất", 100),
      categoryId: category.id,
      img: input.img,
      description: text(input.description, "Mô tả", 3000),
      threshold: number(input.threshold, "Ngưỡng cảnh báo", 0, 1000000, true),
      detail: { ...(existing?.detail || {}), ...input.detail },
    };
    if (id) {
      requireValue(existing, "Không tìm thấy sản phẩm.");
      Object.assign(existing, data);
    } else
      db.products.push({
        ...data,
        price: 0,
        profitRate: null,
        hidden: false,
        promo: { name: "", value: "" },
        star: 0,
        rateCount: 0,
      });
  }
  function deleteProduct(db, id) {
    requireValue(
      !db.ledger.some((e) => e.productId === id) &&
        ![...db.imports, ...db.orders].some((d) =>
          d.items.some((i) => i.productId === id),
        ),
      "Sản phẩm đã có phiếu nhập, đơn hàng hoặc lịch sử kho. Hãy chọn Ẩn.",
    );
    db.products = db.products.filter((p) => p.masp !== id);
  }
  function validateLines(db, items) {
    requireValue(
      Array.isArray(items) && items.length > 0,
      "Phiếu nhập cần ít nhất một sản phẩm.",
    );
    const seen = new Set();
    return items.map((i) => {
      requireValue(
        db.products.some((p) => p.masp === i.productId),
        "Sản phẩm không tồn tại.",
      );
      requireValue(
        !seen.has(i.productId),
        "Sản phẩm bị trùng trên phiếu. Hãy gộp số lượng vào một dòng.",
      );
      seen.add(i.productId);
      return {
        productId: i.productId,
        quantity: number(i.quantity, "Số lượng", 1, 1000000, true),
        cost: number(i.cost, "Giá nhập", 1, 1000000000000, true),
      };
    });
  }
  function saveReceipt(db, input, id) {
    const at = timestamp(input.at);
    requireValue(at <= now(), "Ngày nhập không được ở tương lai.");
    const data = {
      at,
      note: String(input.note ?? "").trim(),
      items: validateLines(db, input.items),
    };
    if (id) {
      const r = db.imports.find((r) => r.id === id);
      requireValue(
        r && r.status === "draft",
        "Chỉ sửa được phiếu nhập chưa hoàn thành.",
      );
      Object.assign(r, data);
    } else db.imports.unshift({ id: uid("PN"), status: "draft", ...data });
  }
  function completeReceipt(db, id) {
    const receipt = db.imports.find((r) => r.id === id);
    requireValue(
      receipt && receipt.status === "draft",
      "Phiếu đã hoàn thành hoặc không tồn tại; không được nhập kho hai lần.",
    );
    timestamp(receipt.at);
    requireValue(receipt.at <= now(), "Ngày nhập không được ở tương lai.");
    const items = validateLines(db, receipt.items);
    const events = items.map((i, index) => ({
      id: id + "-" + index,
      productId: i.productId,
      at: receipt.at,
      quantity: i.quantity,
      cost: i.cost,
      kind: "import",
      reference: id,
    }));
    requireValue(
      !db.ledger.some((e) => e.reference === id),
      "Phiếu đã có bút toán nhập kho.",
    );
    db.ledger.push(...events);
    receipt.status = "completed";
    receipt.completedAt = now();
  }
  const transitions = {
    new: ["processed", "cancelled"],
    processed: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
  };
  function changeOrder(db, id, status) {
    const order = db.orders.find((o) => o.id === id);
    requireValue(
      order && transitions[order.status]?.includes(status),
      "Không thể chuyển sang trạng thái đã chọn.",
    );
    if (status === "delivered") {
      const at = now(),
        quantities = new Map();
      order.items.forEach((i) => {
        requireValue(
          db.products.some((p) => p.masp === i.productId),
          "Đơn có sản phẩm không tồn tại.",
        );
        number(i.quantity, "Số lượng", 1, 1000000, true);
        quantities.set(
          i.productId,
          (quantities.get(i.productId) || 0) + i.quantity,
        );
      });
      for (const [pid, quantity] of quantities)
        requireValue(
          stock(db, pid, at) >= quantity,
          `Không đủ tồn kho cho ${db.products.find((p) => p.masp === pid).name}.`,
        );
      requireValue(
        !db.ledger.some((e) => e.kind === "sale" && e.reference === id),
        "Đơn hàng đã xuất kho.",
      );
      order.items.forEach((i, index) =>
        db.ledger.push({
          id: "OUT-" + id + "-" + index,
          productId: i.productId,
          at,
          quantity: -i.quantity,
          kind: "sale",
          reference: id,
        }),
      );
      order.deliveredAt = at;
    }
    order.status = status;
    order.updatedAt = now();
  }
  function setMargin(db, id, value, isCategory = false) {
    const n =
      value === "" && !isCategory ? null : number(value, "Lợi nhuận", 0, 1000);
    const target = isCategory
      ? db.categories.find((c) => c.id === id)
      : db.products.find((p) => p.masp === id);
    requireValue(target, "Không tìm thấy dữ liệu.");
    target.profitRate = n;
  }
  function resetPassword(db, id, password) {
    requireValue(
      typeof password === "string" &&
        password.length >= 8 &&
        password.length <= 64,
      "Mật khẩu mới phải có 8–64 ký tự.",
    );
    const c = db.customers.find((c) => c.id === id);
    requireValue(c, "Không tìm thấy khách hàng.");
    c.password = password;
    c.passwordUpdatedAt = now();
    // Đồng bộ mật khẩu với tài khoản đăng ký trên website (bản Local Storage).
    try {
      const users = JSON.parse(localStorage.getItem("techstore_demo_users_v1") || "[]");
      const user = users.find((item) => String(item.email).toLowerCase() === String(c.email).toLowerCase());
      if (user) { user.password = password; localStorage.setItem("techstore_demo_users_v1", JSON.stringify(users)); }
    } catch (_) {}
  }
  window.TechStore = {
    KEY,
    SESSION_KEY,
    ADMIN,
    assets,
    now,
    ago,
    normalize,
    uid,
    seed,
    load,
    save,
    transact,
    stock,
    cost,
    margin,
    sellingPrice,
    total,
    report,
    saveCategory,
    deleteCategory,
    saveProduct,
    deleteProduct,
    saveReceipt,
    completeReceipt,
    changeOrder,
    setMargin,
    resetPassword,
    transitions,
    timestamp,
    safeImage,
  };
})();
