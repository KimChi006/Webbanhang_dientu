/* GIAO DIỆN TECHSTORE
 * 1. Hàm hỗ trợ HTML và định dạng.
 * 2. Hàm render... hiển thị từng màn hình.
 * 3. Form thêm/sửa, xác nhận và các sự kiện người dùng.
 */
"use strict";
const S = window.TechStore;
const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (value) => Number(value).toLocaleString("vi-VN") + " ₫";
const dateText = (value) =>
  value
    ? value.slice(0, 10).split("-").reverse().join("/") +
      (value.includes("T") ? " " + value.slice(11, 16) : "")
    : "—";
const pageInfo = {
  customers: [
    "👥",
    "Quản lý khách hàng",
    "Theo dõi tài khoản, thông tin khách hàng và quyền truy cập.",
  ],
  categories: [
    "🗂️",
    "Quản lý loại sản phẩm",
    "Thêm, sửa và quản lý hiển thị các loại sản phẩm của cửa hàng.",
  ],
  products: [
    "📦",
    "Quản lý sản phẩm",
    "Quản lý thông tin, hình ảnh, mô tả và thông số sản phẩm.",
  ],
  imports: [
    "📥",
    "Quản lý nhập hàng",
    "Tạo phiếu nhập, kiểm tra giá nhập và hoàn thành nhập kho.",
  ],
  prices: [
    "🏷️",
    "Quản lý giá bán",
    "Tra cứu giá vốn, lợi nhuận và giá bán theo từng loại sản phẩm.",
  ],
  orders: [
    "🧾",
    "Quản lý đơn hàng",
    "Tra cứu, xem chi tiết và cập nhật tình trạng đơn đặt hàng.",
  ],
  inventory: [
    "📊",
    "Quản lý tồn kho",
    "Theo dõi tồn tại một thời điểm và báo cáo nhập – xuất – tồn.",
  ],
};
const statusInfo = {
  new: ["Mới đặt", "blue"],
  processed: ["Đã xử lý", "pending"],
  delivered: ["Đã giao", "active"],
  cancelled: ["Hủy", "locked"],
  draft: ["Chưa hoàn thành", "pending"],
  completed: ["Hoàn thành", "active"],
};
let db,
  currentPage = "customers",
  filters = {},
  pageNumber = 1,
  toastTimer,
  returnFocus;
const PAGE_SIZE = 8;
const category = (id) => db.categories.find((c) => c.id === id);
const product = (id) => db.products.find((p) => p.masp === id);
const customer = (id) => db.customers.find((c) => c.id === id);
const badge = (label, style = "active") =>
  `<span class="status status-${style}">${escapeHTML(label)}</span>`;
const stateBadge = (status) => badge(...statusInfo[status]);
const action = (label, name, id = "", style = "light") =>
  `<button type="button" class="btn btn-${style}" data-action="${name}" data-id="${escapeHTML(id)}">${label}</button>`;
