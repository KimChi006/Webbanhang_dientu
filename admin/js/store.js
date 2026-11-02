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
      (/^(\.\.\/images\/[a-z0-9_.-]+\.(jpg|jpeg|png|webp|gif|svg))$/i.test(value) ||
        /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(value))
    );
  }
  const assets = [
    "image-updating.svg",
    "airpods-3.png",
    "airpods-pro-2.png",
    "airpods-max.png",
    "sony-wh-1000xm5.png",
    "sony-wh-1000xm4.png",
    "sony-wh-ch520.jpg",
    "sony-wf-1000xm5.png",
    "samsung-galaxy-buds2.png",
    "samsung-galaxy-buds2-pro.png",
    "samsung-galaxy-buds-fe.png",
    "jbl-tune-520bt.png",
    "jbl-wave-beam.png",
    "marshall-major-iv.png",
    "marshall-minor-iii.png",
    "marshall-motif-ii-anc.png",
    "apple-watch-series-9.png",
    "apple-watch-se-2.png",
    "apple-watch-ultra-2.png",
    "samsung-galaxy-watch6.png",
    "samsung-galaxy-watch6-classic.png",
    "garmin-forerunner-55.png",
    "garmin-forerunner-265.png",
    "huawei-watch-gt-4.png",
    "redmi-watch-4.png",
    "xiaomi-smart-band-8-pro.png",
    "jbl-charge-5.png",
    "jbl-flip-6.png",
    "jbl-clip-4.png",
    "jbl-go-3.png",
    "marshall-emberton-ii.png",
    "marshall-willen.png",
    "marshall-stanmore-iii.png",
    "sony-srs-xb100.png",
    "apple-homepod-mini.png",
    "harman-kardon-onyx-studio-8.png",
    "logitech-mx-master-3s.png",
    "logitech-signature-m650.jpg",
    "logitech-g102-lightsync.png",
    "apple-magic-mouse.png",
    "logitech-k380.png",
    "logitech-mx-keys-s.png",
    "keychron-k8.png",
    "apple-magic-keyboard.png",
    "apple-20w-usb-c-adapter.png",
    "anker-nano-3-30w.png",
    "anker-nano-70w.png",
    "ugreen-nexode-65w.png",
    "apple-usb-c-charge-cable-1m.png",
    "anker-flow-usb-c-lightning.png",
    "anker-zolo-usb-c-240w.png",
    "ugreen-uno-usb-c-100w.png",
    "anker-737-power-bank.png",
    "anker-nano-power-bank-10000.png",
    "samsung-eb-p3400-power-bank.png",
    "xiaomi-power-bank-4i-10000.png",
    "hp-15s.png",
    "dell-xps-13.png",
    "dell-inspiron-15-3530.jpg",
    "dell-inspiron-15-3520.png",
    "asus-rog-strix-g16.png",
    "asus-vivobook-15.png",
    "macbook-air-m3.jpg",
    "oppo-pad-neo.png",
    "lenovo-tab-p11.png",
    "lenovo-tab-m11.png",
    "redmi-pad-se.png",
    "samsung-galaxy-tab-s9-fe.jpg",
    "samsung-galaxy-tab-a9-plus.jpg",
    "samsung-galaxy-tab-a9.png",
    "ipad-pro-11.jpg",
    "ipad-mini-6.png",
    "ipad-air-5.png",
    "vivo-v29e.png",
    "realme-c67.png",
    "xiaomi-redmi-note-13.png",
    "oppo-reno-11.png",
    "pilot-macbook-air-m1.jpg",
    "pilot-acer-nitro-5.jpg",
    "pilot-iphone-13.png",
    "pilot-samsung-galaxy-s23.png",
    "pilot-ipad-gen-10.jpg",
    "pilot-samsung-galaxy-tab-s9.png",
    "iphone-13.png",
    "samsung-galaxy-s23.png",
    "oppo-reno-11.jpg",
    "xiaomi-redmi-note-13.jpg",
    "realme-c67.jpg",
    "vivo-v29e.jpg",
    "ipad-gen-9.png",
    "ipad-gen-10.png",
    "ipad-air-5.jpg",
    "ipad-mini-6.jpg",
    "ipad-pro-11.png",
    "samsung-galaxy-tab-a9.jpg",
    "samsung-galaxy-tab-s9.png",
    "xiaomi-pad-6.jpg",
    "redmi-pad-se.jpg",
    "lenovo-tab-m11.jpg",
    "lenovo-tab-p11.jpg",
    "oppo-pad-neo.jpg",
    "macbook-air-m1.png",
    "macbook-air-m2.jpg",
    "macbook-pro-14-m3.jpg",
    "asus-vivobook-15.jpg",
    "asus-vivobook-14.jpg",
    "asus-zenbook-14.jpg",
    "asus-tuf-gaming-f15.jpg",
    "asus-rog-strix-g16.jpg",
    "dell-inspiron-15-3520.jpg",
    "dell-vostro-15-3520.jpg",
    "dell-xps-13.jpg",
    "hp-15s.jpg",
    "hp-pavilion-14.jpg",
    "hp-envy-x360.jpg",
    "hp-victus-16.jpg",
    "lenovo-ideapad-3.jpg",
    "lenovo-ideapad-slim-5.jpg",
    "lenovo-loq-15.webp",
    "lenovo-legion-5.jpg",
    "acer-aspire-3.jpg",
    "acer-nitro-5.png",
    "msi-thin-gf63.png",
    "msi-modern-14.jpg",
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
    const cleanRes = cleanProductDescriptions(db);
    if (cleanRes.updated > 0) {
      try {
        save(db);
      } catch (err) {
        console.warn("Không thể lưu tự động khi làm sạch mô tả sản phẩm:", err);
      }
    }
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
    if (!Array.isArray(db.deletedProductCodes)) {
      db.deletedProductCodes = [];
    }
    if (!db.deletedProductCodes.includes(id)) {
      db.deletedProductCodes.push(id);
    }
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
  function exportBackup(db) {
    requireValue(db && typeof db === "object", "Dữ liệu không hợp lệ.");
    return JSON.stringify(
      {
        schema: db.schema || 2,
        revision: db.revision || 0,
        exportedAt: now(),
        data: db,
      },
      null,
      2,
    );
  }
  function restoreBackup(db, backupData) {
    const parsed =
      typeof backupData === "string" ? JSON.parse(backupData) : backupData;
    const source =
      parsed && parsed.data && parsed.schema === 2 ? parsed.data : parsed;
    requireValue(
      source &&
        source.schema === 2 &&
        [
          "categories",
          "products",
          "customers",
          "imports",
          "orders",
          "ledger",
        ].every((k) => Array.isArray(source[k])),
      "Dữ liệu sao lưu không tương thích hoặc không đúng định dạng.",
    );
    db.categories = source.categories.slice();
    db.products = source.products.slice();
    db.customers = source.customers.slice();
    db.imports = source.imports.slice();
    db.orders = source.orders.slice();
    db.ledger = source.ledger.slice();
    db.deletedProductCodes = Array.isArray(source.deletedProductCodes)
      ? source.deletedProductCodes.slice()
      : [];
    db.importedBatches = Array.isArray(source.importedBatches)
      ? source.importedBatches.slice()
      : [];
    db.products.forEach((p) => (p.price = sellingPrice(db, p)));
    return {
      categoryCount: db.categories.length,
      productCount: db.products.length,
      customerCount: db.customers.length,
      orderCount: db.orders.length,
    };
  }
  function importBatch(db, batch, options = {}) {
    requireValue(
      batch && typeof batch === "object",
      "Dữ liệu đợt nhập không hợp lệ.",
    );
    const batchId = batch.batchId || uid("BATCH");
    db.importedBatches = db.importedBatches || [];
    db.deletedProductCodes = db.deletedProductCodes || [];

    const stats = {
      batchId,
      addedCategories: 0,
      addedProducts: 0,
      skippedExisting: 0,
      skippedDeleted: 0,
      errors: [],
    };

    if (Array.isArray(batch.categories)) {
      for (const cat of batch.categories) {
        try {
          if (!cat.id || !cat.name) continue;
          const exists = db.categories.some(
            (c) =>
              normalize(c.id) === normalize(cat.id) ||
              normalize(c.name) === normalize(cat.name),
          );
          if (!exists) {
            db.categories.push({
              id: text(cat.id, "Mã loại", 30),
              name: text(cat.name, "Tên loại", 80),
              description: String(cat.description || "").trim(),
              profitRate: number(cat.profitRate ?? 20, "Lợi nhuận", 0, 1000),
              hidden: Boolean(cat.hidden),
            });
            stats.addedCategories++;
          }
        } catch (err) {
          stats.errors.push(`Loại ${cat.id || ""}: ${err.message}`);
        }
      }
    }

    if (Array.isArray(batch.products)) {
      for (const item of batch.products) {
        try {
          const code = text(item.masp, "Mã sản phẩm", 30);
          requireValue(
            /^[a-z0-9_-]+$/i.test(code),
            `Mã sản phẩm ${code} không hợp lệ.`,
          );

          if (db.deletedProductCodes.includes(code)) {
            stats.skippedDeleted++;
            continue;
          }

          if (db.products.some((p) => normalize(p.masp) === normalize(code))) {
            stats.skippedExisting++;
            continue;
          }

          const cat = db.categories.find(
            (c) =>
              c.id === item.categoryId ||
              normalize(c.name) === normalize(item.categoryId),
          );
          requireValue(
            cat,
            `Loại sản phẩm ${item.categoryId} không tồn tại trong hệ thống.`,
          );

          let img = String(item.img || "").trim();
          if (img.startsWith("images/")) {
            img = "../" + img;
          } else if (
            !img.startsWith("../images/") &&
            !img.startsWith("data:image/")
          ) {
            img = "../images/" + (assets.includes(img) ? img : assets[0]);
          }
          if (!safeImage(img)) {
            img = "../images/" + assets[0];
          }

          const productRecord = {
            masp: code,
            name: text(item.name, "Tên sản phẩm", 200),
            company: text(item.company, "Hãng sản xuất", 100),
            categoryId: cat.id,
            img,
            description: text(item.description || `${item.name}.`, "Mô tả", 3000),
            threshold: number(
              item.threshold ?? 5,
              "Ngưỡng cảnh báo",
              0,
              1000000,
              true,
            ),
            profitRate:
              item.profitRate !== undefined &&
              item.profitRate !== null &&
              item.profitRate !== ""
                ? number(item.profitRate, "Lợi nhuận", 0, 1000)
                : null,
            hidden: Boolean(item.hidden),
            promo: {
              name: String(item.promo?.name || "").trim(),
              value: String(item.promo?.value || "").trim(),
            },
            star: number(item.star ?? 0, "Đánh giá", 0, 5),
            rateCount: number(
              item.rateCount ?? 0,
              "Số lượt đánh giá",
              0,
              1000000,
              true,
            ),
            detail:
              typeof item.detail === "object" && item.detail !== null
                ? { ...item.detail }
                : {},
            price: 0,
          };

          const initialStock = number(
            item.stock ?? 10,
            "Số lượng tồn đầu kỳ",
            0,
            1000000,
            true,
          );
          let initialCost = 0;
          if (
            item.cost !== undefined &&
            item.cost !== null &&
            item.cost !== ""
          ) {
            initialCost = number(item.cost, "Giá vốn", 1, 1000000000000, true);
          } else if (
            item.price !== undefined &&
            item.price !== null &&
            item.price !== ""
          ) {
            const rawPrice = number(
              String(item.price).replace(/\./g, ""),
              "Giá bán",
              1,
              1000000000000,
              true,
            );
            const m =
              productRecord.profitRate !== null
                ? productRecord.profitRate
                : cat.profitRate;
            initialCost = Math.round(rawPrice / (1 + m / 100));
          } else {
            initialCost = 1000000;
          }

          db.products.push(productRecord);

          if (
            initialStock > 0 &&
            !db.ledger.some((e) => e.productId === code)
          ) {
            db.ledger.push({
              id: "OPEN-" + code,
              productId: code,
              at: ago(30),
              quantity: initialStock,
              cost: initialCost,
              kind: "opening",
              reference: "Tồn đầu kỳ (" + batchId + ")",
            });
          }

          productRecord.price = sellingPrice(db, productRecord);
          stats.addedProducts++;
        } catch (err) {
          stats.errors.push(
            `Sản phẩm ${item.masp || item.name || ""}: ${err.message}`,
          );
        }
      }
    }

    if (!db.importedBatches.includes(batchId)) {
      db.importedBatches.push(batchId);
    }
    return stats;
  }

  const BATCH_01 = {
  batchId: "batch-exp-01",
  categories: [
    {
      id: "L04",
      name: "Laptop",
      description: "Máy tính xách tay học tập, làm việc và giải trí",
      profitRate: 15,
      hidden: false,
    },
  ],
  products: [
    {
      masp: "DT-IP13",
      name: "iPhone 13 128GB",
      company: "Apple",
      categoryId: "L01",
      price: 14990000,
      img: "../images/pilot-iphone-13.png",
      description: "iPhone 13 sở hữu chip A15 Bionic mạnh mẽ, cụm camera chéo sắc nét cùng thời lượng pin ấn tượng.",
      stock: 12,
      threshold: 3,
      detail: { screen: "6.1 inch, Super Retina XDR OLED", os: "iOS 15", camara: "2 camera 12 MP", camaraFront: "12 MP", cpu: "Apple A15 Bionic 6 nhân", ram: "4 GB", rom: "128 GB", battery: "3240 mAh" },
    },
    {
      masp: "DT-SS23",
      name: "Samsung Galaxy S23 5G 128GB",
      company: "Samsung",
      categoryId: "L01",
      price: 14990000,
      img: "../images/pilot-samsung-galaxy-s23.png",
      description: "Samsung Galaxy S23 5G với vi xử lý Snapdragon 8 Gen 2 for Galaxy và camera chụp đêm Nightography đỉnh cao.",
      stock: 10,
      threshold: 3,
      detail: { screen: "6.1 inch, Dynamic AMOLED 2X, FHD+, 120Hz", os: "Android 13", camara: "Chính 50 MP & Phụ 12 MP, 10 MP", camaraFront: "12 MP", cpu: "Snapdragon 8 Gen 2 for Galaxy 8 nhân", ram: "8 GB", rom: "128 GB", battery: "3900 mAh" },
    },
    {
      masp: "DT-OPRE11",
      name: "OPPO Reno11 5G 256GB",
      company: "OPPO",
      categoryId: "L01",
      price: 9990000,
      img: "../images/oppo-reno-11.png",
      description: "OPPO Reno11 5G chuyên gia chân dung với thiết kế vân lượn sóng và sạc nhanh SuperVOOC 67W.",
      stock: 8,
      threshold: 3,
      detail: { screen: "6.7 inch, AMOLED, FHD+, 120Hz", os: "Android 14", camara: "Chính 50 MP & Phụ 32 MP, 8 MP", camaraFront: "32 MP", cpu: "MediaTek Dimensity 7050 5G 8 nhân", ram: "8 GB", rom: "256 GB", battery: "5000 mAh" },
    },
    {
      masp: "DT-XIN13",
      name: "Xiaomi Redmi Note 13 128GB",
      company: "Xiaomi",
      categoryId: "L01",
      price: 4490000,
      img: "../images/xiaomi-redmi-note-13.png",
      description: "Redmi Note 13 nổi bật với camera 108 MP siêu rõ nét và màn hình viền siêu mỏng 120Hz.",
      stock: 15,
      threshold: 5,
      detail: { screen: "6.67 inch, AMOLED, FHD+, 120Hz", os: "Android 13", camara: "Chính 108 MP & Phụ 8 MP, 2 MP", camaraFront: "16 MP", cpu: "Snapdragon 685 8 nhân", ram: "6 GB", rom: "128 GB", battery: "5000 mAh" },
    },
    {
      masp: "DT-REAC67",
      name: "Realme C67 128GB",
      company: "Realme",
      categoryId: "L01",
      price: 4490000,
      img: "../images/realme-c67.png",
      description: "Realme C67 mang thiết kế siêu mỏng 7.59 mm kết hợp camera 108 MP và chip Snapdragon 685 mượt mà.",
      stock: 14,
      threshold: 4,
      detail: { screen: "6.72 inch, IPS LCD, FHD+, 90Hz", os: "Android 14", camara: "Chính 108 MP & Phụ 2 MP", camaraFront: "8 MP", cpu: "Snapdragon 685 8 nhân", ram: "8 GB", rom: "128 GB", battery: "5000 mAh" },
    },
    {
      masp: "DT-VIVV29",
      name: "Vivo V29e 5G 256GB",
      company: "Vivo",
      categoryId: "L01",
      price: 8490000,
      img: "../images/vivo-v29e.png",
      description: "Vivo V29e 5G với vòng sáng Aura 2.0 độc quyền và camera selfie nhóm 50 MP góc siêu rộng.",
      stock: 7,
      threshold: 2,
      detail: { screen: "6.67 inch, AMOLED, FHD+, 120Hz", os: "Android 13", camara: "Chính 64 MP & Phụ 8 MP", camaraFront: "50 MP", cpu: "Snapdragon 695 5G 8 nhân", ram: "8 GB", rom: "256 GB", battery: "4800 mAh" },
    },
    {
      masp: "TB-IP9",
      name: "iPad Gen 9 10.2 inch WiFi 64GB",
      company: "Apple",
      categoryId: "L02",
      price: 7490000,
      img: "../images/ipad-gen-9.png",
      description: "iPad Gen 9 màn hình Retina 10.2 inch cùng chip A13 Bionic tối ưu cho học tập trực tuyến.",
      stock: 15,
      threshold: 5,
      detail: { screen: "10.2 inch, Retina IPS LCD", os: "iPadOS 15", camara: "8 MP", camaraFront: "12 MP", cpu: "Apple A13 Bionic 6 nhân", ram: "3 GB", rom: "64 GB", battery: "8557 mAh" },
    },
    {
      masp: "TB-IP10",
      name: "iPad Gen 10 10.9 inch WiFi 64GB",
      company: "Apple",
      categoryId: "L02",
      price: 10490000,
      img: "../images/pilot-ipad-gen-10.jpg",
      description: "iPad Gen 10 thiết kế toàn màn hình mới, cổng USB-C tiện lợi và chip A14 Bionic nhanh nhạy.",
      stock: 12,
      threshold: 4,
      detail: { screen: "10.9 inch, Liquid Retina", os: "iPadOS 16", camara: "12 MP", camaraFront: "12 MP", cpu: "Apple A14 Bionic 6 nhân", ram: "4 GB", rom: "64 GB", battery: "7538 mAh" },
    },
    {
      masp: "TB-IPAIR5",
      name: "iPad Air 5 M1 10.9 inch WiFi 64GB",
      company: "Apple",
      categoryId: "L02",
      price: 14990000,
      img: "../images/ipad-air-5.png",
      description: "iPad Air 5 trang bị chip Apple M1 siêu mạnh, hỗ trợ Apple Pencil 2 và Magic Keyboard.",
      stock: 10,
      threshold: 3,
      detail: { screen: "10.9 inch, Liquid Retina", os: "iPadOS 15", camara: "12 MP", camaraFront: "12 MP", cpu: "Apple M1 8 nhân", ram: "8 GB", rom: "64 GB", battery: "7600 mAh" },
    },
    {
      masp: "TB-IPMINI6",
      name: "iPad mini 6 8.3 inch WiFi 64GB",
      company: "Apple",
      categoryId: "L02",
      price: 12490000,
      img: "../images/ipad-mini-6.png",
      description: "iPad mini 6 kích thước nhỏ gọn 8.3 inch, chip A15 Bionic và thiết kế viền mỏng cao cấp.",
      stock: 8,
      threshold: 3,
      detail: { screen: "8.3 inch, Liquid Retina", os: "iPadOS 15", camara: "12 MP", camaraFront: "12 MP", cpu: "Apple A15 Bionic 6 nhân", ram: "4 GB", rom: "64 GB", battery: "5124 mAh" },
    },
  ],
};

const BATCH_02 = {
  batchId: "batch-exp-02",
  products: [
    {
      masp: "TB-IPPRO11",
      name: "iPad Pro 11 inch M2 WiFi 128GB",
      company: "Apple",
      categoryId: "L02",
      price: 20990000,
      img: "../images/ipad-pro-11.jpg",
      description: "iPad Pro 11 inch M2 với màn hình ProMotion 120Hz và trải nghiệm đồ họa chuyên nghiệp.",
      stock: 6,
      threshold: 2,
      detail: { screen: "11 inch, Liquid Retina ProMotion 120Hz", os: "iPadOS 16", camara: "Chính 12 MP & Phụ 10 MP", camaraFront: "12 MP", cpu: "Apple M2 8 nhân", ram: "8 GB", rom: "128 GB", battery: "7538 mAh" },
    },
    {
      masp: "TB-SSA9",
      name: "Samsung Galaxy Tab A9 WiFi 64GB",
      company: "Samsung",
      categoryId: "L02",
      price: 3490000,
      img: "../images/samsung-galaxy-tab-a9.png",
      description: "Máy tính bảng nhỏ gọn 8.7 inch, loa kép vòm Dolby Atmos giá hợp lý cho gia đình.",
      stock: 20,
      threshold: 5,
      detail: { screen: "8.7 inch, TFT LCD", os: "Android 13", camara: "8 MP", camaraFront: "2 MP", cpu: "MediaTek Helio G99 8 nhân", ram: "4 GB", rom: "64 GB", battery: "5100 mAh" },
    },
    {
      masp: "TB-SSA9P",
      name: "Samsung Galaxy Tab A9+ WiFi 64GB",
      company: "Samsung",
      categoryId: "L02",
      price: 5490000,
      img: "../images/samsung-galaxy-tab-a9-plus.jpg",
      description: "Galaxy Tab A9+ màn hình lớn 11 inch tần số quét 90Hz và 4 loa vòm sống động.",
      stock: 15,
      threshold: 4,
      detail: { screen: "11 inch, TFT LCD, 90Hz", os: "Android 13", camara: "8 MP", camaraFront: "5 MP", cpu: "Snapdragon 695 5G 8 nhân", ram: "4 GB", rom: "64 GB", battery: "7040 mAh" },
    },
    {
      masp: "TB-SSS9FE",
      name: "Samsung Galaxy Tab S9 FE WiFi 128GB",
      company: "Samsung",
      categoryId: "L02",
      price: 9990000,
      img: "../images/samsung-galaxy-tab-s9-fe.jpg",
      description: "Galaxy Tab S9 FE tích hợp bút S Pen tiện lợi, chuẩn kháng nước IP68 bền bỉ.",
      stock: 10,
      threshold: 3,
      detail: { screen: "10.9 inch, TFT LCD, 90Hz", os: "Android 13", camara: "8 MP", camaraFront: "12 MP", cpu: "Exynos 1380 8 nhân", ram: "6 GB", rom: "128 GB", battery: "8000 mAh" },
    },
    {
      masp: "TB-SSS9",
      name: "Samsung Galaxy Tab S9 128GB",
      company: "Samsung",
      categoryId: "L02",
      price: 17990000,
      img: "../images/pilot-samsung-galaxy-tab-s9.png",
      description: "Galaxy Tab S9 cao cấp với màn Dynamic AMOLED 2X rực rỡ và chip Snapdragon 8 Gen 2.",
      stock: 8,
      threshold: 2,
      detail: { screen: "11 inch, Dynamic AMOLED 2X, 120Hz", os: "Android 13", camara: "13 MP", camaraFront: "12 MP", cpu: "Snapdragon 8 Gen 2 8 nhân", ram: "8 GB", rom: "128 GB", battery: "8400 mAh" },
    },
    {
      masp: "TB-XIPAD6",
      name: "Xiaomi Pad 6 128GB",
      company: "Xiaomi",
      categoryId: "L02",
      price: 7990000,
      img: "../images/xiaomi-pad-6.jpg",
      description: "Xiaomi Pad 6 trang bị màn hình 2.8K 144Hz siêu mượt và chip Snapdragon 870 mạnh mẽ.",
      stock: 14,
      threshold: 4,
      detail: { screen: "11 inch, IPS LCD, 2.8K, 144Hz", os: "Android 13", camara: "13 MP", camaraFront: "8 MP", cpu: "Snapdragon 870 8 nhân", ram: "6 GB", rom: "128 GB", battery: "8840 mAh" },
    },
    {
      masp: "TB-REDPAD",
      name: "Xiaomi Redmi Pad SE 128GB",
      company: "Xiaomi",
      categoryId: "L02",
      price: 3990000,
      img: "../images/redmi-pad-se.png",
      description: "Redmi Pad SE pin khủng 8000 mAh cùng hệ thống 4 loa Dolby Atmos giải trí tối ưu.",
      stock: 18,
      threshold: 5,
      detail: { screen: "11 inch, IPS LCD, 90Hz", os: "Android 13", camara: "8 MP", camaraFront: "5 MP", cpu: "Snapdragon 680 8 nhân", ram: "4 GB", rom: "128 GB", battery: "8000 mAh" },
    },
    {
      masp: "TB-LENM11",
      name: "Lenovo Tab M11 64GB",
      company: "Lenovo",
      categoryId: "L02",
      price: 4490000,
      img: "../images/lenovo-tab-m11.png",
      description: "Lenovo Tab M11 màn hình FHD 90Hz kèm bút cảm ứng Lenovo Tab Pen phục vụ ghi chú học tập.",
      stock: 12,
      threshold: 3,
      detail: { screen: "11 inch, IPS LCD, 90Hz", os: "Android 13", camara: "8 MP", camaraFront: "8 MP", cpu: "MediaTek Helio G88 8 nhân", ram: "4 GB", rom: "64 GB", battery: "7040 mAh" },
    },
    {
      masp: "TB-LENP11",
      name: "Lenovo Tab P11 Gen 2 128GB",
      company: "Lenovo",
      categoryId: "L02",
      price: 7490000,
      img: "../images/lenovo-tab-p11.png",
      description: "Lenovo Tab P11 Gen 2 màn hình 2K 120Hz mượt mà và 4 loa JBL cao cấp.",
      stock: 10,
      threshold: 3,
      detail: { screen: "11.5 inch, IPS LCD, 2K, 120Hz", os: "Android 12L", camara: "13 MP", camaraFront: "8 MP", cpu: "MediaTek Helio G99 8 nhân", ram: "4 GB", rom: "128 GB", battery: "7700 mAh" },
    },
    {
      masp: "TB-OPPAD2",
      name: "OPPO Pad Neo 128GB",
      company: "OPPO",
      categoryId: "L02",
      price: 6990000,
      img: "../images/oppo-pad-neo.png",
      description: "OPPO Pad Neo tỉ lệ vàng 7:5 bảo vệ mắt, pin 8000 mAh sạc nhanh 33W SUPERVOOC.",
      stock: 11,
      threshold: 3,
      detail: { screen: "11.4 inch, LCD, 90Hz", os: "Android 13", camara: "8 MP", camaraFront: "8 MP", cpu: "MediaTek Helio G99 8 nhân", ram: "6 GB", rom: "128 GB", battery: "8000 mAh" },
    },
    {
      masp: "LT-APM1",
      name: "MacBook Air 13 inch M1 8GB/256GB",
      company: "Apple",
      categoryId: "L04",
      price: 18490000,
      img: "../images/pilot-macbook-air-m1.jpg",
      description: "MacBook Air M1 thiết kế kim loại nguyên khối siêu mỏng nhẹ, pin 18 giờ và hiệu năng ấn tượng.",
      stock: 15,
      threshold: 4,
      detail: { screen: "13.3 inch, Retina IPS (2560 x 1600)", os: "macOS", camara: "720p FaceTime HD", cpu: "Apple M1 8 nhân", gpu: "GPU Apple 7 lõi", ram: "8 GB", rom: "256 GB SSD", battery: "49.9 Wh" },
    },
  ],
};

const BATCH_03 = {
  batchId: "batch-exp-03",
  products: [
    {
      masp: "LT-APM2",
      name: "MacBook Air 13 inch M2 8GB/256GB",
      company: "Apple",
      categoryId: "L04",
      price: 24990000,
      img: "../images/macbook-air-m2.jpg",
      description: "MacBook Air M2 thiết kế phẳng thời thượng, màn hình Liquid Retina và cổng sạc MagSafe 3.",
      stock: 12,
      threshold: 3,
      detail: { screen: "13.6 inch, Liquid Retina", os: "macOS", camara: "1080p FaceTime HD", cpu: "Apple M2 8 nhân", gpu: "GPU Apple 8 lõi", ram: "8 GB", rom: "256 GB SSD", battery: "52.6 Wh" },
    },
    {
      masp: "LT-APM3",
      name: "MacBook Air 13 inch M3 16GB/256GB",
      company: "Apple",
      categoryId: "L04",
      price: 27990000,
      img: "../images/macbook-air-m3.jpg",
      description: "MacBook Air M3 trang bị chip 3nm đỉnh cao, hỗ trợ xuất cùng lúc 2 màn hình ngoài.",
      stock: 10,
      threshold: 3,
      detail: { screen: "13.6 inch, Liquid Retina", os: "macOS", camara: "1080p FaceTime HD", cpu: "Apple M3 8 nhân", gpu: "GPU Apple 8 lõi", ram: "16 GB", rom: "256 GB SSD", battery: "52.6 Wh" },
    },
    {
      masp: "LT-APPR14",
      name: "MacBook Pro 14 inch M3 16GB/512GB",
      company: "Apple",
      categoryId: "L04",
      price: 39990000,
      img: "../images/macbook-pro-14-m3.jpg",
      description: "MacBook Pro 14 M3 sở hữu màn hình Liquid Retina XDR ProMotion 120Hz và tản nhiệt chủ động.",
      stock: 8,
      threshold: 2,
      detail: { screen: "14.2 inch, Liquid Retina XDR 120Hz", os: "macOS", camara: "1080p FaceTime HD", cpu: "Apple M3 8 nhân", gpu: "GPU Apple 10 lõi", ram: "16 GB", rom: "512 GB SSD", battery: "70 Wh" },
    },
    {
      masp: "LT-ASVIVO15",
      name: "ASUS Vivobook 15 X1504ZA i5-1235U 16GB/512GB",
      company: "Asus",
      categoryId: "L04",
      price: 12990000,
      img: "../images/asus-vivobook-15.png",
      description: "Laptop ASUS Vivobook 15 thiết kế thanh lịch, bản lề mở 180 độ cùng bàn phím ErgoSense êm ái.",
      stock: 16,
      threshold: 4,
      detail: { screen: "15.6 inch, FHD", os: "Windows 11 Home", cpu: "Intel Core i5 1235U", gpu: "Intel Iris Xe Graphics", ram: "16 GB", rom: "512 GB SSD", battery: "42 Wh" },
    },
    {
      masp: "LT-ASVIVO14",
      name: "ASUS Vivobook 14 OLED A1405VA i5-13500H 16GB/512GB",
      company: "Asus",
      categoryId: "L04",
      price: 17990000,
      img: "../images/asus-vivobook-14.jpg",
      description: "Vivobook 14 OLED chuẩn màu 100% DCI-P3 kết hợp vi xử lý Intel Core dòng H hiệu năng cao.",
      stock: 12,
      threshold: 3,
      detail: { screen: "14 inch, 2.8K OLED, 90Hz", os: "Windows 11 Home", cpu: "Intel Core i5 13500H", gpu: "Intel Iris Xe Graphics", ram: "16 GB", rom: "512 GB SSD", battery: "50 Wh" },
    },
    {
      masp: "LT-ASZEN14",
      name: "ASUS Zenbook 14 OLED UX3405MA Ultra 5 16GB/512GB",
      company: "Asus",
      categoryId: "L04",
      price: 28990000,
      img: "../images/asus-zenbook-14.jpg",
      description: "Zenbook 14 OLED cao cấp với chip Intel Core Ultra AI tích hợp NPU và thời lượng pin vượt trội.",
      stock: 7,
      threshold: 2,
      detail: { screen: "14 inch, 3K OLED, 120Hz", os: "Windows 11 Home", cpu: "Intel Core Ultra 5 125H", gpu: "Intel Arc Graphics", ram: "16 GB", rom: "512 GB SSD", battery: "75 Wh" },
    },
    {
      masp: "LT-ASTUF15",
      name: "ASUS TUF Gaming F15 FX506HF i5 16GB/512GB RTX 2050",
      company: "Asus",
      categoryId: "L04",
      price: 16490000,
      img: "../images/asus-tuf-gaming-f15.jpg",
      description: "Laptop gaming độ bền chuẩn quân đội, đồ họa RTX 2050 và màn hình tần số quét 144Hz.",
      stock: 14,
      threshold: 4,
      detail: { screen: "15.6 inch, FHD, 144Hz", os: "Windows 11 Home", cpu: "Intel Core i5 11400H", gpu: "NVIDIA GeForce RTX 2050 4 GB", ram: "16 GB", rom: "512 GB SSD", battery: "48 Wh" },
    },
    {
      masp: "LT-ASROG6",
      name: "ASUS ROG Strix G16 G614JU i7 16GB/512GB RTX 4050",
      company: "Asus",
      categoryId: "L04",
      price: 34990000,
      img: "../images/asus-rog-strix-g16.png",
      description: "Cỗ máy gaming đỉnh cao với CPU Intel Core i7 thế hệ 13, GPU RTX 4050 và tản nhiệt 3 quạt thông minh.",
      stock: 6,
      threshold: 2,
      detail: { screen: "16 inch, FHD+, 165Hz", os: "Windows 11 Home", cpu: "Intel Core i7 13650HX", gpu: "NVIDIA GeForce RTX 4050 6 GB", ram: "16 GB", rom: "512 GB SSD", battery: "90 Wh" },
    },
    {
      masp: "LT-DELL3520",
      name: "Dell Inspiron 15 3520 i5-1235U 8GB/512GB",
      company: "Dell",
      categoryId: "L04",
      price: 14990000,
      img: "../images/dell-inspiron-15-3520.png",
      description: "Dell Inspiron 15 3520 màn hình mượt mà 120Hz, vỏ carbon bền bỉ và bàn phím số đầy đủ.",
      stock: 15,
      threshold: 4,
      detail: { screen: "15.6 inch, FHD, 120Hz", os: "Windows 11 Home", cpu: "Intel Core i5 1235U", gpu: "Intel Iris Xe Graphics", ram: "8 GB", rom: "512 GB SSD", battery: "41 Wh" },
    },
    {
      masp: "LT-DELL3530",
      name: "Dell Inspiron 15 3530 i7-1355U 16GB/512GB",
      company: "Dell",
      categoryId: "L04",
      price: 19990000,
      img: "../images/dell-inspiron-15-3530-i7-1355u.jpg",
      description: "Dell Inspiron 3530 trang bị CPU Intel Core i7 mạnh mẽ, RAM 16GB đa nhiệm mượt mà.",
      stock: 10,
      threshold: 3,
      detail: { screen: "15.6 inch, FHD, 120Hz", os: "Windows 11 Home", cpu: "Intel Core i7 1355U", gpu: "Intel Iris Xe Graphics", ram: "16 GB", rom: "512 GB SSD", battery: "54 Wh" },
    },
    {
      masp: "LT-DELLVO15",
      name: "Dell Vostro 15 3520 i3-1215U 8GB/256GB",
      company: "Dell",
      categoryId: "L04",
      price: 10990000,
      img: "../images/dell-vostro-15-3520.jpg",
      description: "Dell Vostro phân khúc doanh nghiệp và học tập, bảo mật TPM 2.0 và màn hình chống lóa.",
      stock: 18,
      threshold: 5,
      detail: { screen: "15.6 inch, FHD, 120Hz", os: "Windows 11 Home", cpu: "Intel Core i3 1215U", gpu: "Intel UHD Graphics", ram: "8 GB", rom: "256 GB SSD", battery: "41 Wh" },
    },
    {
      masp: "LT-DELLXPS13",
      name: "Dell XPS 13 9315 i5-1230U 8GB/512GB",
      company: "Dell",
      categoryId: "L04",
      price: 29990000,
      img: "../images/dell-xps-13.png",
      description: "Dell XPS 13 đẳng cấp doanh nhân siêu mỏng nhẹ chỉ 1.17 kg, màn hình viền vô cực InfinityEdge.",
      stock: 8,
      threshold: 2,
      detail: { screen: "13.4 inch, FHD+ InfinityEdge", os: "Windows 11 Home", cpu: "Intel Core i5 1230U", gpu: "Intel Iris Xe Graphics", ram: "8 GB", rom: "512 GB SSD", battery: "51 Wh" },
    },
  ],
};

const BATCH_04 = {
  batchId: "batch-exp-04",
  products: [
    {
      masp: "LT-HP15S",
      name: "HP 15s-fq5229TU i3-1215U 8GB/512GB",
      company: "HP",
      categoryId: "L04",
      price: 10990000,
      img: "../images/hp-15s-fq5229tu.png",
      description: "Laptop HP 15s thiết kế màu bạc sang trọng, bàn phím số tiện nhập liệu cho kế toán và học sinh.",
      stock: 15,
      threshold: 4,
      detail: { screen: "15.6 inch, FHD", os: "Windows 11 Home", cpu: "Intel Core i3 1215U", gpu: "Intel UHD Graphics", ram: "8 GB", rom: "512 GB SSD", battery: "41 Wh" },
    },
    {
      masp: "LT-HPPAV14",
      name: "HP Pavilion 14-dv2073TU (7C0P2PA) i5 16GB/512GB",
      company: "HP",
      categoryId: "L04",
      price: 15990000,
      img: "../images/hp-pavilion-14.jpg",
      description: "HP Pavilion 14 vỏ nhôm cao cấp, âm thanh B&O chân thực cùng màn hình IPS sắc nét.",
      stock: 12,
      threshold: 3,
      detail: { screen: "14 inch, FHD IPS", os: "Windows 11 Home", cpu: "Intel Core i5 1235U", gpu: "Intel Iris Xe Graphics", ram: "16 GB", rom: "512 GB SSD", battery: "43 Wh" },
    },
    {
      masp: "LT-HPENVY13",
      name: "HP Envy x360 13-bf0094TU (76B14PA) i5 16GB/512GB",
      company: "HP",
      categoryId: "L04",
      price: 22990000,
      img: "../images/hp-envy-x360.jpg",
      description: "HP Envy x360 xoay gập 360 độ linh hoạt, màn hình cảm ứng OLED 2.8K chuẩn màu 100% DCI-P3.",
      stock: 9,
      threshold: 2,
      detail: { screen: "13.3 inch, 2.8K OLED cảm ứng", os: "Windows 11 Home", cpu: "Intel Core i5 1230U", gpu: "Intel Iris Xe Graphics", ram: "16 GB", rom: "512 GB SSD", battery: "66 Wh" },
    },
    {
      masp: "LT-HPVICT16",
      name: "HP Victus 16-r0129TX (8C5N4PA)",
      company: "HP",
      categoryId: "L04",
      price: 23990000,
      img: "../images/hp-victus-16-r0129tx-8c5n4pa.jpg",
      description: "HP Victus 16 màn hình lớn 16.1 inch 144Hz kết hợp card đồ họa RTX 3050 6GB thỏa sức chơi game.",
      stock: 11,
      threshold: 3,
      detail: { screen: "16.1 inch, FHD, 144Hz", os: "Windows 11 Home", cpu: "Intel Core i7 13700H", gpu: "NVIDIA GeForce RTX 3050 6 GB", ram: "16 GB", rom: "512 GB SSD", battery: "70 Wh" },
    },
    {
      masp: "LT-LENID3",
      name: "Lenovo IdeaPad 3 15ITL6 i3 8GB/256GB",
      company: "Lenovo",
      categoryId: "L04",
      price: 9990000,
      img: "../images/lenovo-ideapad-3.jpg",
      description: "Lenovo Ideapad 3 mỏng nhẹ, bàn phím AccuType gõ êm, màn hình lớn cho nhu cầu học tập cơ bản.",
      stock: 16,
      threshold: 4,
      detail: { screen: "15.6 inch, FHD", os: "Windows 11 Home", cpu: "Intel Core i3 1115G4", gpu: "Intel UHD Graphics", ram: "8 GB", rom: "256 GB SSD", battery: "38 Wh" },
    },
    {
      masp: "LT-LENID5",
      name: "Lenovo IdeaPad Slim 5 14IRH8 i5 16GB/512GB",
      company: "Lenovo",
      categoryId: "L04",
      price: 16990000,
      img: "../images/lenovo-ideapad-slim-5.png",
      description: "Ideapad Slim 5 màn hình WUXGA OLED rực rỡ, vỏ kim loại chắc chắn chuẩn độ bền quân đội.",
      stock: 12,
      threshold: 3,
      detail: { screen: "14 inch, WUXGA OLED", os: "Windows 11 Home", cpu: "Intel Core i5 13420H", gpu: "Intel UHD Graphics", ram: "16 GB", rom: "512 GB SSD", battery: "56.6 Wh" },
    },
    {
      masp: "LT-LENLOQ",
      name: "Lenovo LOQ 15IAX9 (83GS000FVN)",
      company: "Lenovo",
      categoryId: "L04",
      price: 19990000,
      img: "../images/lenovo-loq-15iax9-83gs.jpg",
      description: "Lenovo LOQ thiết kế tản nhiệt hút gió ấn tượng, chip Core dòng HX và đồ họa rời RTX 2050.",
      stock: 10,
      threshold: 3,
      detail: { screen: "15.6 inch, FHD, 144Hz", os: "Windows 11 Home", cpu: "Intel Core i5 12450HX", gpu: "NVIDIA GeForce RTX 2050 4 GB", ram: "8 GB", rom: "512 GB SSD", battery: "60 Wh" },
    },
    {
      masp: "LT-LENLEG5",
      name: "Lenovo Legion 5 16IRX9 (83DG004YVN)",
      company: "Lenovo",
      categoryId: "L04",
      price: 35990000,
      img: "../images/lenovo-legion-5-16irx9-83dg004yvn.png",
      description: "Flagship gaming Lenovo Legion 5 với màn hình 2K 165Hz chuẩn màu 100% sRGB và card RTX 4060 8GB.",
      stock: 7,
      threshold: 2,
      detail: { screen: "16 inch, WQXGA 2K, 165Hz", os: "Windows 11 Home", cpu: "Intel Core i7 14650HX", gpu: "NVIDIA GeForce RTX 4060 8 GB", ram: "16 GB", rom: "512 GB SSD", battery: "80 Wh" },
    },
    {
      masp: "LT-ACASP3",
      name: "Acer Aspire 3 A315-59-381E i3 8GB/512GB",
      company: "Acer",
      categoryId: "L04",
      price: 9490000,
      img: "../images/acer-aspire-3-a315-59-381e.png",
      description: "Laptop Acer Aspire 3 giá rẻ, tối ưu cho văn phòng và học sinh sinh viên với RAM 8GB và SSD 512GB.",
      stock: 14,
      threshold: 4,
      detail: { screen: "15.6 inch, FHD", os: "Windows 11 Home", cpu: "Intel Core i3 1215U", gpu: "Intel UHD Graphics", ram: "8 GB", rom: "512 GB SSD", battery: "40 Wh" },
    },
    {
      masp: "LT-ACNITRO5",
      name: "Acer Nitro 5 AN515-58 i5 16GB/512GB RTX 3050",
      company: "Acer",
      categoryId: "L04",
      price: 18990000,
      img: "../images/pilot-acer-nitro-5.jpg",
      description: "Acer Nitro 5 Tiger hầm hố với 2 quạt tản nhiệt Acer CoolBoost và bàn phím RGB 4 vùng.",
      stock: 12,
      threshold: 3,
      detail: { screen: "15.6 inch, FHD, 144Hz", os: "Windows 11 Home", cpu: "Intel Core i5 12500H", gpu: "NVIDIA GeForce RTX 3050 4 GB", ram: "16 GB", rom: "512 GB SSD", battery: "57.5 Wh" },
    },
    {
      masp: "LT-MSIGF63",
      name: "MSI Thin GF63 12VE i5 16GB/512GB RTX 4050",
      company: "MSI",
      categoryId: "L04",
      price: 17990000,
      img: "../images/msi-thin-gf63-12ve-angle.webp",
      description: "Laptop gaming mỏng nhẹ hàng đầu MSI Thin GF63 trang bị card đồ họa RTX 4050 6GB thế hệ mới.",
      stock: 10,
      threshold: 3,
      detail: { screen: "15.6 inch, FHD, 144Hz", os: "Windows 11 Home", cpu: "Intel Core i5 12450H", gpu: "NVIDIA GeForce RTX 4050 6 GB", ram: "16 GB", rom: "512 GB SSD", battery: "52.4 Wh" },
    },
    {
      masp: "LT-MSIMOD14",
      name: "MSI Modern 14 C12MO-815 i3",
      company: "MSI",
      categoryId: "L04",
      price: 10490000,
      img: "../images/msi-modern-14-c12mo-815-studio.jpg",
      description: "MSI Modern 14 phong cách trẻ trung, trọng lượng 1.4 kg cùng độ bền chuẩn quân đội MIL-STD-810G.",
      stock: 15,
      threshold: 4,
      detail: { screen: "14 inch, FHD IPS", os: "Windows 11 Home", cpu: "Intel Core i3 1215U", gpu: "Intel UHD Graphics", ram: "8 GB", rom: "512 GB SSD", battery: "39.3 Wh" },
    },
  ],
};

  const batch3Product = (masp, name, company, categoryId, img, price, stock, detail) => ({
    masp,
    name,
    company,
    categoryId,
    img: "../images/" + img,
    price,
    stock,
    threshold: Math.max(2, Math.min(5, Math.floor(stock / 4))),
    description: `${name} chính hãng, thiết kế hiện đại, chất lượng vượt trội cùng chế độ bảo hành chính hãng tại TechStore.`,
    promo: { name: "", value: "" },
    star: 0,
    rateCount: 0,
    detail,
  });

  const BATCH_05_HEADPHONES = {
    batchId: "batch-03-headphones-v1",
    categories: [{ id: "L05", name: "Tai nghe", description: "Tai nghe chụp tai, on-ear và true wireless", profitRate: 20 }],
    products: [
      batch3Product("HP-APP3", "Apple AirPods (thế hệ 3)", "Apple", "L05", "airpods-3.png", 4290000, 18, { type: "True wireless", connection: "Bluetooth 5.0", noiseCancellation: "Không ANC", battery: "Tối đa 6 giờ; tối đa 30 giờ kèm hộp sạc" }),
      batch3Product("HP-APPP2", "Apple AirPods Pro (thế hệ 2, USB-C)", "Apple", "L05", "airpods-pro-2.png", 5990000, 14, { type: "True wireless in-ear", connection: "Bluetooth 5.3, USB-C", noiseCancellation: "ANC chủ động", battery: "Tối đa 6 giờ; tối đa 30 giờ kèm hộp sạc" }),
      batch3Product("HP-APMAX", "Apple AirPods Max", "Apple", "L05", "airpods-max.png", 12990000, 8, { type: "Over-ear", connection: "Bluetooth 5.0, Lightning", noiseCancellation: "ANC chủ động", battery: "Tối đa 20 giờ" }),
      batch3Product("HP-SWHXM5", "Sony WH-1000XM5", "Sony", "L05", "sony-wh-1000xm5.png", 8490000, 10, { type: "Over-ear", connection: "Bluetooth 5.2, jack 3,5 mm", noiseCancellation: "ANC chủ động", battery: "Tối đa 30 giờ khi bật ANC" }),
      batch3Product("HP-SWHXM4", "Sony WH-1000XM4", "Sony", "L05", "sony-wh-1000xm4.png", 6490000, 12, { type: "Over-ear", connection: "Bluetooth 5.0, jack 3,5 mm", noiseCancellation: "ANC chủ động", battery: "Tối đa 30 giờ khi bật ANC" }),
      batch3Product("HP-SCH520", "Sony WH-CH520", "Sony", "L05", "sony-wh-ch520.jpg", 1290000, 22, { type: "On-ear", connection: "Bluetooth 5.2", noiseCancellation: "Không ANC", battery: "Tối đa 50 giờ" }),
      batch3Product("HP-SWFXM5", "Sony WF-1000XM5", "Sony", "L05", "sony-wf-1000xm5.png", 5990000, 11, { type: "True wireless in-ear", connection: "Bluetooth 5.3, USB-C", noiseCancellation: "ANC chủ động", battery: "Tối đa 8 giờ khi bật ANC; 24 giờ kèm hộp" }),
      batch3Product("HP-SSB2", "Samsung Galaxy Buds2", "Samsung", "L05", "samsung-galaxy-buds2.png", 1990000, 20, { type: "True wireless in-ear", connection: "Bluetooth 5.2, USB-C", noiseCancellation: "ANC chủ động", battery: "Tối đa 5 giờ khi bật ANC; 20 giờ kèm hộp" }),
      batch3Product("HP-SSB2P", "Samsung Galaxy Buds2 Pro", "Samsung", "L05", "samsung-galaxy-buds2-pro.png", 3490000, 16, { type: "True wireless in-ear", connection: "Bluetooth 5.3, USB-C", noiseCancellation: "ANC chủ động", battery: "Tối đa 5 giờ khi bật ANC; 18 giờ kèm hộp" }),
      batch3Product("HP-SSBFE", "Samsung Galaxy Buds FE", "Samsung", "L05", "samsung-galaxy-buds-fe.png", 1790000, 24, { type: "True wireless in-ear", connection: "Bluetooth 5.2, USB-C", noiseCancellation: "ANC chủ động", battery: "Tối đa 6 giờ khi bật ANC; 21 giờ kèm hộp" }),
      batch3Product("HP-JBL520", "JBL Tune 520BT", "JBL", "L05", "jbl-tune-520bt.png", 1190000, 25, { type: "On-ear", connection: "Bluetooth 5.3, USB-C", noiseCancellation: "Không ANC", battery: "Tối đa 57 giờ" }),
      batch3Product("HP-JBLWAVE", "JBL Wave Beam", "JBL", "L05", "jbl-wave-beam.png", 1290000, 23, { type: "True wireless in-ear", connection: "Bluetooth 5.2, USB-C", noiseCancellation: "Không ANC", battery: "Tối đa 8 giờ; thêm 24 giờ từ hộp sạc" }),
      batch3Product("HP-MAJOR4", "Marshall Major IV", "Marshall", "L05", "marshall-major-iv-studio.png", 3990000, 13, { type: "On-ear", connection: "Bluetooth 5.0, jack 3,5 mm", noiseCancellation: "Không ANC", battery: "Trên 80 giờ" }),
      batch3Product("HP-MINOR3", "Marshall Minor III", "Marshall", "L05", "marshall-minor-iii.png", 2990000, 14, { type: "True wireless earbuds", connection: "Bluetooth 5.2, USB-C", noiseCancellation: "Không ANC", battery: "Tối đa 5 giờ; 25 giờ kèm hộp" }),
      batch3Product("HP-MOTIF2", "Marshall Motif II A.N.C.", "Marshall", "L05", "marshall-motif-ii-anc-studio.png", 4990000, 10, { type: "True wireless in-ear", connection: "Bluetooth 5.3 LE, USB-C", noiseCancellation: "ANC chủ động", battery: "Tối đa 6 giờ khi bật ANC; 30 giờ kèm hộp" }),
    ],
  };

  const BATCH_06_WATCHES = {
    batchId: "batch-03-watches-v1",
    categories: [{ id: "L06", name: "Đồng hồ thông minh", description: "Đồng hồ và vòng đeo tay thông minh", profitRate: 20 }],
    products: [
      batch3Product("SW-AWS9", "Apple Watch Series 9 GPS 45mm", "Apple", "L06", "apple-watch-series-9.png", 9990000, 12, { size: "45 mm", screen: "Always-On Retina LTPO OLED, tối đa 2.000 nit", compatibility: "iPhone Xs trở lên với iOS 17 trở lên", waterResistance: "WR50; IP6X", battery: "Tối đa 18 giờ" }),
      batch3Product("SW-AWSE2", "Apple Watch SE (thế hệ 2) GPS 44mm", "Apple", "L06", "apple-watch-se-2.png", 6290000, 15, { size: "44 mm", screen: "Retina LTPO OLED, tối đa 1.000 nit", compatibility: "iPhone 8 trở lên với iOS 16 trở lên", waterResistance: "WR50", battery: "Tối đa 18 giờ" }),
      batch3Product("SW-AWU2", "Apple Watch Ultra 2 GPS + Cellular 49mm", "Apple", "L06", "apple-watch-ultra-2-49mm-black-ocean.jpg", 21990000, 7, { size: "49 mm", screen: "Always-On Retina LTPO OLED, tối đa 3.000 nit", compatibility: "iPhone Xs trở lên với iOS 17 trở lên", waterResistance: "WR100; IP6X; lặn giải trí 40 m", battery: "Tối đa 36 giờ" }),
      batch3Product("SW-GW6", "Samsung Galaxy Watch6 Bluetooth 44mm", "Samsung", "L06", "samsung-galaxy-watch6.png", 5490000, 14, { size: "44 mm", screen: "1,5 inch Super AMOLED 480 × 480", compatibility: "Android 10 trở lên, RAM trên 1,5 GB", waterResistance: "5ATM + IP68", battery: "425 mAh; tối đa 40 giờ khi tắt AOD" }),
      batch3Product("SW-GW6C", "Samsung Galaxy Watch6 Classic Bluetooth 47mm", "Samsung", "L06", "samsung-galaxy-watch6-classic.png", 7490000, 11, { size: "47 mm", screen: "1,5 inch Super AMOLED 480 × 480", compatibility: "Android 10 trở lên, RAM trên 1,5 GB", waterResistance: "5ATM + IP68", battery: "425 mAh; tối đa 40 giờ khi tắt AOD" }),
      batch3Product("SW-GFR55", "Garmin Forerunner 55", "Garmin", "L06", "garmin-forerunner-55.png", 3990000, 13, { size: "42 mm", screen: "1,04 inch MIP 208 × 208", compatibility: "Android và iOS qua Garmin Connect", waterResistance: "5ATM", battery: "Tối đa 14 ngày; GPS tối đa 20 giờ" }),
      batch3Product("SW-GFR265", "Garmin Forerunner 265", "Garmin", "L06", "garmin-forerunner-265.png", 10990000, 8, { size: "46,1 mm", screen: "1,3 inch AMOLED 416 × 416", compatibility: "Android và iOS qua Garmin Connect", waterResistance: "5ATM", battery: "Tối đa 13 ngày; GPS tối đa 20 giờ" }),
      batch3Product("SW-HWGT4", "Huawei Watch GT 4 46mm", "Huawei", "L06", "huawei-watch-gt-4.png", 5990000, 12, { size: "46 mm", screen: "1,43 inch AMOLED 466 × 466", compatibility: "Android 8.0 trở lên; iOS 13.0 trở lên", waterResistance: "5ATM", battery: "Tối đa 14 ngày; 8 ngày sử dụng thông thường" }),
      batch3Product("SW-RW4", "Redmi Watch 4", "Xiaomi", "L06", "redmi-watch-4.png", 2490000, 20, { size: "47,58 × 41,12 × 10,5 mm", screen: "1,97 inch AMOLED 390 × 450, 60 Hz", compatibility: "Android và iOS qua Mi Fitness", waterResistance: "5ATM", battery: "470 mAh; tối đa 20 ngày" }),
      batch3Product("SW-XSB8P", "Xiaomi Smart Band 8 Pro", "Xiaomi", "L06", "xiaomi-smart-band-8-pro.png", 1690000, 22, { size: "46 × 33,35 × 9,99 mm", screen: "1,74 inch AMOLED, 60 Hz", compatibility: "Android 8.0 trở lên; iOS 12.0 trở lên", waterResistance: "5ATM", battery: "Tối đa 14 ngày; 6 ngày khi bật AOD" }),
    ],
  };

  const BATCH_07_SPEAKERS = {
    batchId: "batch-03-speakers-v1",
    categories: [{ id: "L07", name: "Loa", description: "Loa Bluetooth, AirPlay và loa để bàn", profitRate: 20 }],
    products: [
      batch3Product("SP-JBLC5", "JBL Charge 5", "JBL", "L07", "jbl-charge-5.png", 3990000, 15, { connection: "Bluetooth 5.1, USB-C", power: "40 W RMS (30 W woofer + 10 W tweeter)", battery: "Tối đa 20 giờ" }),
      batch3Product("SP-JBLF6", "JBL Flip 6", "JBL", "L07", "jbl-flip-6.png", 2990000, 18, { connection: "Bluetooth 5.1, USB-C", power: "30 W RMS (20 W woofer + 10 W tweeter)", battery: "Tối đa 12 giờ" }),
      batch3Product("SP-JBLCL4", "JBL Clip 4", "JBL", "L07", "jbl-clip-4.png", 1490000, 20, { connection: "Bluetooth 5.1, USB-C", power: "5 W RMS", battery: "Tối đa 10 giờ" }),
      batch3Product("SP-JBLG3", "JBL Go 3", "JBL", "L07", "jbl-go-3.png", 990000, 25, { connection: "Bluetooth 5.1, USB-C", power: "4,2 W RMS", battery: "Tối đa 5 giờ" }),
      batch3Product("SP-MAREM2", "Marshall Emberton II", "Marshall", "L07", "marshall-emberton-ii.png", 4490000, 12, { connection: "Bluetooth 5.1, USB-C", power: "2 × 10 W Class D", battery: "Trên 30 giờ" }),
      batch3Product("SP-MARWIL", "Marshall Willen", "Marshall", "L07", "marshall-willen.png", 2490000, 15, { connection: "Bluetooth 5.1, USB-C", power: "10 W Class D", battery: "Trên 15 giờ" }),
      batch3Product("SP-MARST3", "Marshall Stanmore III", "Marshall", "L07", "marshall-stanmore-iii.png", 8990000, 8, { connection: "Bluetooth 5.2, RCA, jack 3,5 mm", power: "80 W Class D (50 W + 2 × 15 W)", battery: "Không có pin; dùng nguồn AC" }),
      batch3Product("SP-SXB100", "Sony SRS-XB100", "Sony", "L07", "sony-srs-xb100.png", 1290000, 20, { connection: "Bluetooth 5.3, USB-C chỉ để sạc", power: "Sony không công bố công suất đầu ra; tiêu thụ khoảng 2,5 W", battery: "Tối đa 16 giờ" }),
      batch3Product("SP-HPMINI", "Apple HomePod mini", "Apple", "L07", "apple-homepod-mini.png", 2990000, 14, { connection: "Wi‑Fi 802.11n, AirPlay 2, Thread; cáp USB-C liền", power: "Apple không công bố công suất loa; adapter 20 W", battery: "Không có pin; dùng nguồn USB-C" }),
      batch3Product("SP-HKONYX8", "Harman Kardon Onyx Studio 8", "Harman Kardon", "L07", "harman-kardon-onyx-studio-8.png", 5990000, 10, { connection: "Bluetooth 5.2, nguồn AC", power: "50 W RMS", battery: "Tối đa 8 giờ" }),
    ],
  };

  const BATCH_08_ACCESSORIES = {
    batchId: "batch-03-accessories-v1",
    categories: [{ id: "L03", name: "Phụ kiện", description: "Chuột, bàn phím, củ sạc, cáp và pin dự phòng", profitRate: 20 }],
    products: [
      batch3Product("AC-MX3S", "Chuột Logitech MX Master 3S", "Logitech", "L08", "logitech-mx-master-3s.png", 2490000, 18, { accessoryType: "Chuột", connection: "Bluetooth LE, đầu thu Logi Bolt, USB-C để sạc", dpi: "200–8.000 DPI" }),
      batch3Product("AC-M650", "Chuột Logitech Signature M650", "Logitech", "L08", "logitech-signature-m650.jpg", 799000, 24, { accessoryType: "Chuột", connection: "Bluetooth LE, đầu thu Logi Bolt", dpi: "200–4.000 DPI" }),
      batch3Product("AC-G102", "Chuột Logitech G102 LIGHTSYNC", "Logitech", "L08", "logitech-g102-lightsync.png", 499000, 28, { accessoryType: "Chuột", connection: "USB-A có dây", dpi: "200–8.000 DPI" }),
      batch3Product("AC-MGMOUSE", "Apple Magic Mouse (USB-C)", "Apple", "L08", "apple-magic-mouse.png", 2490000, 15, { accessoryType: "Chuột", connection: "Bluetooth, USB-C để ghép đôi và sạc", dpi: "Apple không công bố DPI" }),
      batch3Product("AC-K380", "Bàn phím Logitech K380 Multi-Device", "Logitech", "L08", "logitech-k380.png", 799000, 22, { accessoryType: "Bàn phím", connection: "Bluetooth Classic, tối đa 3 thiết bị", layout: "79 phím, compact không numpad", keyType: "Phím cắt kéo" }),
      batch3Product("AC-MXKEYS", "Bàn phím Logitech MX Keys S", "Logitech", "L08", "logitech-mx-keys-s.png", 2490000, 14, { accessoryType: "Bàn phím", connection: "Bluetooth LE, đầu thu Logi Bolt, USB-C để sạc", layout: "Full-size có cụm số", keyType: "Phím cắt kéo, có đèn nền" }),
      batch3Product("AC-KEYK8", "Bàn phím cơ Keychron K8", "Keychron", "L08", "keychron-k8.png", 2190000, 13, { accessoryType: "Bàn phím", connection: "Bluetooth 5.1 tối đa 3 thiết bị, USB-C có dây", layout: "80% TKL, ANSI", keyType: "Gateron G Pro Mechanical" }),
      batch3Product("AC-MGKEY", "Apple Magic Keyboard (USB-C)", "Apple", "L08", "apple-magic-keyboard.png", 2490000, 12, { accessoryType: "Bàn phím", connection: "Bluetooth, USB-C để ghép đôi và sạc", layout: "Compact, không Touch ID và không cụm số", keyType: "Phím cắt kéo" }),
      batch3Product("AC-AP20W", "Củ sạc Apple USB-C 20W", "Apple", "L08", "apple-20w-usb-c-adapter.png", 549000, 30, { accessoryType: "Củ sạc", ports: "1 × USB-C", power: "20 W (9 V/2,2 A)", chargingStandard: "USB Power Delivery" }),
      batch3Product("AC-AN30W", "Củ sạc Anker 511 Nano 3 30W (A2147)", "Anker", "L08", "anker-nano-3-30w.png", 499000, 28, { accessoryType: "Củ sạc", ports: "1 × USB-C", power: "30 W", chargingStandard: "PowerIQ 3.0, USB PD, PPS" }),
      batch3Product("AC-AN70W", "Củ sạc Anker Nano 70W 3 cổng (A121A)", "Anker", "L08", "anker-nano-70w.png", 1190000, 20, { accessoryType: "Củ sạc", ports: "2 × USB-C, 1 × USB-A", power: "70 W tổng; tối đa 70 W mỗi cổng USB-C khi dùng đơn", chargingStandard: "USB PD, PPS, PowerIQ" }),
      batch3Product("AC-UG65W", "Củ sạc UGREEN Nexode GaN 65W 3 cổng (90663)", "UGREEN", "L08", "ugreen-nexode-65w.png", 1090000, 20, { accessoryType: "Củ sạc", ports: "2 × USB-C, 1 × USB-A", power: "65 W tổng", chargingStandard: "PD 3.0, PPS, QC 4+, SCP, FCP, AFC" }),
      batch3Product("AC-APC1M", "Cáp sạc Apple USB-C 1 m", "Apple", "L08", "apple-usb-c-charge-cable-1m.png", 499000, 32, { accessoryType: "Cáp", connectors: "USB-C ↔ USB-C", length: "1 m", power: "Hỗ trợ sạc USB-C; công suất phụ thuộc adapter và thiết bị" }),
      batch3Product("AC-ANFLOW", "Cáp Anker Flow USB-C to Lightning 0,9 m", "Anker", "L08", "anker-flow-usb-c-lightning.png", 449000, 30, { accessoryType: "Cáp", connectors: "USB-C ↔ Lightning", length: "0,9 m", power: "Hỗ trợ sạc nhanh USB PD cho thiết bị Lightning" }),
      batch3Product("AC-ANZOLO", "Cáp Anker Zolo USB-C to USB-C 240W 1,8 m", "Anker", "L08", "anker-zolo-usb-c-240w.png", 399000, 26, { accessoryType: "Cáp", connectors: "USB-C ↔ USB-C", length: "1,8 m", power: "Tối đa 240 W USB PD 3.1 EPR" }),
      batch3Product("AC-UGUNO", "Cáp UGREEN Uno USB-C to USB-C 100W 1 m", "UGREEN", "L08", "ugreen-uno-usb-c-100w.png", 299000, 30, { accessoryType: "Cáp", connectors: "USB-C ↔ USB-C", length: "1 m", power: "Tối đa 100 W USB Power Delivery" }),
      batch3Product("AC-AN737", "Pin dự phòng Anker 737 PowerCore 24K (A1289)", "Anker", "L08", "anker-737-power-bank.png", 3990000, 12, { accessoryType: "Pin dự phòng", capacity: "24.000 mAh", ports: "2 × USB-C, 1 × USB-A", power: "Tổng đầu ra tối đa 140 W" }),
      batch3Product("AC-ANNANO10", "Pin dự phòng Anker Nano 10K 30W tích hợp USB-C", "Anker", "L08", "anker-nano-power-bank-10000.png", 1490000, 18, { accessoryType: "Pin dự phòng", capacity: "10.000 mAh", ports: "Cáp USB-C tích hợp, 1 × USB-C", power: "Đầu ra tối đa 30 W" }),
      batch3Product("AC-SSEBP3400", "Pin dự phòng Samsung 10.000mAh 25W (EB-P3400)", "Samsung", "L08", "samsung-eb-p3400-power-bank.png", 1290000, 18, { accessoryType: "Pin dự phòng", capacity: "10.000 mAh", ports: "2 × USB-C", power: "SFC/PD vào-ra tối đa 25 W" }),
      batch3Product("AC-XIPB4I", "Pin dự phòng Xiaomi Power Bank 4i 10.000mAh 22,5W", "Xiaomi", "L08", "xiaomi-power-bank-4i-10000.png", 699000, 24, { accessoryType: "Pin dự phòng", capacity: "10.000 mAh", ports: "1 × USB-C, 2 × USB-A", power: "Đầu ra tối đa 22,5 W" }),
    ],
  };
  // L03 là danh mục Phụ kiện đã tồn tại từ dữ liệu gốc.
  BATCH_08_ACCESSORIES.products.forEach((product) => {
    product.categoryId = "L03";
  });

  const EXPANSION_BATCHES = [BATCH_01, BATCH_02, BATCH_03, BATCH_04, BATCH_05_HEADPHONES, BATCH_06_WATCHES, BATCH_07_SPEAKERS, BATCH_08_ACCESSORIES];


  const CANONICAL_PRODUCT_IMAGES = {
  "Nok0": "../images/nokia-5-1-plus-black.png",
  "DT-IP13": "../images/pilot-iphone-13.png",
  "DT-SS23": "../images/pilot-samsung-galaxy-s23.png",
  "DT-OPRE11": "../images/oppo-reno-11.png",
  "DT-XIN13": "../images/xiaomi-redmi-note-13.png",
  "DT-REAC67": "../images/realme-c67.png",
  "DT-VIVV29": "../images/vivo-v29e.png",
  "TB-IP9": "../images/ipad-gen-9.png",
  "TB-IP10": "../images/pilot-ipad-gen-10.jpg",
  "TB-IPAIR5": "../images/ipad-air-5.png",
  "TB-IPMINI6": "../images/ipad-mini-6.png",
  "TB-IPPRO11": "../images/ipad-pro-11.jpg",
  "TB-SSA9": "../images/samsung-galaxy-tab-a9.png",
  "TB-SSA9P": "../images/samsung-galaxy-tab-a9-plus.jpg",
  "TB-SSS9FE": "../images/samsung-galaxy-tab-s9-fe.jpg",
  "TB-SSS9": "../images/pilot-samsung-galaxy-tab-s9.png",
  "TB-XIPAD6": "../images/xiaomi-pad-6.jpg",
  "TB-REDPAD": "../images/redmi-pad-se.png",
  "TB-LENM11": "../images/lenovo-tab-m11.png",
  "TB-LENP11": "../images/lenovo-tab-p11.png",
  "TB-OPPAD2": "../images/oppo-pad-neo.png",
  "LT-APM1": "../images/pilot-macbook-air-m1.jpg",
  "LT-APM2": "../images/macbook-air-m2.jpg",
  "LT-APM3": "../images/macbook-air-m3.jpg",
  "LT-APPR14": "../images/macbook-pro-14-m3.jpg",
  "LT-ASVIVO15": "../images/asus-vivobook-15.png",
  "LT-ASVIVO14": "../images/asus-vivobook-14.jpg",
  "LT-ASZEN14": "../images/asus-zenbook-14.jpg",
  "LT-ASTUF15": "../images/asus-tuf-gaming-f15.jpg",
  "LT-ASROG6": "../images/asus-rog-strix-g16.png",
  "LT-DELL3520": "../images/dell-inspiron-15-3520.png",
  "LT-DELL3530": "../images/dell-inspiron-15-3530-i7-1355u.jpg",
  "LT-DELLVO15": "../images/dell-vostro-15-3520.jpg",
  "LT-DELLXPS13": "../images/dell-xps-13.png",
  "LT-HP15S": "../images/hp-15s-fq5229tu.png",
  "LT-HPPAV14": "../images/hp-pavilion-14.jpg",
  "LT-HPENVY13": "../images/hp-envy-x360.jpg",
  "LT-HPVICT16": "../images/hp-victus-16-r0129tx-8c5n4pa.jpg",
  "LT-LENID3": "../images/lenovo-ideapad-3.jpg",
  "LT-LENID5": "../images/lenovo-ideapad-slim-5.png",
  "LT-LENLOQ": "../images/lenovo-loq-15iax9-83gs.jpg",
  "LT-LENLEG5": "../images/lenovo-legion-5-16irx9-83dg004yvn.png",
  "LT-ACASP3": "../images/acer-aspire-3-a315-59-381e.png",
  "LT-ACNITRO5": "../images/pilot-acer-nitro-5.jpg",
  "LT-MSIGF63": "../images/msi-thin-gf63-12ve-angle.webp",
  "LT-MSIMOD14": "../images/msi-modern-14-c12mo-815-studio.jpg",
  "HP-MAJOR4": "../images/marshall-major-iv-studio.png",
  "HP-MOTIF2": "../images/marshall-motif-ii-anc-studio.png",
  "SW-AWU2": "../images/apple-watch-ultra-2-49mm-black-ocean.jpg"
};

  const KNOWN_OLD_IMAGE_PATHS = new Set([
    "../images/marshall-major-iv.png",
    "images/marshall-major-iv.png",
    "images/nokia-51-plus-black-18thangbh-400x400.jpg",
    "../images/nokia-51-plus-black-18thangbh-400x400.jpg",
    "../images/dell-inspiron-15-3530.jpg",
    "../images/hp-15s.png",
    "../images/hp-victus-16.png",
    "../images/lenovo-loq-15.jpg",
    "../images/acer-aspire-3.png",
    "../images/msi-thin-gf63.png",
    "../images/msi-modern-14.png",
    "images/hp-victus-16.jpg",
    "images/lenovo-ideapad-slim-5.jpg",
    "images/lenovo-loq-15.webp",
    "images/acer-aspire-3.jpg",
    "images/msi-modern-14.jpg",
    "images/hp-15s.jpg",
    "../images/hp-15s.jpg",
    "images/dell-xps-13.jpg",
    "../images/dell-xps-13.jpg",
    "images/dell-inspiron-15-3520.jpg",
    "images/asus-rog-strix-g16.jpg",
    "../images/asus-rog-strix-g16.jpg",
    "images/asus-vivobook-15.jpg",
    "../images/asus-vivobook-15.jpg",
    "images/oppo-pad-neo.jpg",
    "../images/oppo-pad-neo.jpg",
    "images/lenovo-tab-p11.jpg",
    "../images/lenovo-tab-p11.jpg",
    "images/lenovo-tab-m11.jpg",
    "../images/lenovo-tab-m11.jpg",
    "images/redmi-pad-se.jpg",
    "../images/redmi-pad-se.jpg",
    "images/samsung-galaxy-tab-a9.jpg",
    "../images/samsung-galaxy-tab-a9.jpg",
    "images/ipad-pro-11.png",
    "../images/ipad-pro-11.png",
    "images/ipad-mini-6.jpg",
    "../images/ipad-mini-6.jpg",
    "images/ipad-air-5.jpg",
    "../images/ipad-air-5.jpg",
    "images/vivo-v29e.jpg",
    "../images/vivo-v29e.jpg",
    "images/realme-c67.jpg",
    "../images/realme-c67.jpg",
    "images/xiaomi-redmi-note-13.jpg",
    "../images/xiaomi-redmi-note-13.jpg",
    "images/oppo-reno-11.jpg",
    "../images/oppo-reno-11.jpg",
    "images/pilot-samsung-galaxy-tab-s9.jpg",
    "images/pilot-samsung-galaxy-s23.jpg",
    "images/pilot-iphone-13.jpg",
    "images/pilot-acer-nitro-5.png",
    "../images/macbook-air-m1.png",
    "images/macbook-air-m1.png",
    "../images/acer-nitro-5.png",
    "images/acer-nitro-5.png",
    "../images/iphone-13.png",
    "images/iphone-13.png",
    "../images/samsung-galaxy-s23.png",
    "images/samsung-galaxy-s23.png",
    "../images/ipad-gen-10.png",
    "images/ipad-gen-10.png",
    "../images/samsung-galaxy-tab-s9.png",
    "images/samsung-galaxy-tab-s9.png",
    "../images/iphone-x-256gb-silver-400x400.jpg",
    "../images/samsung-galaxy-a8-plus-2018-gold-600x600.jpg",
    "../images/oppo-f9-red-600x600.jpg",
    "../images/xiaomi-redmi-note-5-pro-600x600.jpg",
    "../images/oppo-a3s-32gb-600x600.jpg",
    "../images/xiaomi-mi-8-lite-black-1-600x600.jpg",
    "../images/ipad-wifi-32gb-2018-thumb-600x600.jpg",
    "../images/samsung-galaxy-j4-plus-pink-400x400.jpg",
    "../images/samsung-galaxy-j8-600x600-600x600.jpg",
    "../images/xiaomi-mi-8-1-600x600.jpg",
    "../images/xiaomi-redmi-5-plus-600x600.jpg",
    "../images/nokia-51-plus-black-18thangbh-400x400.jpg",
    "../images/huawei-mate-20-pro-green-600x600.jpg",
    "images/iphone-x-256gb-silver-400x400.jpg",
    "images/samsung-galaxy-a8-plus-2018-gold-600x600.jpg",
    "images/oppo-f9-red-600x600.jpg",
    "images/xiaomi-redmi-note-5-pro-600x600.jpg",
    "images/oppo-a3s-32gb-600x600.jpg",
    "images/xiaomi-mi-8-lite-black-1-600x600.jpg",
    "images/ipad-wifi-32gb-2018-thumb-600x600.jpg",
    "images/samsung-galaxy-j4-plus-pink-400x400.jpg",
    "images/samsung-galaxy-j8-600x600-600x600.jpg",
    "images/xiaomi-mi-8-1-600x600.jpg",
    "images/xiaomi-redmi-5-plus-600x600.jpg",
    "images/nokia-51-plus-black-18thangbh-400x400.jpg",
    "images/huawei-mate-20-pro-green-600x600.jpg"
  ]);

  function patchProductImagePaths(db) {
    if (!db || !Array.isArray(db.products)) {
      return { updated: 0, skipped: 0, customKept: 0, details: [] };
    }
    const report = {
      updated: 0,
      skipped: 0,
      customKept: 0,
      details: []
    };

    let modified = false;
    for (const p of db.products) {
      const code = p.masp || p.id;
      const targetImg = CANONICAL_PRODUCT_IMAGES[code];
      if (!targetImg) continue;

      const currentImg = p.img || "";
      if (currentImg === targetImg) {
        report.skipped++;
        continue;
      }

      // Check if current img matches known placeholder paths or is empty
      const normImg = currentImg.replace(/^\.\.\//, "");
      const isKnownOld = KNOWN_OLD_IMAGE_PATHS.has(currentImg) ||
                         KNOWN_OLD_IMAGE_PATHS.has(normImg) ||
                         KNOWN_OLD_IMAGE_PATHS.has("../" + normImg);
      if (!currentImg || isKnownOld) {
        const oldVal = p.img;
        p.img = targetImg;
        modified = true;
        report.updated++;
        report.details.push({ code, name: p.name, from: oldVal, to: targetImg, action: "updated" });
      } else {
        // Preserves custom user edit!
        report.customKept++;
        report.details.push({ code, name: p.name, current: currentImg, action: "custom_kept" });
      }
    }

    if (modified) {
      try {
        save(db);
      } catch (err) {
        console.warn("Không thể lưu tự động khi cập nhật ảnh sản phẩm:", err);
      }
    }

    return report;
  }

  const BATCH2_CORRECTION_ID = "batch-02-audit-v1";
  const BATCH2_LAPTOP_GPUS = {
    "LT-APM1": "GPU Apple 7 lõi",
    "LT-APM2": "GPU Apple 8 lõi",
    "LT-APM3": "GPU Apple 8 lõi",
    "LT-APPR14": "GPU Apple 10 lõi",
    "LT-ASVIVO15": "Intel Iris Xe Graphics",
    "LT-ASVIVO14": "Intel Iris Xe Graphics",
    "LT-ASZEN14": "Intel Arc Graphics",
    "LT-ASTUF15": "NVIDIA GeForce RTX 2050 4 GB",
    "LT-ASROG6": "NVIDIA GeForce RTX 4050 6 GB",
    "LT-DELL3520": "Intel Iris Xe Graphics",
    "LT-DELL3530": "Intel Iris Xe Graphics",
    "LT-DELLVO15": "Intel UHD Graphics",
    "LT-DELLXPS13": "Intel Iris Xe Graphics",
    "LT-HP15S": "Intel UHD Graphics",
    "LT-HPPAV14": "Intel Iris Xe Graphics",
    "LT-HPENVY13": "Intel Iris Xe Graphics",
    "LT-HPVICT16": "NVIDIA GeForce RTX 3050 6 GB",
    "LT-LENID3": "Intel UHD Graphics",
    "LT-LENID5": "Intel UHD Graphics",
    "LT-LENLOQ": "NVIDIA GeForce RTX 2050 4 GB",
    "LT-LENLEG5": "NVIDIA GeForce RTX 4060 8 GB",
    "LT-ACASP3": "Intel UHD Graphics",
    "LT-ACNITRO5": "NVIDIA GeForce RTX 3050 4 GB",
    "LT-MSIGF63": "NVIDIA GeForce RTX 4050 6 GB",
    "LT-MSIMOD14": "Intel UHD Graphics",
  };
  const BATCH2_LAPTOP_NAMES = {
    "LT-APM1": ["MacBook Air 13 inch M1 256GB", "MacBook Air 13 inch M1 8GB/256GB"],
    "LT-APM2": ["MacBook Air 13 inch M2 256GB", "MacBook Air 13 inch M2 8GB/256GB"],
    "LT-APM3": ["MacBook Air 13 inch M3 256GB", "MacBook Air 13 inch M3 16GB/256GB"],
    "LT-APPR14": ["MacBook Pro 14 inch M3 512GB", "MacBook Pro 14 inch M3 16GB/512GB"],
    "LT-ASVIVO15": ["ASUS Vivobook 15 X1504ZA", "ASUS Vivobook 15 X1504ZA i5-1235U 16GB/512GB"],
    "LT-ASVIVO14": ["ASUS Vivobook 14 OLED A1405VA", "ASUS Vivobook 14 OLED A1405VA i5-13500H 16GB/512GB"],
    "LT-ASZEN14": ["ASUS Zenbook 14 OLED UX3405MA", "ASUS Zenbook 14 OLED UX3405MA Ultra 5 16GB/512GB"],
    "LT-ASTUF15": ["ASUS TUF Gaming F15 FX506HF", "ASUS TUF Gaming F15 FX506HF i5 16GB/512GB RTX 2050"],
    "LT-ASROG6": ["ASUS ROG Strix G16 G614JU", "ASUS ROG Strix G16 G614JU i7 16GB/512GB RTX 4050"],
    "LT-DELL3520": ["Dell Inspiron 15 3520 i5", "Dell Inspiron 15 3520 i5-1235U 8GB/512GB"],
    "LT-DELL3530": ["Dell Inspiron 15 3530 i7", "Dell Inspiron 15 3530 i7-1355U 16GB/512GB"],
    "LT-DELLVO15": ["Dell Vostro 15 3520 i3", "Dell Vostro 15 3520 i3-1215U 8GB/256GB"],
    "LT-DELLXPS13": ["Dell XPS 13 9315 i5", "Dell XPS 13 9315 i5-1230U 8GB/512GB"],
    "LT-HP15S": ["HP 15s-fq5229TU i3", "HP 15s-fq5229TU i3-1215U 8GB/512GB"],
    "LT-HPPAV14": ["HP Pavilion 14-dv2073TU i5", "HP Pavilion 14-dv2073TU (7C0P2PA) i5 16GB/512GB"],
    "LT-HPENVY13": ["HP Envy x360 13-bf0094TU i5", "HP Envy x360 13-bf0094TU (76B14PA) i5 16GB/512GB"],
    "LT-LENID3": ["Lenovo Ideapad 3 15ITL6 i3", "Lenovo IdeaPad 3 15ITL6 i3 8GB/256GB"],
    "LT-LENID5": ["Lenovo Ideapad Slim 5 14IRH8 i5", "Lenovo IdeaPad Slim 5 14IRH8 i5 16GB/512GB"],
    "LT-ACASP3": ["Acer Aspire 3 A315-59-381E i3", "Acer Aspire 3 A315-59-381E i3 8GB/512GB"],
    "LT-ACNITRO5": ["Acer Nitro 5 Tiger AN515-58 i5", "Acer Nitro 5 AN515-58 i5 16GB/512GB RTX 3050"],
    "LT-MSIGF63": ["MSI Thin GF63 12VE i5", "MSI Thin GF63 12VE i5 16GB/512GB RTX 4050"],
  };

  function patchBatch2Corrections(db) {
    if (!db || !Array.isArray(db.products)) return { updated: 0, skipped: true };
    db.dataMigrations = Array.isArray(db.dataMigrations) ? db.dataMigrations : [];
    if (db.dataMigrations.includes(BATCH2_CORRECTION_ID)) {
      return { updated: 0, skipped: true };
    }
    let updated = 0;
    const byId = new Map(db.products.map((product) => [product.masp, product]));
    const replace = (id, path, from, to) => {
      const product = byId.get(id);
      if (!product) return;
      const target = path.length === 1 ? product : (product[path[0]] ||= {});
      const key = path[path.length - 1];
      if (target[key] === from) {
        target[key] = to;
        updated++;
      }
    };
    replace("Opp0", ["name"], "Oppo F9", "OPPO F9");
    replace("Opp0", ["company"], "Oppo", "OPPO");
    replace("Opp1", ["name"], "Oppo A3s 32GB", "OPPO A3s 32GB");
    replace("Opp1", ["company"], "Oppo", "OPPO");
    replace("Sam0", ["name"], "SamSung Galaxy J4+", "Samsung Galaxy J4+");
    replace("App1", ["detail", "screen"], "LED-backlit LCD, 9.7p''", "9.7 inch, Retina IPS");
    replace("App1", ["detail", "battery"], "Chưa có thông số cụ thể", "Tối đa 10 giờ duyệt web Wi-Fi hoặc xem video");
    replace("Xia1", ["detail", "screen"], "IPS LCD, 6.26', Full HD+", "AMOLED, 6.21 inch, Full HD+");
    replace("Xia1", ["detail", "camara"], "12 MP và 5 MP (2 camera)", "2 camera 12 MP");
    replace("Xia1", ["detail", "camaraFront"], "24 MP", "20 MP");
    replace("Xia1", ["detail", "cpu"], "Qualcomm Snapdragon 660 8 nhân", "Qualcomm Snapdragon 845 8 nhân");
    replace("Xia1", ["detail", "ram"], "4 GB", "6 GB");
    replace("Xia1", ["detail", "microUSB"], "MicroSD, hỗ trợ tối đa 512 GB", "Không hỗ trợ thẻ nhớ; USB-C");
    replace("Xia1", ["detail", "battery"], "3300 mAh, có sạc nhanh", "3400 mAh, có sạc nhanh");
    replace("LT-HPVICT16", ["name"], "HP Victus 16-r0129TX i5", "HP Victus 16-r0129TX (8C5N4PA)");
    replace("LT-HPVICT16", ["detail", "cpu"], "Intel Core i5 13500H", "Intel Core i7 13700H");
    replace("LT-LENLOQ", ["name"], "Lenovo LOQ 15IAX9 i5", "Lenovo LOQ 15IAX9 (83GS000FVN)");
    replace("LT-LENLOQ", ["detail", "ram"], "16 GB", "8 GB");
    replace("LT-LENLEG5", ["name"], "Lenovo Legion 5 16IRX9 i7", "Lenovo Legion 5 16IRX9 (83DG004YVN)");
    replace("LT-MSIMOD14", ["name"], "MSI Modern 14 C12MO i3", "MSI Modern 14 C12MO-815 i3");
    for (const [id, [from, to]] of Object.entries(BATCH2_LAPTOP_NAMES)) {
      replace(id, ["name"], from, to);
    }
    for (const [id, gpu] of Object.entries(BATCH2_LAPTOP_GPUS)) {
      const product = byId.get(id);
      if (product && product.categoryId === "L04" && product.detail && !product.detail.gpu) {
        product.detail.gpu = gpu;
        updated++;
      }
    }
    db.dataMigrations.push(BATCH2_CORRECTION_ID);
    return { updated, skipped: false };
  }

  function cleanProductDescriptions(db) {
    if (!db || !Array.isArray(db.products)) return { updated: 0 };
    let updated = 0;
    for (const p of db.products) {
      if (
        typeof p.description === "string" &&
        (/dữ liệu demo của TechStore/i.test(p.description) ||
          /Thông số được đối chiếu/i.test(p.description))
      ) {
        p.description = `${p.name} chính hãng, thiết kế hiện đại, chất lượng vượt trội cùng chế độ bảo hành chính hãng tại TechStore.`;
        updated++;
      }
    }
    return { updated };
  }

  function importStandardBatches(db) {
    if (!db || !Array.isArray(db.products)) return db;
    let modified = false;
    db.importedBatches = db.importedBatches || [];
    for (const batch of EXPANSION_BATCHES) {
      if (!db.importedBatches.includes(batch.batchId)) {
        importBatch(db, batch);
        modified = true;
      }
    }
    const correctionRes = patchBatch2Corrections(db);
    if (!correctionRes.skipped || correctionRes.updated > 0) modified = true;
    const patchRes = patchProductImagePaths(db);
    if (patchRes.updated > 0) modified = true;
    const cleanRes = cleanProductDescriptions(db);
    if (cleanRes.updated > 0) modified = true;
    if (modified) {
      try {
        save(db);
      } catch (err) {
        console.warn("Không thể lưu tự động khi nạp đợt chuẩn:", err);
      }
    }
    return db;
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
    exportBackup,
    restoreBackup,
    importBatch,
    EXPANSION_BATCHES,
    importStandardBatches,
    CANONICAL_PRODUCT_IMAGES,
    patchProductImagePaths,
    patchBatch2Corrections,
    cleanProductDescriptions,
  };
})();
