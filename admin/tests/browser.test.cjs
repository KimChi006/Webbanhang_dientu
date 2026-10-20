// Chạy bằng Chrome có sẵn trên máy. Playwright chỉ phục vụ kiểm thử, không cần khi dùng admin.
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require(
    path.join(os.tmpdir(), "electro-admin-qa/node_modules/playwright"),
  ));
}
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 900 },
      offline: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const artifacts = path.join(os.tmpdir(), "techstore-admin-review-20261019");
    fs.mkdirSync(artifacts, { recursive: true });
    const screenshot = async (name) =>
      page.screenshot({
        path: path.join(artifacts, name + ".png"),
        fullPage: true,
        animations: "disabled",
      });
    const action = (name, id) =>
      page
        .locator(
          `[data-action="${name}"]${id === undefined ? "" : `[data-id="${id}"]`}`,
        )
        .first();
    const nav = async (name) => page.locator(`[data-page="${name}"]`).click();
    const submit = async () => page.locator("#saveButton").click();
    const closed = async () =>
      page.locator("#modal").waitFor({ state: "hidden" });
    const apply = async (kind = "main") =>
      page.locator(`[data-filter-form="${kind}"] button[type=submit]`).click();
    const state = async () =>
      page.evaluate(() => JSON.parse(localStorage.getItem(TechStore.KEY)));
    await page.goto(
      pathToFileURL(path.resolve(__dirname, "../index.html")).href,
    );
    await screenshot("01-login");
    await page.locator("#adminEmail").fill("admin@techstore.vn");
    await page.locator("#adminPassword").fill("wrong");
    await page.locator(".login-submit").click();
    assert.match(await page.locator("#loginMessage").innerText(), /không đúng/);
    await page.locator("#adminPassword").fill("Admin123!");
    await page.locator(".login-submit").click();
    await page.locator("#adminApp").waitFor({ state: "visible" });
    assert.equal(await page.locator("[data-page]").count(), 7);
    await screenshot("02-customers");
    // Khách hàng: xem đủ thông tin, khóa/mở khóa và đặt lại mật khẩu.
    await action("view-customer", "KH001").click();
    assert.match(await page.locator("#modalBody").innerText(), /Nguyễn Trãi/);
    await page.keyboard.press("Escape");
    await closed();
    await action("toggle-customer", "KH001").click();
    await submit();
    await closed();
    assert.equal((await state()).customers[0].locked, true);
    await action("toggle-customer", "KH001").click();
    await submit();
    await closed();
    assert.equal((await state()).customers[0].locked, false);
    await action("reset-password", "KH001").click();
    await page.locator("#f-password").fill("NewPass123!");
    await page.locator("#f-confirm").fill("WrongPass123!");
    await submit();
    assert.match(await page.locator("#formMessage").innerText(), /không khớp/);
    await page.locator("#f-confirm").fill("NewPass123!");
    await submit();
    await closed();
    assert.equal((await state()).customers[0].password, "NewPass123!");
    // Loại: CRUD, ẩn/hiện và chặn xóa loại có sản phẩm.
    await nav("categories");
    await action("edit-category", "").click();
    await page.locator("#f-name").fill("Thiết bị thử nghiệm");
    await page.locator("#f-profitRate").fill("20");
    await submit();
    await closed();
    const categoryId = (await state()).categories.at(-1).id;
    await action("edit-category", categoryId).click();
    assert.equal(
      await page.locator("#f-name").inputValue(),
      "Thiết bị thử nghiệm",
    );
    await page.locator("#f-description").fill("Nhóm thiết bị thực hành");
    await submit();
    await closed();
    await action("toggle-category", categoryId).click();
    await submit();
    await closed();
    assert.equal((await state()).categories.at(-1).hidden, true);
    await action("toggle-category", categoryId).click();
    await submit();
    await closed();
    // Sản phẩm: phân trang, thêm đủ trường, sửa prefill, ảnh local.
    await nav("products");
    await screenshot("03-products");
    await action("next").click();
    assert.match(await page.locator(".pagination").innerText(), /2 \/ 3/);
    await action("edit-product", "").click();
    await page.locator("#f-masp").fill("QA-UI");
    await page.locator("#f-categoryId").selectOption(categoryId);
    await page.locator("#f-name").fill("Điện thoại kiểm thử");
    await page.locator("#f-company").fill("TechStore");
    await page.locator("#f-imageChoice").selectOption({ index: 1 });
    await page
      .locator("#f-description")
      .fill("Mô tả sản phẩm được nhập từ form.");
    await page.locator("#f-ram").fill("8 GB");
    await page.locator("#f-rom").fill("128 GB");
    await submit();
    await closed();
    await page.locator("#filter-q").fill("QA-UI");
    await apply();
    assert.equal(await page.locator("#pageContent tbody tr").count(), 1);
    await action("edit-product", "QA-UI").click();
    assert.equal(await page.locator("#f-ram").inputValue(), "8 GB");
    assert.equal(
      await page.locator("#f-description").inputValue(),
      "Mô tả sản phẩm được nhập từ form.",
    );
    await page.locator("#f-name").fill("Điện thoại kiểm thử đã sửa");
    await submit();
    await closed();
    await action("toggle-product", "QA-UI").click();
    assert.equal((await state()).products.at(-1).hidden, true);
    await action("toggle-product", "QA-UI").click();
    await action("view-product", "QA-UI").click();
    assert.match(await page.locator("#modalBody").innerText(), /128 GB/);
    await page.locator("#closeModal").click();
    await nav("categories");
    await action("delete-category", categoryId).click();
    await submit();
    assert.match(
      await page.locator("#formMessage").innerText(),
      /đã có sản phẩm/,
    );
    await action("close").click();
    // Phiếu nhập: nhiều dòng, kiểm tra trùng, sửa nháp, hoàn thành và khóa.
    await nav("imports");
    await action("edit-receipt", "").click();
    await page.locator("[name=lineProduct]").selectOption("QA-UI");
    await page.locator("[name=lineQuantity]").fill("10");
    await page.locator("[name=lineCost]").fill("1000000");
    await action("add-line").click();
    await page.locator("[name=lineProduct]").nth(1).selectOption("QA-UI");
    await page.locator("[name=lineQuantity]").nth(1).fill("2");
    await page.locator("[name=lineCost]").nth(1).fill("2000000");
    await submit();
    assert.match(await page.locator("#formMessage").innerText(), /trùng/);
    const first = (await state()).products[0];
    await page.locator("[name=lineProduct]").nth(1).selectOption(first.masp);
    await page.locator("[name=lineCost]").nth(1).fill("2000000");
    await screenshot("04-import-form");
    await submit();
    await closed();
    let data = await state();
    const receiptId = data.imports[0].id;
    assert.equal(
      data.ledger.some((e) => e.productId === "QA-UI"),
      false,
    );
    await action("edit-receipt", receiptId).click();
    assert.equal(
      await page.locator("[name=lineQuantity]").first().inputValue(),
      "10",
    );
    await page.locator("[name=lineQuantity]").first().fill("11");
    await submit();
    await closed();
    await action("complete-receipt", receiptId).click();
    await submit();
    await closed();
    data = await state();
    assert.equal(
      data.ledger
        .filter((e) => e.productId === "QA-UI")
        .reduce((n, e) => n + e.quantity, 0),
      11,
    );
    assert.equal(
      await page
        .locator(`[data-action="edit-receipt"][data-id="${receiptId}"]`)
        .count(),
      0,
    );
    await action("view-receipt", receiptId).click();
    assert.match(
      await page.locator("#modalBody").innerText(),
      /khóa chỉnh sửa/,
    );
    await page.locator("#closeModal").click();
    // Lợi nhuận riêng, 0%, theo loại và tra cứu kết hợp.
    await nav("prices");
    await page.locator("#filter-q").fill("QA-UI");
    await page.locator("#filter-categoryId").selectOption(categoryId);
    await apply();
    assert.match(
      await page.locator("#pageContent tbody").first().innerText(),
      /1\.200\.000/,
    );
    await action("edit-product-margin", "QA-UI").click();
    await page.locator("#f-profitRate").fill("0");
    await submit();
    await closed();
    assert.equal((await state()).products.at(-1).price, 1000000);
    await action("edit-product-margin", "QA-UI").click();
    await page.locator("#f-profitRate").fill("");
    await submit();
    await closed();
    await action("edit-category-margin", categoryId).click();
    await page.locator("#f-profitRate").fill("25");
    await submit();
    await closed();
    assert.equal((await state()).products.at(-1).price, 1250000);
    await screenshot("05-prices");
    // Tồn đúng thời điểm, lọc theo sản phẩm/loại, tổng hợp theo loại.
    await nav("inventory");
    await page.locator("#filter-productId").selectOption("QA-UI");
    await apply();
    assert.match(
      await page.locator("#pageContent tbody").first().innerText(),
      /11/,
    );
    const before = await page.evaluate(() => TechStore.ago(1, "23:59"));
    await page.locator("#filter-at").fill(before);
    await apply();
    assert.match(
      await page.locator("#pageContent tbody").first().innerText(),
      /Hết hàng/,
    );
    await page
      .locator("#filter-at")
      .fill(await page.evaluate(() => TechStore.now()));
    await apply();
    await page.locator("#f-group").selectOption("category");
    await apply("report");
    assert.match(
      await page.locator("#pageContent tbody").nth(1).innerText(),
      /Thiết bị thử nghiệm/,
    );
    await page.locator("#filter-reportFrom").fill("2099-01-01T00:00");
    await apply("report");
    assert.match(await page.locator("#pageContent").innerText(), /bắt đầu/);
    await action("clear-filters").first().click();
    await screenshot("06-inventory");
    // Đơn hàng: lọc kết hợp khoảng ngày và tình trạng, xem và chuyển trạng thái.
    await nav("orders");
    data = await state();
    const order = data.orders.find((o) => o.status === "new");
    await page.locator("#filter-from").fill(order.createdAt.slice(0, 10));
    await page.locator("#filter-to").fill(order.createdAt.slice(0, 10));
    await page.locator("#filter-status").selectOption("new");
    await apply();
    assert.equal(await page.locator("#pageContent tbody tr").count(), 1);
    await action("view-order", order.id).click();
    await screenshot("07-order-detail");
    await page.locator("#f-status").selectOption("processed");
    await submit();
    await closed();
    await action("clear-filters").click();
    await action("view-order", order.id).click();
    await page.locator("#f-status").selectOption("delivered");
    await submit();
    await closed();
    data = await state();
    assert.equal(
      data.orders.find((o) => o.id === order.id).status,
      "delivered",
    );
    assert.equal(
      data.ledger.filter((e) => e.kind === "sale" && e.reference === order.id)
        .length,
      1,
    );
    const cancelOrder = data.orders.find((o) => o.status === "new");
    await action("view-order", cancelOrder.id).click();
    await page.locator("#f-status").selectOption("cancelled");
    await submit();
    await closed();
    assert.equal(
      (await state()).orders.find((o) => o.id === cancelOrder.id).status,
      "cancelled",
    );
    // Bảo vệ lịch sử; lưu nội dung như văn bản; reload giữ dữ liệu.
    await nav("products");
    await page.locator("#filter-q").fill("QA-UI");
    await apply();
    await action("delete-product", "QA-UI").click();
    await submit();
    assert.match(await page.locator("#formMessage").innerText(), /lịch sử/);
    await action("close").click();
    await action("edit-product", "QA-UI").click();
    await page.locator("#f-name").fill("<img src=x onerror=alert(1)>");
    await submit();
    await closed();
    assert.equal(await page.locator("img[src=x]").count(), 0);
    await page.reload();
    await page.locator("#adminApp").waitFor({ state: "visible" });
    assert.ok((await state()).products.some((p) => p.masp === "QA-UI"));
    // Kiểm tra không tràn ngang các màn hình trên điện thoại.
    await page.setViewportSize({ width: 390, height: 844 });
    for (const name of Object.keys(await page.evaluate(() => pageInfo))) {
      await nav(name);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        "Không tràn ngang: " + name,
      );
    }
    await nav("products");
    await page.locator("#pageTitle").scrollIntoViewIfNeeded();
    await screenshot("08-mobile");
    await page.locator("#logoutButton").click();
    await page.reload();
    assert.equal(await page.locator("#loginScreen").isVisible(), true);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: đăng nhập riêng, khách hàng, loại, sản phẩm, phiếu nhập, giá bán, đơn hàng, kho theo thời điểm, báo cáo theo loại, lưu dữ liệu, desktop/mobile, chạy file:// offline.",
    );
    console.log("Ảnh kiểm tra: " + artifacts);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