function notify(message, error = false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.className = "toast" + (error ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 5000);
}
function persist(operation, message = "Đã lưu thay đổi.") {
  try {
    db = S.transact(db, operation);
    closeModal();
    render();
    notify(message);
  } catch (error) {
    if ($("#modal").open && $("#formMessage"))
      $("#formMessage").textContent = error.message;
    else notify(error.message, true);
  }
}
function field(
  name,
  label,
  value = "",
  type = "text",
  attributes = "",
  wide = false,
) {
  return `<div class="field ${wide ? "full-width" : ""}"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${escapeHTML(value)}" ${attributes}></div>`;
}
function select(name, label, html, wide = false) {
  return `<div class="field ${wide ? "full-width" : ""}"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}">${html}</select></div>`;
}
function textarea(name, label, value, required = false) {
  return `<div class="field full-width"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}" maxlength="3000" ${required ? "required" : ""}>${escapeHTML(value)}</textarea></div>`;
}
function options(items, value, key = "id", label = "name") {
  return items
    .map(
      (x) =>
        `<option value="${escapeHTML(x[key])}" ${String(value) === String(x[key]) ? "selected" : ""}>${escapeHTML(x[label])}</option>`,
    )
    .join("");
}
function image(p, className = "product-thumb") {
  return `<img class="${className}" src="${escapeHTML(S.safeImage(p.img) ? p.img : "../images/" + S.assets[0])}" alt="${escapeHTML(p.name)}" loading="lazy">`;
}
function productCell(p) {
  return `<div class="product-cell">${image(p)}<div><div class="product-name">${escapeHTML(p.name)}</div><div class="product-code">${escapeHTML(p.masp)} · ${escapeHTML(p.company)}</div></div></div>`;
}
function stat(icon, label, value, caption = "") {
  return `<div class="stat-card"><span class="stat-icon" aria-hidden="true">${icon}</span><div class="stat-title">${label}</div><div class="stat-number">${value}</div>${caption ? `<div class="stat-caption">${caption}</div>` : ""}</div>`;
}
function panel(title, body, tools = "", description = "") {
  return `<section class="panel"><div class="panel-header"><div><h3>${title}</h3>${description ? `<p>${description}</p>` : ""}</div>${tools}</div>${body}</section>`;
}
function table(headers, rows, paginate = true, footerRow = "") {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  if (paginate) pageNumber = Math.min(pageNumber, pages);
  const shown = paginate
    ? rows.slice((pageNumber - 1) * PAGE_SIZE, pageNumber * PAGE_SIZE)
    : rows;
  return `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${shown.length ? shown.join("") : `<tr><td colspan="${headers.length}"><div class="empty-state"><strong>Không có dữ liệu phù hợp</strong>Thử thay đổi bộ lọc hoặc thêm dữ liệu mới.</div></td></tr>`}</tbody>${footerRow ? `<tfoot>${footerRow}</tfoot>` : ""}</table></div><div class="table-footer"><span>${rows.length} kết quả${paginate && rows.length ? " · " + ((pageNumber - 1) * PAGE_SIZE + 1) + "–" + Math.min(pageNumber * PAGE_SIZE, rows.length) : ""}</span>${paginate ? `<div class="pagination"><button class="btn btn-light" data-action="previous" ${pageNumber === 1 ? "disabled" : ""} aria-label="Trang trước">←</button><span>Trang ${pageNumber} / ${pages}</span><button class="btn btn-light" data-action="next" ${pageNumber === pages ? "disabled" : ""} aria-label="Trang sau">→</button></div>` : ""}</div>`;
}
function filterInput(name, label, type = "text", placeholder = "") {
  return `<div class="field ${name === "q" ? "search" : ""} ${type === "datetime-local" ? "time" : ""}"><label for="filter-${name}">${label}</label><input id="filter-${name}" name="${name}" type="${type}" value="${escapeHTML(filters[name] || "")}" placeholder="${placeholder}"></div>`;
}
function filterSelect(name, label, html) {
  return `<div class="field"><label for="filter-${name}">${label}</label><select id="filter-${name}" name="${name}"><option value="">Tất cả</option>${html}</select></div>`;
}
function categoryFilter() {
  return filterSelect(
    "categoryId",
    "Loại sản phẩm",
    options(db.categories, filters.categoryId),
  );
}
function queryFilter() {
  return filterInput(
    "q",
    "Tìm kiếm",
    "search",
    "Tên, mã hoặc thông tin liên quan…",
  );
}
function filterForm(content, kind = "main") {
  return `<form class="filters" data-filter-form="${kind}">${content}<button type="submit" class="btn btn-primary">${kind === "report" ? "Xem báo cáo" : "Áp dụng"}</button>${action("Xóa lọc", "clear-filters")}</form>`;
}
function match(...values) {
  return (
    !filters.q || S.normalize(values.join(" ")).includes(S.normalize(filters.q))
  );
}
function matchesProduct(p) {
  return (
    match(p.name, p.masp, p.company) &&
    (!filters.categoryId || p.categoryId === filters.categoryId) &&
    (!filters.productId || p.masp === filters.productId)
  );
}
function dateRangeError(from, to) {
  return from && to && from > to
    ? '<p class="message" role="alert" style="padding:0 20px">Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.</p>'
    : "";
}
function defaultFilters(page) {
  return page === "inventory"
    ? {
        at: S.now(),
        reportFrom: S.ago(29, "00:00"),
        reportTo: S.now(),
        group: "product",
      }
    : {};
}
function go(page) {
  currentPage = pageInfo[page] ? page : "customers";
  filters = defaultFilters(currentPage);
  pageNumber = 1;
  render();
  $("#mainContent").focus({ preventScroll: true });
}
function render() {
  $("#topbarTitle").textContent = pageInfo[currentPage][1];
  $("#pageTitle").textContent = pageInfo[currentPage][1];
  $("#pageDescription").textContent = pageInfo[currentPage][2];
  document.querySelectorAll("[data-page]").forEach((b) => {
    const active = b.dataset.page === currentPage;
    b.classList.toggle("active", active);
    if (active) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  const actions = {
    categories: action("+ Thêm loại sản phẩm", "edit-category", "", "primary"),
    products: action("+ Thêm sản phẩm", "edit-product", "", "primary"),
    imports: action("+ Tạo phiếu nhập", "edit-receipt", "", "primary"),
  };
  $("#pageActions").innerHTML = actions[currentPage] || "";
  const views = {
    customers: renderCustomers,
    categories: renderCategories,
    products: renderProducts,
    imports: renderImports,
    prices: renderPrices,
    orders: renderOrders,
    inventory: renderInventory,
  };
  $("#pageContent").innerHTML = views[currentPage]();
}

// I.2: Danh sách thông tin, reset mật khẩu, khóa/mở khóa khách hàng.
function renderCustomers() {
  const rows = db.customers.filter(
    (c) =>
      match(c.id, c.name, c.email, c.phone) &&
      (!filters.status || (filters.status === "locked") === c.locked),
  );
  return (
    `<div class="stats">${stat("👥", "Tổng khách hàng", db.customers.length)}${stat("✅", "Tài khoản hoạt động", db.customers.filter((c) => !c.locked).length)}${stat("🔒", "Tài khoản bị khóa", db.customers.filter((c) => c.locked).length)}</div>` +
    panel(
      "Danh sách khách hàng",
      filterForm(
        queryFilter() +
          filterSelect(
            "status",
            "Trạng thái",
            options(
              [
                { id: "active", name: "Hoạt động" },
                { id: "locked", name: "Bị khóa" },
              ],
              filters.status,
            ),
          ),
      ) +
        table(
          [
            "Mã KH",
            "Khách hàng",
            "Liên hệ",
            "Trạng thái",
            "Ngày tạo",
            "Thao tác",
          ],
          rows.map(
            (c) =>
              `<tr><td>${escapeHTML(c.id)}</td><td><div class="cell-title">${escapeHTML(c.name)}</div><div class="cell-subtitle">${escapeHTML(c.email)}</div></td><td>${escapeHTML(c.phone)}</td><td>${badge(c.locked ? "Bị khóa" : "Hoạt động", c.locked ? "locked" : "active")}</td><td>${dateText(c.createdAt)}</td><td><div class="actions">${action("Chi tiết", "view-customer", c.id)}${action(c.locked ? "Mở khóa" : "Khóa", "toggle-customer", c.id, c.locked ? "success" : "danger")}${action("Đặt lại mật khẩu", "reset-password", c.id)}</div></td></tr>`,
          ),
        ),
    )
  );
}
function renderCategories() {
  const rows = db.categories.filter(
    (c) =>
      match(c.id, c.name) &&
      (!filters.status || (filters.status === "hidden") === c.hidden),
  );
  return (
    `<div class="stats">${stat("🗂️", "Tổng loại sản phẩm", db.categories.length)}${stat("✅", "Loại đang hiển thị", db.categories.filter((c) => !c.hidden).length)}${stat("🙈", "Loại đã ẩn", db.categories.filter((c) => c.hidden).length)}</div>` +
    panel(
      "Danh sách loại sản phẩm",
      filterForm(
        queryFilter() +
          filterSelect(
            "status",
            "Hiển thị",
            options(
              [
                { id: "visible", name: "Đang hiển thị" },
                { id: "hidden", name: "Đã ẩn" },
              ],
              filters.status,
            ),
          ),
      ) +
        table(
          [
            "Mã loại",
            "Tên loại",
            "Số sản phẩm",
            "Lợi nhuận",
            "Trạng thái",
            "Thao tác",
          ],
          rows.map(
            (c) =>
              `<tr><td>${escapeHTML(c.id)}</td><td><strong>${escapeHTML(c.name)}</strong><div class="cell-subtitle">${escapeHTML(c.description)}</div></td><td>${db.products.filter((p) => p.categoryId === c.id).length}</td><td>${c.profitRate}%</td><td>${badge(c.hidden ? "Đã ẩn" : "Đang hiển thị", c.hidden ? "neutral" : "active")}</td><td><div class="actions">${action("Sửa", "edit-category", c.id)}${action(c.hidden ? "Hiện" : "Ẩn", "toggle-category", c.id, c.hidden ? "success" : "light")}${action("Xóa", "delete-category", c.id, "danger")}</div></td></tr>`,
          ),
        ),
    )
  );
}
function renderProducts() {
  const effectiveHidden = (p) => p.hidden || category(p.categoryId)?.hidden;
  const rows = db.products.filter(
    (p) =>
      matchesProduct(p) &&
      (!filters.status ||
        (filters.status === "hidden") === Boolean(effectiveHidden(p))),
  );
  return (
    `<div class="stats">${stat("📦", "Sản phẩm đang hiển thị", db.products.filter((p) => !effectiveHidden(p)).length)}${stat(
      "🛒",
      "Tổng số lượng tồn kho",
      db.products.reduce((n, p) => n + S.stock(db, p.masp), 0),
      "Bao gồm cả sản phẩm đã ẩn",
    )}${stat("🙈", "Sản phẩm không hiển thị", db.products.filter(effectiveHidden).length)}</div>` +
    panel(
      "Danh sách sản phẩm",
      filterForm(
        queryFilter() +
          categoryFilter() +
          filterSelect(
            "status",
            "Hiển thị",
            options(
              [
                { id: "visible", name: "Đang hiển thị" },
                { id: "hidden", name: "Đã ẩn" },
              ],
              filters.status,
            ),
          ),
      ) +
        table(
          ["Sản phẩm", "Loại", "Giá bán", "Tồn kho", "Trạng thái", "Thao tác"],
          rows.map(
            (p) =>
              `<tr><td>${productCell(p)}</td><td>${escapeHTML(category(p.categoryId)?.name)}</td><td class="product-price">${S.cost(db, p.masp) ? money(S.sellingPrice(db, p)) : "Chưa có giá vốn"}</td><td>${S.stock(db, p.masp)}</td><td>${badge(p.hidden ? "Đã ẩn" : category(p.categoryId)?.hidden ? "Loại đã ẩn" : "Đang hiển thị", effectiveHidden(p) ? "neutral" : "active")}</td><td><div class="actions">${action("Xem", "view-product", p.masp)}${action("Sửa", "edit-product", p.masp)}${action(p.hidden ? "Hiện" : "Ẩn", "toggle-product", p.masp, p.hidden ? "success" : "light")}${action("Xóa", "delete-product", p.masp, "danger")}</div></td></tr>`,
          ),
        ),
    )
  );
}
function renderImports() {
  const rows = db.imports
    .filter(
      (r) =>
        match(
          r.id,
          r.note,
          ...r.items.map((i) => product(i.productId)?.name || ""),
        ) &&
        (!filters.status || r.status === filters.status) &&
        (!filters.from || r.at.slice(0, 10) >= filters.from) &&
        (!filters.to || r.at.slice(0, 10) <= filters.to),
    )
    .slice()
    .sort((a, b) => b.at.localeCompare(a.at));
  return (
    `<div class="stats">${stat("📥", "Tổng phiếu nhập", db.imports.length)}${stat("📝", "Chưa hoàn thành", db.imports.filter((r) => r.status === "draft").length)}${stat("✅", "Giá trị nhập hoàn thành", money(db.imports.filter((r) => r.status === "completed").reduce((n, r) => n + S.total(r), 0)))}</div><p class="notice">Phiếu chưa hoàn thành có thể chỉnh sửa. Hoàn thành phiếu sẽ ghi nhận nhập kho một lần và khóa phiếu.</p>` +
    panel(
      "Danh mục phiếu nhập",
      filterForm(
        queryFilter() +
          filterInput("from", "Từ ngày", "date") +
          filterInput("to", "Đến ngày", "date") +
          filterSelect(
            "status",
            "Trạng thái",
            options(
              [
                { id: "draft", name: "Chưa hoàn thành" },
                { id: "completed", name: "Hoàn thành" },
              ],
              filters.status,
            ),
          ),
      ) +
        dateRangeError(filters.from, filters.to) +
        table(
          [
            "Mã phiếu",
            "Ngày nhập",
            "Số lượng",
            "Tổng tiền",
            "Trạng thái",
            "Thao tác",
          ],
          rows.map(
            (r) =>
              `<tr><td><strong>${escapeHTML(r.id)}</strong><div class="cell-subtitle">${escapeHTML(r.note.slice(0, 45))}</div></td><td>${dateText(r.at)}</td><td>${r.items.reduce((n, i) => n + i.quantity, 0)}</td><td class="product-price">${money(S.total(r))}</td><td>${stateBadge(r.status)}</td><td><div class="actions">${action("Chi tiết", "view-receipt", r.id)}${r.status === "draft" ? action("Sửa", "edit-receipt", r.id) + action("Hoàn thành", "complete-receipt", r.id, "primary") : ""}</div></td></tr>`,
          ),
        ),
    )
  );
}
function renderPrices() {
  const rows = db.products.filter(matchesProduct),
    types = db.categories.filter(
      (c) => !filters.categoryId || c.id === filters.categoryId,
    );
  return (
    `<p class="notice">Giá bán = giá vốn bình quân × (1 + lợi nhuận / 100). Lợi nhuận riêng của sản phẩm được ưu tiên; để trống để dùng mức của loại sản phẩm.</p>` +
    panel(
      "Tra cứu giá bán",
      filterForm(queryFilter() + categoryFilter()) +
        table(
          ["Sản phẩm", "Loại", "Giá vốn", "Lợi nhuận", "Giá bán", "Thao tác"],
          rows.map(
            (p) =>
              `<tr><td>${productCell(p)}</td><td>${escapeHTML(category(p.categoryId)?.name)}</td><td>${money(S.cost(db, p.masp))}</td><td><strong>${S.margin(db, p)}%</strong><div class="cell-subtitle">${p.profitRate === null ? "Theo loại sản phẩm" : "Thiết lập riêng"}</div></td><td class="product-price">${S.cost(db, p.masp) ? money(S.sellingPrice(db, p)) : "Chưa nhập hàng"}</td><td>${action("Sửa lợi nhuận", "edit-product-margin", p.masp)}</td></tr>`,
          ),
        ),
    ) +
    panel(
      "Lợi nhuận theo loại sản phẩm",
      table(
        ["Loại sản phẩm", "Lợi nhuận mặc định", "Áp dụng", "Thao tác"],
        types.map(
          (c) =>
            `<tr><td><strong>${escapeHTML(c.name)}</strong></td><td>${c.profitRate}%</td><td>${db.products.filter((p) => p.categoryId === c.id && p.profitRate === null).length} sản phẩm dùng mức theo loại</td><td>${action("Sửa lợi nhuận", "edit-category-margin", c.id)}</td></tr>`,
        ),
        false,
      ),
    )
  );
}
function renderOrders() {
  const rows = db.orders
    .filter(
      (o) =>
        match(o.id, customer(o.customerId)?.name, o.recipient, o.phone) &&
        (!filters.status || o.status === filters.status) &&
        (!filters.from || o.createdAt.slice(0, 10) >= filters.from) &&
        (!filters.to || o.createdAt.slice(0, 10) <= filters.to),
    )
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    `<div class="stats">${stat("🧾", "Tổng đơn hàng", db.orders.length)}${stat("⏳", "Chờ xử lý / giao hàng", db.orders.filter((o) => ["new", "processed"].includes(o.status)).length)}${stat("✅", "Giá trị đơn đã giao", money(db.orders.filter((o) => o.status === "delivered").reduce((n, o) => n + S.total(o), 0)))}</div>` +
    panel(
      "Danh sách đơn đặt hàng",
      filterForm(
        queryFilter() +
          filterInput("from", "Ngày đặt từ", "date") +
          filterInput("to", "Đến ngày", "date") +
          filterSelect(
            "status",
            "Tình trạng",
            options(
              Object.keys(S.transitions).map((k) => ({
                id: k,
                name: statusInfo[k][0],
              })),
              filters.status,
            ),
          ),
      ) +
        dateRangeError(filters.from, filters.to) +
        table(
          [
            "Mã đơn",
            "Khách hàng",
            "Ngày đặt",
            "Tổng tiền",
            "Tình trạng",
            "Thao tác",
          ],
          rows.map(
            (o) =>
              `<tr><td><strong>${escapeHTML(o.id)}</strong></td><td>${escapeHTML(customer(o.customerId)?.name || o.recipient)}</td><td>${dateText(o.createdAt)}</td><td class="product-price">${money(S.total(o))}</td><td>${stateBadge(o.status)}</td><td>${action("Chi tiết / cập nhật", "view-order", o.id)}</td></tr>`,
          ),
        ),
    )
  );
}
function renderInventory() {
  const selected = db.products.filter(matchesProduct),
    at = filters.at || S.now();
  const rows = selected.filter(
    (p) => !filters.low || S.stock(db, p.masp, at) <= p.threshold,
  );
  const low = selected.filter((p) => S.stock(db, p.masp, at) <= p.threshold);
  let reportHTML = "";
  try {
    const from = filters.reportFrom || S.ago(29, "00:00"),
      to = filters.reportTo || S.now();
    let data = selected.map((p) => ({
      id: p.masp,
      name: p.name,
      categoryId: p.categoryId,
      ...S.report(db, p.masp, from, to),
    }));
    if (filters.group === "category") {
      const groups = new Map();
      data.forEach((x) => {
        if (!groups.has(x.categoryId))
          groups.set(x.categoryId, {
            name: category(x.categoryId)?.name || "Không xác định",
            id: x.categoryId,
            opening: 0,
            incoming: 0,
            outgoing: 0,
            closing: 0,
          });
        const g = groups.get(x.categoryId);
        ["opening", "incoming", "outgoing", "closing"].forEach(
          (k) => (g[k] += x[k]),
        );
      });
      data = [...groups.values()];
    }
    const sums = data.reduce(
      (a, x) => {
        ["opening", "incoming", "outgoing", "closing"].forEach(
          (k) => (a[k] += x[k]),
        );
        return a;
      },
      { opening: 0, incoming: 0, outgoing: 0, closing: 0 },
    );
    reportHTML = table(
      [
        filters.group === "category" ? "Loại sản phẩm" : "Sản phẩm",
        "Tồn đầu",
        "Nhập trong kỳ",
        "Xuất trong kỳ",
        "Tồn cuối",
      ],
      data.map(
        (x) =>
          `<tr><td><strong>${escapeHTML(x.name)}</strong><div class="cell-subtitle">${escapeHTML(x.id)}</div></td><td>${x.opening}</td><td>${x.incoming}</td><td>${x.outgoing}</td><td><strong>${x.closing}</strong></td></tr>`,
      ),
      false,
      `<tr class="report-totals"><td>Tổng cộng</td><td>${sums.opening}</td><td>${sums.incoming}</td><td>${sums.outgoing}</td><td>${sums.closing}</td></tr>`,
    );
  } catch (error) {
    reportHTML = `<p class="message panel-body" role="alert">${escapeHTML(error.message)}</p>`;
  }
  return (
    `<div class="stats">${stat(
      "📦",
      "Tồn tại thời điểm tra cứu",
      selected.reduce((n, p) => n + S.stock(db, p.masp, at), 0),
      dateText(at),
    )}${stat("⚠️", "Sản phẩm sắp hết / hết hàng", low.length, "Tồn nhỏ hơn hoặc bằng ngưỡng cảnh báo")}${stat("🔎", "Sản phẩm đang tra cứu", selected.length)}</div>` +
    panel(
      "Tra cứu tồn tại một thời điểm",
      filterForm(
        queryFilter() +
          categoryFilter() +
          filterSelect(
            "productId",
            "Sản phẩm cụ thể",
            options(db.products, filters.productId, "masp"),
          ) +
          filterInput("at", "Thời điểm tồn kho", "datetime-local") +
          `<label class="check"><input type="checkbox" name="low" ${filters.low ? "checked" : ""}> Chỉ cảnh báo hết / sắp hết hàng</label>`,
      ) +
        table(
          [
            "Sản phẩm",
            "Loại",
            "Số tồn",
            "Ngưỡng cảnh báo",
            "Tình trạng",
            "Thao tác",
          ],
          rows.map((p) => {
            const qty = S.stock(db, p.masp, at);
            return `<tr><td>${productCell(p)}</td><td>${escapeHTML(category(p.categoryId)?.name)}</td><td><strong>${qty}</strong></td><td>${p.threshold}</td><td>${badge(qty === 0 ? "Hết hàng" : qty <= p.threshold ? "Sắp hết hàng" : "Đủ hàng", qty === 0 ? "locked" : qty <= p.threshold ? "pending" : "active")}</td><td>${action("Lịch sử kho", "stock-history", p.masp)}</td></tr>`;
          }),
        ),
    ) +
    panel(
      "Báo cáo nhập – xuất – tồn",
      filterForm(
        filterInput("reportFrom", "Từ thời điểm", "datetime-local") +
          filterInput("reportTo", "Đến thời điểm", "datetime-local") +
          select(
            "group",
            "Hiển thị theo",
            options(
              [
                { id: "product", name: "Từng sản phẩm" },
                { id: "category", name: "Tổng hợp theo loại" },
              ],
              filters.group,
            ),
          ),
        "report",
      ) + reportHTML,
      "",
      "Áp dụng bộ lọc tên, loại và sản phẩm ở trên. Tồn đầu + nhập − xuất = tồn cuối.",
    )
  );
}

// Hộp thoại dùng chung: form và lỗi được xử lý tại cùng một vị trí.
function openModal(title, body, submit) {
  returnFocus = document.activeElement;
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = body;
  $("#modal").showModal();
  if (submit) {
    $("#editForm").addEventListener("input", () => {
      $("#formMessage").textContent = "";
    });
    $("#editForm").addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        submit(new FormData(event.currentTarget));
      } catch (error) {
        $("#formMessage").textContent = error.message;
      }
    });
  }
}
function closeModal() {
  if ($("#modal").open) $("#modal").close();
}
function form(content, label = "Lưu thay đổi") {
  return `<form id="editForm">${content}<p id="formMessage" class="message" role="alert"></p><div class="modal-footer">${action("Hủy", "close")}<button type="submit" class="btn btn-primary" id="saveButton">${label}</button></div></form>`;
}
function confirmModal(title, message, operation, success) {
  openModal(
    title,
    form(`<p style="margin-top:20px">${message}</p>`, "Xác nhận"),
    () => persist(operation, success),
  );
}
function details(rows) {
  return `<dl class="detail-grid">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
}
function editCategory(id) {
  const c = category(id) || { id: "", name: "", description: "", profitRate: 20 };
  openModal(
    id ? "Sửa loại sản phẩm" : "Thêm loại sản phẩm",
    form(
      `<div class="form-grid">${field("id", "Mã loại *", c.id, "text", `required maxlength="30" pattern="[a-zA-Z0-9_-]+" title="Chỉ dùng chữ không dấu, số, gạch ngang hoặc gạch dưới." ${id ? "readonly" : ""}`)}${field("name", "Tên loại sản phẩm *", c.name, "text", 'required maxlength="80"')}${field("profitRate", "Lợi nhuận mặc định (%) *", c.profitRate, "number", 'required min="0" max="1000" step="0.1"')}${textarea("description", "Mô tả loại sản phẩm", c.description)}</div>`,
    ),
    (data) =>
      persist(
        (next) => S.saveCategory(next, Object.fromEntries(data), id),
        "Đã lưu loại sản phẩm.",
      ),
  );
}
function viewCustomer(id) {
  const c = customer(id);
  openModal(
    "Thông tin khách hàng",
    details([
      ["Mã khách hàng", escapeHTML(c.id)],
      ["Họ và tên", escapeHTML(c.name)],
      ["Email", escapeHTML(c.email)],
      ["Điện thoại", escapeHTML(c.phone)],
      ["Địa chỉ", escapeHTML(c.address)],
      ["Ngày tạo", dateText(c.createdAt)],
      [
        "Trạng thái",
        badge(
          c.locked ? "Bị khóa" : "Hoạt động",
          c.locked ? "locked" : "active",
        ),
      ],
      ["Đặt lại mật khẩu gần nhất", dateText(c.passwordUpdatedAt)],
    ]),
  );
}
function resetPassword(id) {
  openModal(
    "Đặt lại mật khẩu",
    form(
      `<p class="notice" style="margin-top:20px">Tài khoản: <strong>${escapeHTML(customer(id).email)}</strong></p>${field("password", "Mật khẩu mới *", "", "password", 'required minlength="8" maxlength="64" autocomplete="new-password"')}${field("confirm", "Nhập lại mật khẩu mới *", "", "password", 'required minlength="8" maxlength="64" autocomplete="new-password"')}<p class="help">Sử dụng 8–64 ký tự. Đây là tài khoản thực hành; không nhập mật khẩu thật.</p>`,
      "Đặt lại mật khẩu",
    ),
    (data) => {
      if (data.get("password") !== data.get("confirm"))
        throw new Error("Hai mật khẩu không khớp nhau.");
      persist(
        (next) => S.resetPassword(next, id, data.get("password")),
        "Đã đặt lại mật khẩu khách hàng.",
      );
    },
  );
}
const specs = [
  ["screen", "Màn hình"],
  ["os", "Hệ điều hành"],
  ["camara", "Camera sau"],
  ["camaraFront", "Camera trước"],
  ["cpu", "Bộ xử lý"],
  ["ram", "RAM"],
  ["rom", "Bộ nhớ"],
  ["microUSB", "Thẻ nhớ / kết nối"],
  ["battery", "Pin"],
];
function editProduct(id) {
  const p = product(id) || {
    masp: "",
    name: "",
    company: "",
    categoryId: db.categories.find((c) => !c.hidden)?.id || "",
    img: "",
    description: "",
    threshold: 5,
    detail: {},
  };
  const types = db.categories.filter((c) => !c.hidden || c.id === p.categoryId);
  if (!types.length) {
    notify("Hãy tạo hoặc mở hiển thị một loại sản phẩm trước.", true);
    return;
  }
  openModal(
    id ? "Sửa sản phẩm" : "Thêm sản phẩm",
    form(
      `<div class="form-grid">${field("masp", "Mã sản phẩm *", p.masp, "text", 'required maxlength="30" ' + (id ? "readonly" : ""))}${select("categoryId", "Loại sản phẩm *", options(types, p.categoryId))}${field("name", "Tên sản phẩm *", p.name, "text", 'required maxlength="200"')}${field("company", "Hãng sản xuất *", p.company, "text", 'required maxlength="100"')}<div class="field full-width"><label for="f-imageChoice">Hình sản phẩm *</label><select id="f-imageChoice"><option value="">Chọn ảnh có sẵn</option>${S.assets.map((file) => `<option value="../images/${file}" ${p.img === "../images/" + file ? "selected" : ""}>${escapeHTML(file)}</option>`).join("")}</select><div class="image-editor">${image({ img: p.img || "../images/" + S.assets[0], name: "Ảnh xem trước" }, "image-preview")}<div><label for="imageUpload">Hoặc tải ảnh từ máy</label><input id="imageUpload" type="file" accept="image/jpeg,image/png,image/webp,image/gif"><small>Ảnh tối đa 500 KB; được lưu cùng dữ liệu để mở offline.</small></div></div><input id="productImageValue" name="img" type="hidden" value="${escapeHTML(p.img)}"></div>${textarea("description", "Mô tả sản phẩm *", p.description, true)}${field("threshold", "Ngưỡng cảnh báo tồn kho *", p.threshold, "number", 'required min="0" max="1000000" step="1"')}<div class="full-width"><h3 class="form-section">Thông số kỹ thuật</h3></div>${specs.map(([key, label]) => field(key, label, p.detail[key] || "", "text", 'maxlength="300"')).join("")}</div><p class="notice" style="margin-top:20px">Số tồn và giá vốn được cập nhật từ phiếu nhập. Đặt lợi nhuận tại mục Quản lý giá bán.</p>`,
    ),
    (data) => {
      const input = Object.fromEntries(data);
      input.detail = Object.fromEntries(
        specs.map(([key]) => [key, data.get(key).trim()]),
      );
      persist(
        (next) => S.saveProduct(next, input, id),
        id
          ? "Đã cập nhật sản phẩm."
          : "Đã thêm sản phẩm. Tạo phiếu nhập để ghi nhận hàng vào kho.",
      );
    },
  );
  const setImage = (value) => {
    $("#productImageValue").value = value;
    $(".image-preview").src = value;
  };
  $("#f-imageChoice").addEventListener("change", (event) => {
    if (event.target.value) setImage(event.target.value);
  });
  $("#imageUpload").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (
      file.size > 500 * 1024 ||
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      notify("Vui lòng chọn ảnh PNG/JPG/WebP/GIF tối đa 500 KB.", true);
      event.target.value = "";
      return;
    }
    $("#saveButton").disabled = true;
    const reader = new FileReader();
    reader.onload = () => {
      if (!$("#productImageValue")) return;
      setImage(reader.result);
      $("#f-imageChoice").value = "";
      $("#saveButton").disabled = false;
    };
    reader.onerror = () => {
      notify("Không đọc được ảnh. Hãy chọn lại.", true);
      if ($("#saveButton")) $("#saveButton").disabled = false;
    };
    reader.readAsDataURL(file);
  });
}
function viewProduct(id) {
  const p = product(id);
  openModal(
    "Chi tiết sản phẩm",
    `<div class="detail-product">${image(p)}<div><h3>${escapeHTML(p.name)}</h3><span class="muted">${escapeHTML(p.masp)} · ${escapeHTML(p.company)}</span></div></div>${details(
      [
        ["Loại sản phẩm", escapeHTML(category(p.categoryId)?.name)],
        ["Giá bán", money(S.sellingPrice(db, p))],
        ["Tồn hiện tại", S.stock(db, id)],
        ["Ngưỡng cảnh báo", p.threshold],
      ],
    )}<h3>Mô tả</h3><p class="detail-description">${escapeHTML(p.description)}</p><h3>Thông số kỹ thuật</h3>${details(specs.map(([key, label]) => [label, escapeHTML(p.detail[key] || "Chưa cập nhật")]))}`,
  );
}
function receiptLine(item = {}) {
  return `<div class="receipt-line"><div><label>Sản phẩm *</label><select name="lineProduct" aria-label="Sản phẩm nhập"><option value="">Chọn sản phẩm</option>${options(db.products, item.productId, "masp")}</select></div><div><label>Số lượng *</label><input name="lineQuantity" aria-label="Số lượng nhập" type="number" min="1" max="1000000" step="1" value="${item.quantity ?? 1}" required></div><div><label>Giá nhập (₫) *</label><input name="lineCost" aria-label="Giá nhập" type="number" min="1" max="1000000000000" step="1" value="${item.cost ?? ""}" required></div>${action("×", "remove-line", "", "danger")}</div>`;
}
function updateReceiptTotal() {
  let total = 0;
  document.querySelectorAll(".receipt-line").forEach((row) => {
    total +=
      (Number(row.querySelector("[name=lineQuantity]").value) || 0) *
      (Number(row.querySelector("[name=lineCost]").value) || 0);
  });
  if ($("#receiptTotal")) $("#receiptTotal").textContent = money(total);
}
function editReceipt(id) {
  if (!db.products.length) {
    notify("Hãy thêm sản phẩm trước.", true);
    return;
  }
  const r = db.imports.find((r) => r.id === id) || {
    at: S.now(),
    note: "",
    items: [{}],
  };
  if (r.status === "completed") {
    viewReceipt(id);
    return;
  }
  openModal(
    id ? "Sửa phiếu " + id : "Tạo phiếu nhập hàng",
    form(
      `<div class="form-grid">${field("at", "Ngày, giờ nhập *", r.at, "datetime-local", `required max="${S.now()}"`)}${field("note", "Ghi chú", r.note, "text", 'maxlength="250"')}</div><h3 class="form-section">Danh sách sản phẩm nhập</h3><p class="help">Mỗi sản phẩm một dòng, có giá nhập và số lượng riêng.</p><div id="receiptLines" style="margin-top:16px">${r.items.map(receiptLine).join("")}</div>${action("+ Thêm dòng sản phẩm", "add-line")}<p class="line-total">Tổng tiền nhập: <span id="receiptTotal"></span></p><p class="notice">Lưu phiếu chưa làm thay đổi tồn kho. Chọn Hoàn thành ở danh sách khi đã kiểm tra hàng nhập.</p>`,
      "Lưu phiếu",
    ),
    (data) => {
      const ids = data.getAll("lineProduct"),
        quantities = data.getAll("lineQuantity"),
        costs = data.getAll("lineCost");
      persist(
        (next) =>
          S.saveReceipt(
            next,
            {
              at: data.get("at"),
              note: data.get("note"),
              items: ids.map((pid, i) => ({
                productId: pid,
                quantity: quantities[i],
                cost: costs[i],
              })),
            },
            id,
          ),
        "Đã lưu phiếu nhập chưa hoàn thành.",
      );
    },
  );
  updateReceiptTotal();
  $("#receiptLines").addEventListener("input", updateReceiptTotal);
  $("#receiptLines").addEventListener("change", (event) => {
    if (event.target.name === "lineProduct") {
      const cost = S.cost(db, event.target.value);
      event.target
        .closest(".receipt-line")
        .querySelector("[name=lineCost]").value = cost || "";
      updateReceiptTotal();
    }
  });
}
function viewReceipt(id) {
  const r = db.imports.find((r) => r.id === id);
  openModal(
    "Chi tiết phiếu " + id,
    details([
      ["Ngày nhập", dateText(r.at)],
      ["Trạng thái", stateBadge(r.status)],
      ["Ghi chú", escapeHTML(r.note || "Không có")],
      ["Thời điểm hoàn thành", dateText(r.completedAt)],
    ]) +
      table(
        ["Sản phẩm", "Số lượng", "Giá nhập", "Thành tiền"],
        r.items.map(
          (i) =>
            `<tr><td>${escapeHTML(product(i.productId)?.name || i.productId)}</td><td>${i.quantity}</td><td>${money(i.cost)}</td><td>${money(i.quantity * i.cost)}</td></tr>`,
        ),
        false,
      ) +
      `<p class="line-total">Tổng tiền nhập: ${money(S.total(r))}</p>${r.status === "completed" ? '<p class="notice">Phiếu đã hoàn thành và được khóa chỉnh sửa.</p>' : ""}`,
  );
}
function editMargin(id, isCategory) {
  const item = isCategory ? category(id) : product(id);
  const title = isCategory ? "Lợi nhuận theo loại" : "Lợi nhuận riêng sản phẩm";
  openModal(
    title,
    form(
      `<p class="notice" style="margin-top:20px"><strong>${escapeHTML(item.name)}</strong>${isCategory ? "" : `<br>Giá vốn: ${money(S.cost(db, id))}<br>Mức theo loại: ${category(item.categoryId).profitRate}%`}</p>${field("profitRate", "Tỉ lệ lợi nhuận (%)", item.profitRate ?? "", "number", `min="0" max="1000" step="0.1" ${isCategory ? "required" : ""}`)}${isCategory ? '<p class="help">Chỉ thay đổi giá của sản phẩm đang dùng lợi nhuận theo loại.</p>' : '<p class="help">Để trống để áp dụng mức của loại. Giá trị 0% nghĩa là bán bằng giá vốn.</p>'}<p class="line-total" id="pricePreview"></p>`,
    ),
    (data) =>
      persist(
        (next) => S.setMargin(next, id, data.get("profitRate"), isCategory),
        "Đã cập nhật lợi nhuận và giá bán.",
      ),
  );
  if (!isCategory) {
    const preview = () => {
      const value = $("#f-profitRate").value;
      $("#pricePreview").textContent =
        "Giá bán dự kiến: " +
        money(
          Math.round(
            S.cost(db, id) *
              (1 +
                (value === ""
                  ? category(item.categoryId).profitRate
                  : Number(value)) /
                  100),
          ),
        );
    };
    $("#f-profitRate").addEventListener("input", preview);
    preview();
  }
}
function viewOrder(id) {
  const o = db.orders.find((o) => o.id === id),
    c = customer(o.customerId),
    next = S.transitions[o.status];
  const summary =
    details([
      ["Khách hàng", escapeHTML(c?.name || o.recipient)],
      ["Ngày đặt", dateText(o.createdAt)],
      ["Người nhận", escapeHTML(o.recipient) + " · " + escapeHTML(o.phone)],
      ["Địa chỉ giao hàng", escapeHTML(o.address)],
      ["Thanh toán", escapeHTML(o.payment)],
      ["Tình trạng", stateBadge(o.status)],
      ["Ghi chú", escapeHTML(o.note || "Không có")],
      ["Thời điểm giao", dateText(o.deliveredAt)],
    ]) +
    table(
      ["Sản phẩm", "Số lượng", "Đơn giá lúc đặt", "Thành tiền"],
      o.items.map(
        (i) =>
          `<tr><td>${escapeHTML(i.name)}</td><td>${i.quantity}</td><td>${money(i.price)}</td><td>${money(i.price * i.quantity)}</td></tr>`,
      ),
      false,
    ) +
    `<p class="line-total">Tổng thanh toán: ${money(S.total(o))}</p>`;
  openModal(
    "Đơn hàng " + id,
    summary +
      (next.length
        ? form(
            select(
              "status",
              "Cập nhật tình trạng",
              options(
                next.map((k) => ({ id: k, name: statusInfo[k][0] })),
                next[0],
              ),
            ) +
              '<p class="help">Đã giao sẽ trừ kho một lần. Có thể hủy đơn trước khi giao; đơn đã giao/hủy được khóa tình trạng.</p>',
            "Cập nhật tình trạng",
          )
        : '<p class="notice">Đơn đã kết thúc xử lý, không thể đổi tình trạng.</p>'),
    next.length
      ? (data) =>
          persist(
            (state) => S.changeOrder(state, id, data.get("status")),
            "Đã cập nhật đơn hàng và tồn kho.",
          )
      : null,
  );
}
function stockHistory(id) {
  const p = product(id);
  const entries = db.ledger
    .filter((e) => e.productId === id)
    .slice()
    .sort((a, b) => a.at.localeCompare(b.at));
  let balance = 0;
  const rows = entries.map((e) => {
    balance += e.quantity;
    return `<tr><td>${dateText(e.at)}</td><td>${escapeHTML(e.reference)}</td><td>${e.kind === "opening" ? "Tồn đầu kỳ" : e.kind === "import" ? "Nhập hàng" : "Giao hàng"}</td><td>${e.quantity > 0 ? "+" + e.quantity : e.quantity}</td><td>${balance}</td></tr>`;
  });
  openModal(
    "Lịch sử kho · " + p.name,
    `<p class="notice" style="margin-top:20px">Số tồn hiện tại: <strong>${S.stock(db, id)}</strong>. Lịch sử được sắp xếp theo ngày, giờ nghiệp vụ.</p>` +
      table(
        ["Thời điểm", "Chứng từ", "Nghiệp vụ", "Thay đổi", "Tồn sau"],
        rows,
        false,
      ),
  );
}

// Sự kiện được gắn một lần để các nút trong bảng mới vẫn hoạt động.
document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-page]");
  if (nav) {
    go(nav.dataset.page);
    return;
  }
  const button = event.target.closest("[data-action]");
  if (!button || button.disabled) return;
  const { action: name, id } = button.dataset;
  const handlers = {
    close: closeModal,
    previous: () => {
      pageNumber--;
      render();
    },
    next: () => {
      pageNumber++;
      render();
    },
    "clear-filters": () => go(currentPage),
    "view-customer": () => viewCustomer(id),
    "reset-password": () => resetPassword(id),
    "toggle-customer": () => {
      const c = customer(id);
      confirmModal(
        c.locked ? "Mở khóa tài khoản" : "Khóa tài khoản",
        `Bạn xác nhận ${c.locked ? "mở khóa" : "khóa"} tài khoản <strong>${escapeHTML(c.email)}</strong>?`,
        (next) => {
          next.customers.find((x) => x.id === id).locked = !c.locked;
        },
        "Đã cập nhật trạng thái tài khoản.",
      );
    },
    "edit-category": () => editCategory(id),
    "delete-category": () =>
      confirmModal(
        "Xóa loại sản phẩm",
        "Chỉ xóa được loại chưa có sản phẩm. Bạn có thể dùng Ẩn để giữ dữ liệu.",
        (next) => S.deleteCategory(next, id),
        "Đã xóa loại sản phẩm.",
      ),
    "toggle-category": () => {
      const c = category(id);
      confirmModal(
        c.hidden ? "Hiển thị loại sản phẩm" : "Ẩn loại sản phẩm",
        `Loại <strong>${escapeHTML(c.name)}</strong> và khả năng hiển thị các sản phẩm thuộc loại này sẽ được cập nhật. Dữ liệu lịch sử được giữ lại.`,
        (next) => {
          next.categories.find((x) => x.id === id).hidden = !c.hidden;
        },
        "Đã cập nhật hiển thị loại sản phẩm.",
      );
    },
    "edit-product": () => editProduct(id),
    "view-product": () => viewProduct(id),
    "toggle-product": () => {
      const p = product(id);
      persist(
        (next) => {
          next.products.find((x) => x.masp === id).hidden = !p.hidden;
        },
        p.hidden ? "Đã bật hiển thị sản phẩm." : "Đã ẩn sản phẩm.",
      );
    },
    "delete-product": () =>
      confirmModal(
        "Xóa sản phẩm",
        "Sản phẩm có chứng từ hoặc lịch sử kho được bảo vệ. Bạn có chắc muốn xóa sản phẩm này?",
        (next) => S.deleteProduct(next, id),
        "Đã xóa sản phẩm.",
      ),
    "edit-receipt": () => editReceipt(id),
    "view-receipt": () => viewReceipt(id),
    "complete-receipt": () => {
      const r = db.imports.find((r) => r.id === id);
      confirmModal(
        "Hoàn thành phiếu nhập",
        `Phiếu <strong>${escapeHTML(id)}</strong> có tổng tiền <strong>${money(S.total(r))}</strong>. Hoàn thành sẽ nhập hàng vào kho và khóa chỉnh sửa phiếu.`,
        (next) => S.completeReceipt(next, id),
        "Đã hoàn thành phiếu và nhập hàng vào kho.",
      );
    },
    "add-line": () => {
      $("#receiptLines").insertAdjacentHTML("beforeend", receiptLine());
      updateReceiptTotal();
    },
    "remove-line": () => {
      if (document.querySelectorAll(".receipt-line").length <= 1) {
        notify("Phiếu nhập cần ít nhất một dòng sản phẩm.", true);
        return;
      }
      button.closest(".receipt-line").remove();
      updateReceiptTotal();
    },
    "edit-product-margin": () => editMargin(id, false),
    "edit-category-margin": () => editMargin(id, true),
    "view-order": () => viewOrder(id),
    "stock-history": () => stockHistory(id),
  };
  if (handlers[name]) handlers[name]();
});
$("#pageContent").addEventListener("submit", (event) => {
  const form = event.target.closest("[data-filter-form]");
  if (!form) return;
  event.preventDefault();
  Object.assign(filters, Object.fromEntries(new FormData(form)));
  if (form.querySelector("[name=low]"))
    filters.low = form.querySelector("[name=low]").checked;
  pageNumber = 1;
  render();
});
$("#closeModal").addEventListener("click", closeModal);
$("#modal").addEventListener("close", () => {
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
});
$("#menu").innerHTML = Object.entries(pageInfo)
  .map(
    ([key, info]) =>
      `<li><button type="button" class="menu-item" data-page="${key}"><span class="menu-icon" aria-hidden="true">${info[0]}</span>${info[1]}</button></li>`,
  )
  .join("");
function showAdmin() {
  try {
    db = S.load(typeof list_products === "undefined" ? [] : list_products);
    sessionStorage.setItem(S.SESSION_KEY, "admin");
    $("#loginScreen").classList.add("hidden");
    $("#adminApp").classList.remove("hidden");
    go("customers");
  } catch (error) {
    $("#loginMessage").textContent = error.message;
  }
}
$("#adminLoginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (
    $("#adminEmail").value.trim().toLowerCase() === S.ADMIN.email &&
    $("#adminPassword").value === S.ADMIN.password
  ) {
    $("#loginMessage").textContent = "";
    showAdmin();
  } else
    $("#loginMessage").textContent = "Email hoặc mật khẩu quản trị không đúng.";
});
$("#logoutButton").addEventListener("click", () => {
  try {
    sessionStorage.removeItem(S.SESSION_KEY);
  } catch {}
  closeModal();
  $("#adminApp").classList.add("hidden");
  $("#loginScreen").classList.remove("hidden");
  $("#adminLoginForm").reset();
  $("#loginMessage").textContent = "";
  $("#adminEmail").focus();
});
document.addEventListener(
  "error",
  (event) => {
    if (event.target.tagName === "IMG" && !event.target.dataset.fallback) {
      event.target.dataset.fallback = "true";
      event.target.src = "../images/" + S.assets[0];
      event.target.alt += " (ảnh thay thế)";
    }
  },
  true,
);
window.addEventListener("storage", (event) => {
  if (event.key === S.KEY && !$("#adminApp").classList.contains("hidden"))
    notify(
      "Dữ liệu đã thay đổi ở tab khác. Tải lại trang để xem bản mới nhất.",
      true,
    );
});
try {
  if (sessionStorage.getItem(S.SESSION_KEY) === "admin") showAdmin();
} catch {
  $("#loginMessage").textContent =
    "Trình duyệt đang chặn bộ nhớ phiên. Hãy cho phép lưu dữ liệu để sử dụng bản thực hành.";
}
