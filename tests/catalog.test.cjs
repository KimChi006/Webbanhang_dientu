const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const base = path.join(__dirname, '..');

const ALL_KEYS = ['q', 'category', 'brand', 'pricePreset', 'min', 'max', 'ram', 'rom', 'os', 'screen', 'cpu', 'camera', 'spec1', 'spec2', 'spec3', 'spec4', 'spec5', 'spec6', 'sort'];

function setup(search = '', customProducts = null) {
  const memory = new Map(), events = {}, nodes = {}, forms = [];
  let locationSearch = search;
  const historyStates = [];
  const element = () => ({
    style: {},
    innerHTML: '',
    textContent: '',
    className: '',
    hidden: false,
    elements: Object.fromEntries(ALL_KEYS.map(k => [k, {
      value: '',
      innerHTML: '',
      addEventListener(evt, f) { this[evt] = f; },
      change() { this.change?.(); },
    }])),
    requestSubmit() { this.submit?.({ preventDefault() {} }); },
    setAttribute(k, v) { this[k] = v; },
    removeAttribute(k) { delete this[k]; },
    before(el) {
      if (this === grid && el.id === 'activeFilters') nodes.activeFilters = el;
      if (this === grid && el.className?.includes('catalog-filters')) nodes.filters = el;
    },
    append(el) {
      if (el.className?.includes('catalog-pages')) nodes.pages = el;
    },
    prepend(el) {
      if (el.className?.includes('catalog-notice')) nodes.notice = el;
    },
    addEventListener(k, f) { this[k] = f; },
    scrollIntoView() {},
  });
  const root = element(), grid = element();
  root.querySelector = s => s === '.product-grid' ? grid : null;
  const document = {
    querySelector: s =>
      s === '.products-section' ? root :
      s === '.hero' ? (nodes.hero ||= element()) :
      s === '.nav-product-menu' ? (nodes.navProductMenu ||= element()) :
      s === '.nav-product-trigger' ? (nodes.navProductTrigger ||= element()) :
      null,
    createElement: tag => {
      const e = element();
      e.tagName = tag.toUpperCase();
      if (tag.toLowerCase() === 'form') forms.push(e);
      return e;
    },
    getElementById: id =>
      id === 'productList' ? grid :
      id === 'productCount' ? (nodes.productCount ||= element()) :
      id === 'filterError' ? (nodes.filterError ||= element()) :
      id === 'activeFilters' ? (nodes.activeFilters ||= element()) :
      (nodes[id] ||= element()),
    addEventListener(evt, f) {
      events['doc_' + evt] = f;
      if (evt === 'click') {
        document.click = target => f({
          target,
          preventDefault() {},
        });
      }
    },
  };
  const location = {
    get search() { return locationSearch; },
    set search(v) { locationSearch = v; },
    pathname: '/index.html',
    protocol: 'http:',
  };
  const history = {
    pushState(state, title, url) {
      historyStates.push({ state, title, url });
      if (typeof url === 'string') {
        const u = url.split('#')[0];
        const qIdx = u.indexOf('?');
        locationSearch = qIdx >= 0 ? u.slice(qIdx) : '';
      }
    }
  };
  const context = vm.createContext({
    console,
    URLSearchParams,
    location,
    history,
    document,
    localStorage: {
      getItem: k => memory.get(k) || null,
      setItem: (k, v) => memory.set(k, v),
    },
    window: {
      addEventListener: (k, f) => { events[k] = f; },
      dispatchEvent() {},
      TechStoreDemo: {
        localMode: true,
        getAccount: () => ({ maKH: 'LOCAL-1', vaiTro: 'CUSTOMER' }),
        transferURL: target => target,
      },
    },
    CustomEvent: function (t, o) { this.detail = o.detail; },
  });

  if (customProducts) {
    context.list_products = customProducts;
  } else {
    vm.runInContext(fs.readFileSync(path.join(base, 'products.js'), 'utf8'), context);
  }
  vm.runInContext(fs.readFileSync(path.join(base, 'admin/js/store.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(base, 'js/catalog.js'), 'utf8'), context);
  events.pageshow();

  return { context, events, grid, nodes, memory, forms, location, history, historyStates, document };
}

// 1. Phân trang mặc định ban đầu
let a = setup();
assert.equal((a.grid.innerHTML.match(/<article/g) || []).length, 10);
assert.match(a.nodes.productCount.textContent, /120 sản phẩm/);

// 2. Lọc loại cập nhật số lượng và loại trừ sản phẩm khác loại
a = setup();
a.forms[0].elements.category.value = 'L01';
a.forms[0].elements.category.change();
assert.match(a.nodes.productCount.textContent, /25 sản phẩm/);
assert.doesNotMatch(a.grid.innerHTML, /iPad/);

// 3. Lọc kết hợp Tên + Loại + Hãng + Khoảng giá (giao AND)
a = setup('?q=Galaxy&category=L01&brand=Samsung&min=3000000&max=5000000');
assert.match(a.grid.innerHTML, /Samsung Galaxy J4\+/);
assert.doesNotMatch(a.grid.innerHTML, /Oppo|Xiaomi|Apple|Nokia|Huawei/);
assert.equal(a.forms[0].elements.brand.value, 'Samsung');

// 4. Chuẩn hóa tên hãng: không tạo lựa chọn trùng (case & whitespace)
const mockDupes = [
  { masp: 'T1', name: 'SP 1', company: 'Samsung', price: 1000000, categoryId: 'L01', img: 'images/samsung-galaxy-j4-plus-pink-400x400.jpg', detail: {} },
  { masp: 'T2', name: 'SP 2', company: 'SamSung', price: 2000000, categoryId: 'L01', img: 'images/samsung-galaxy-j4-plus-pink-400x400.jpg', detail: {} },
  { masp: 'T3', name: 'SP 3', company: ' Samsung ', price: 3000000, categoryId: 'L01', img: 'images/samsung-galaxy-j4-plus-pink-400x400.jpg', detail: {} },
  { masp: 'T4', name: 'SP 4', company: 'Apple', price: 4000000, categoryId: 'L01', img: 'images/samsung-galaxy-j4-plus-pink-400x400.jpg', detail: {} },
];
a = setup('', mockDupes);
const brandOptions = (a.forms[0].elements.brand.innerHTML.match(/<option value="([^"]+)">/g) || []).map(o => o.replace(/.*value="([^"]+)".*/, '$1'));
const samsungOptions = brandOptions.filter(b => b.toLowerCase() === 'samsung');
assert.equal(samsungOptions.length, 1, 'Hãng Samsung chỉ được xuất hiện 1 lần trong dropdown');

// 5. Đổi loại cập nhật danh sách hãng và bỏ hãng không còn hợp lệ
a = setup();
a.forms[0].elements.category.value = 'L01';
a.forms[0].elements.category.change();
assert.match(a.forms[0].elements.brand.innerHTML, /Nokia/);
a.forms[0].elements.brand.value = 'Nokia';
a.forms[0].elements.brand.change();
assert.match(a.context.location.search, /brand=Nokia/);
// Đổi sang L02 (máy tính bảng không có Nokia)
a.forms[0].elements.category.value = 'L02';
a.forms[0].elements.category.change();
assert.doesNotMatch(a.forms[0].elements.brand.innerHTML, /<option value="Nokia">/);
assert.equal(a.forms[0].elements.brand.value, '', 'Hãng Nokia phải bị đưa về rỗng khi chuyển sang loại L02');
assert.doesNotMatch(a.context.location.search, /brand=Nokia/);

// 6. Sắp xếp giá tăng/giảm xuyên suốt nhiều trang với dataset > 8 sản phẩm
const imgSample = 'images/samsung-galaxy-j4-plus-pink-400x400.jpg';
const testProducts12 = [
  { masp: 'P01', name: 'SP 10', company: 'H1', price: 100000, sqlPrice: 100000, categoryId: 'L01', img: imgSample, detail: {} },
  { masp: 'P02', name: 'SP 50', company: 'H1', price: 500000, sqlPrice: 500000, categoryId: 'L01', img: imgSample, detail: {} },
  { masp: 'P03', name: 'SP 20', company: 'H1', price: 200000, sqlPrice: 200000, categoryId: 'L01', img: imgSample, detail: {} },
  { masp: 'P04', name: 'SP 90', company: 'H1', price: 900000, sqlPrice: 900000, categoryId: 'L01', img: imgSample, detail: {} },
  { masp: 'P05', name: 'SP 30', company: 'H1', price: 300000, sqlPrice: 300000, categoryId: 'L01', img: imgSample, detail: {} },
  { masp: 'P06', name: 'SP 80', company: 'H1', price: 800000, sqlPrice: 800000, categoryId: 'L01', img: imgSample, detail: {} },
  { masp: 'P07', name: 'SP 40', company: 'H1', price: 400000, sqlPrice: 400000, categoryId: 'L01', img: imgSample, detail: {} },
  { masp: 'P08', name: 'SP 70', company: 'H1', price: 700000, sqlPrice: 700000, categoryId: 'L01', img: imgSample, detail: {} },
  { masp: 'P09', name: 'SP 60', company: 'H1', price: 600000, sqlPrice: 600000, categoryId: 'L01', img: imgSample, detail: {} },
  { masp: 'P10', name: 'SP 110', company: 'H1', price: 1100000, sqlPrice: 1100000, categoryId: 'L01', img: imgSample, detail: {} },
  { masp: 'P11', name: 'SP 100', company: 'H1', price: 1000000, sqlPrice: 1000000, categoryId: 'L01', img: imgSample, detail: {} },
  { masp: 'P12', name: 'SP 120', company: 'H1', price: 1200000, sqlPrice: 1200000, categoryId: 'L01', img: imgSample, detail: {} },
];
// Sắp xếp tăng dần (price-asc)
a = setup('?sort=price-asc&page=1', testProducts12);
assert.match(a.grid.innerHTML, /\bSP 10\b/);
assert.match(a.grid.innerHTML, /\bSP 100\b/);
assert.doesNotMatch(a.grid.innerHTML, /\bSP 110\b|\bSP 120\b/);
a = setup('?sort=price-asc&page=2', testProducts12);
assert.match(a.grid.innerHTML, /\bSP 110\b/);
assert.match(a.grid.innerHTML, /\bSP 120\b/);
assert.doesNotMatch(a.grid.innerHTML, /\bSP 10\b|\bSP 20\b|\bSP 100\b/);

// Sắp xếp giảm dần (price-desc)
a = setup('?sort=price-desc&page=1', testProducts12);
assert.match(a.grid.innerHTML, /\bSP 120\b/);
assert.match(a.grid.innerHTML, /\bSP 30\b/);
assert.doesNotMatch(a.grid.innerHTML, /\bSP 10\b|\bSP 20\b/);
a = setup('?sort=price-desc&page=2', testProducts12);
assert.match(a.grid.innerHTML, /\bSP 20\b/);
assert.match(a.grid.innerHTML, /\bSP 10\b/);
assert.doesNotMatch(a.grid.innerHTML, /\bSP 120\b|\bSP 30\b/);

// 7. Đang ở trang 2 hoặc 3, áp dụng lọc hoặc sắp xếp mới phải quay về trang 1
a = setup('?page=2');
assert.match(a.nodes.productCount.textContent, /Trang 2\/12/);
a.forms[0].elements.sort.value = 'price-asc';
a.forms[0].elements.sort.change();
assert.match(a.nodes.productCount.textContent, /Trang 1\/12/);
assert.doesNotMatch(a.context.location.search, /page=2/);

// 8. Nhãn "Đang lọc theo", xóa từng nhãn giữ điều kiện khác, xóa tất cả khôi phục mặc định
a = setup('?q=Galaxy&category=L01&brand=Samsung&min=1000000&max=10000000&sort=price-asc');
assert.match(a.nodes.activeFilters.innerHTML, /Galaxy/);
assert.match(a.nodes.activeFilters.innerHTML, /Samsung/);
assert.match(a.nodes.activeFilters.innerHTML, /1\.000\.000/);
// Bỏ nhãn khoảng giá
a.document.click({ closest: sel => sel === '[data-remove-filter]' ? { dataset: { removeFilter: 'price' } } : null });
assert.doesNotMatch(a.context.location.search, /min=/);
assert.doesNotMatch(a.context.location.search, /max=/);
assert.match(a.context.location.search, /brand=Samsung/);
assert.match(a.context.location.search, /sort=price-asc/);
// Bấm xóa tất cả
a.document.click({ closest: sel => sel === '[data-action="reset-filters"]' ? {} : null });
assert.doesNotMatch(a.context.location.search, /q=|category=|brand=|min=|max=|sort=/);
assert.match(a.nodes.productCount.textContent, /120 sản phẩm · Trang 1\/12/);

// 9. Khoảng giá hợp lệ: rỗng, bằng 0, bằng nhau; không hợp lệ: âm, ngược, dữ liệu sai
a = setup('?min=0');
assert.equal(a.nodes.filterError.textContent, '');
assert.match(a.nodes.productCount.textContent, /120 sản phẩm/);

a = setup('?min=3490000&max=3490000');
assert.equal(a.nodes.filterError.textContent, '');
assert.match(a.grid.innerHTML, /Samsung Galaxy J4\+/);

a = setup('?min=-500');
assert.match(a.nodes.filterError.textContent, /không hợp lệ/);
assert.doesNotMatch(a.grid.innerHTML, /<article/);

a = setup('?min=9000000&max=100');
assert.match(a.nodes.filterError.textContent, /không hợp lệ/);
assert.doesNotMatch(a.grid.innerHTML, /<article/);

a = setup('?min=abc');
assert.match(a.nodes.filterError.textContent, /không hợp lệ/);
assert.doesNotMatch(a.grid.innerHTML, /<article/);

a = setup('?min=1.5');
assert.match(a.nodes.filterError.textContent, /không hợp lệ/);
assert.doesNotMatch(a.grid.innerHTML, /<article/);

// 10. Không có kết quả và URL có trang vượt giới hạn
a = setup('?q=khong-có-san-pham');
assert.match(a.grid.innerHTML, /Không tìm thấy/);
assert.match(a.grid.innerHTML, /data-action="reset-filters"/);
assert.equal(a.nodes.pages.innerHTML, '');

a = setup('?page=999');
assert.match(a.nodes.productCount.textContent, /Trang 12\/12/);
assert.equal((a.grid.innerHTML.match(/<article/g) || []).length, 10);

// 11. Sản phẩm hoặc loại bị ẩn không xuất hiện
a = setup();
const S = a.context.window.TechStore;
let db = S.load(a.context.list_products);
db = S.transact(db, d => { d.categories.find(c => c.id === 'L01').hidden = true; });
a.events.pageshow();
assert.match(a.nodes.productCount.textContent, /95 sản phẩm/);

// 12. Chi tiết giữ bộ lọc, đồng thời chuẩn hóa trang vượt quá kết quả về trang hợp lệ
a = setup('?id=Sam0&category=L01&brand=Samsung&sort=price-asc&page=2');
assert.match(a.nodes.productDetailPage.innerHTML, /Samsung Galaxy J4/);
assert.match(a.nodes.productDetailPage.innerHTML, /category=L01/);
assert.match(a.nodes.productDetailPage.innerHTML, /brand=Samsung/);
assert.match(a.nodes.productDetailPage.innerHTML, /sort=price-asc/);
assert.doesNotMatch(a.nodes.productDetailPage.innerHTML, /page=2/);

// 13. Mua hàng và thêm giỏ hàng
(async () => {
  a = setup();
  vm.runInContext(fs.readFileSync(path.join(base, 'js/cart-bridge.js'), 'utf8'), a.context);
  const C = a.context.window.TechStoreCart;
  await C.add({ productId: 'Sam0', quantity: 1 });
  assert.equal(C.read({ maKH: 'LOCAL-1' })[0].quantity, 1);
  await C.add({ productId: 'Sam0', quantity: 1 });
  assert.equal(C.read({ maKH: 'LOCAL-1' })[0].quantity, 2);
  await C.add({ productId: 'HP-SWHXM5', quantity: 1 });
  assert.equal(C.read({ maKH: 'LOCAL-1' }).find(item => item.productId === 'HP-SWHXM5').quantity, 1);
  await assert.rejects(C.add({ productId: 'Sam0', quantity: 999999 }), /tồn kho/);
  a.context.window.TechStoreDemo.getAccount = () => null;
  await assert.rejects(C.add({ productId: 'Sam0', quantity: 1 }), /đăng nhập/);

  // 14. Bộ lọc mở rộng theo phong cách CellphoneS:
  // 14a. Lọc theo RAM và ROM
  let ext = setup('?category=L01&ram=6 GB&rom=64 GB');
  assert.match(ext.grid.innerHTML, /Samsung Galaxy A8\+|Xiaomi Mi 8/);
  assert.doesNotMatch(ext.grid.innerHTML, /Galaxy J4\+|Oppo F9/);
  assert.match(ext.nodes.activeFilters.innerHTML, /RAM: 6 GB/);
  assert.match(ext.nodes.activeFilters.innerHTML, /Bộ nhớ: 64 GB/);

  // 14b. Lọc theo Hệ điều hành (iOS)
  ext = setup('?category=L01&os=iOS');
  assert.match(ext.grid.innerHTML, /iPhone/);
  assert.doesNotMatch(ext.grid.innerHTML, /Samsung|Xiaomi|Oppo/);
  assert.match(ext.nodes.activeFilters.innerHTML, /HĐH: iOS/);

  // 14c. Lọc theo Vi xử lý (Snapdragon) và Camera kép
  ext = setup('?category=L01&cpu=Snapdragon&camera=dual');
  assert.match(ext.grid.innerHTML, /Xiaomi Mi 8|Redmi Note 5/);
  assert.doesNotMatch(ext.grid.innerHTML, /Galaxy J4\+/);

  // 14d. Lọc theo Kích thước màn hình
  ext = setup('?category=L01&screen=duoi-6-inch');
  assert.match(ext.grid.innerHTML, /iPhone X|Nokia 5\.1/);
  assert.doesNotMatch(ext.grid.innerHTML, /Galaxy A8\+/);

  // 14e. Kết hợp đồng thời nhiều thuộc tính: Hãng + RAM + ROM + CPU
  ext = setup('?category=L01&brand=Xiaomi&ram=4 GB&rom=64 GB&cpu=Snapdragon');
  assert.match(ext.grid.innerHTML, /Xiaomi Mi 8 Lite|Xiaomi Redmi Note 5|Xiaomi Redmi 5 Plus 4GB/);
  assert.doesNotMatch(ext.grid.innerHTML, /Samsung|Apple|Huawei/);

  // 14f. Bỏ riêng 1 nhãn RAM trong nhiều nhãn kết hợp
  ext.document.click({ closest: sel => sel === '[data-remove-filter]' ? { dataset: { removeFilter: 'ram' } } : null });
  assert.doesNotMatch(ext.context.location.search, /ram=/);
  assert.match(ext.context.location.search, /brand=Xiaomi/);
  assert.match(ext.context.location.search, /rom=64\+GB|rom=64%20GB/);
  assert.match(ext.context.location.search, /cpu=Snapdragon/);

  // 14g. Chọn mức giá nhanh (pricePreset)
  ext = setup();
  ext.forms[0].elements.pricePreset.value = '2-4-trieu';
  ext.forms[0].elements.pricePreset.change();
  assert.match(ext.context.location.search, /min=2000000/);
  assert.match(ext.context.location.search, /max=4000000/);


  // 15. Kiểm thử các tổ hợp lọc dữ liệu mở rộng thực tế:
  // 15a. Một danh mục có nhiều trang sản phẩm: Điện thoại (25 SP -> 3 trang), Laptop (25 SP -> 3 trang), Máy tính bảng (15 SP -> 2 trang)
  let tCat = setup('?category=L01');
  assert.match(tCat.nodes.productCount.textContent, /25 sản phẩm · Trang 1\/3/);
  tCat = setup('?category=L04');
  assert.match(tCat.nodes.productCount.textContent, /25 sản phẩm · Trang 1\/3/);
  tCat = setup('?category=L02');
  assert.match(tCat.nodes.productCount.textContent, /15 sản phẩm · Trang 1\/2/);

  // 15b. Một tổ hợp lọc còn nhiều hơn một trang (> 10 sản phẩm): Laptop RAM 16 GB (15 sản phẩm -> 2 trang)
  let tMulti = setup('?category=L04&ram=16 GB');
  assert.match(tMulti.nodes.productCount.textContent, /15 sản phẩm · Trang 1\/2/);
  assert.equal((tMulti.grid.innerHTML.match(/<article/g) || []).length, 10);
  tMulti = setup('?category=L04&ram=16 GB&page=2');
  assert.match(tMulti.nodes.productCount.textContent, /15 sản phẩm · Trang 2\/2/);
  assert.equal((tMulti.grid.innerHTML.match(/<article/g) || []).length, 5);
  tMulti = setup('?category=L04&ram=16GB');
  assert.match(tMulti.nodes.productCount.textContent, /15 sản phẩm/, '8GB và 8 GB phải dùng cùng chuẩn lọc');

  // 15c. Một tổ hợp chỉ còn 1–3 sản phẩm: Máy tính bảng Xiaomi (2 sản phẩm) & Điện thoại Vivo (1 sản phẩm)
  let tFew1 = setup('?category=L02&brand=Xiaomi');
  assert.match(tFew1.nodes.productCount.textContent, /2 sản phẩm/);
  assert.match(tFew1.grid.innerHTML, /Xiaomi Pad 6/);
  assert.match(tFew1.grid.innerHTML, /Redmi Pad SE/);

  let tFew2 = setup('?category=L01&brand=Vivo');
  assert.match(tFew2.nodes.productCount.textContent, /1 sản phẩm/);
  assert.match(tFew2.grid.innerHTML, /Vivo V29e/);

  // 15d. Một tổ hợp không có kết quả: Laptop Apple dưới 2 triệu (0 sản phẩm)
  let tZero = setup('?category=L04&brand=Apple&min=0&max=2000000');
  assert.match(tZero.grid.innerHTML, /Không tìm thấy sản phẩm phù hợp/);
  assert.match(tZero.grid.innerHTML, /data-action="reset-filters"/);

  // 15e. Một số sản phẩm bằng giá để kiểm tra sắp xếp ổn định:
  // iPhone 13 và Galaxy S23 cùng giá 14.990.000₫, thứ tự ban đầu: DT-IP13 rồi DT-SS23
  let tEqual = setup('?category=L01&min=14990000&max=14990000');
  assert.match(tEqual.nodes.productCount.textContent, /2 sản phẩm/);
  const posIP_orig = tEqual.grid.innerHTML.indexOf('DT-IP13');
  const posSS_orig = tEqual.grid.innerHTML.indexOf('DT-SS23');
  assert.ok(posIP_orig >= 0 && posSS_orig >= 0 && posIP_orig < posSS_orig, 'Thứ tự ban đầu: iPhone 13 trước Galaxy S23');

  // Sắp xếp tăng dần (price-asc): Giá bằng nhau giữ nguyên thứ tự ổn định
  let tEqualAsc = setup('?category=L01&min=14990000&max=14990000&sort=price-asc');
  const posIP_asc = tEqualAsc.grid.innerHTML.indexOf('DT-IP13');
  const posSS_asc = tEqualAsc.grid.innerHTML.indexOf('DT-SS23');
  assert.ok(posIP_asc >= 0 && posSS_asc >= 0 && posIP_asc < posSS_asc, 'Sắp xếp tăng dần: Giữ thứ tự ổn định (iPhone 13 trước Galaxy S23)');

  // Sắp xếp giảm dần (price-desc): Giá bằng nhau giữ nguyên thứ tự ổn định
  let tEqualDesc = setup('?category=L01&min=14990000&max=14990000&sort=price-desc');
  const posIP_desc = tEqualDesc.grid.innerHTML.indexOf('DT-IP13');
  const posSS_desc = tEqualDesc.grid.innerHTML.indexOf('DT-SS23');
  assert.ok(posIP_desc >= 0 && posSS_desc >= 0 && posIP_desc < posSS_desc, 'Sắp xếp giảm dần: Giữ thứ tự ổn định (iPhone 13 trước Galaxy S23)');

  // 16. Tám kịch bản lọc thực tế cho bốn nhóm sản phẩm Đợt 3.
  let batch3 = setup('?category=L05');
  assert.match(batch3.nodes.productCount.textContent, /15 sản phẩm · Trang 1\/2/);

  batch3 = setup('?category=L05&spec1=Over-ear');
  assert.match(batch3.nodes.productCount.textContent, /3 sản phẩm/);
  assert.match(batch3.grid.innerHTML, /AirPods Max|WH-1000XM5|WH-1000XM4/);

  batch3 = setup('?category=L05&brand=Sony&spec3=ANC chủ động');
  assert.match(batch3.nodes.productCount.textContent, /3 sản phẩm/);
  assert.match(batch3.nodes.activeFilters.innerHTML, /Chống ồn: ANC chủ động/);

  batch3 = setup('?category=L06&spec1=45 mm');
  assert.match(batch3.nodes.productCount.textContent, /1 sản phẩm/);
  assert.match(batch3.grid.innerHTML, /Apple Watch Series 9/);

  batch3 = setup('?category=L06&brand=Garmin&spec4=5ATM');
  assert.match(batch3.nodes.productCount.textContent, /2 sản phẩm/);
  assert.match(batch3.grid.innerHTML, /Forerunner 55|Forerunner 265/);

  batch3 = setup('?category=L07&spec2=50 W');
  assert.match(batch3.nodes.productCount.textContent, /1 sản phẩm/);
  assert.match(batch3.grid.innerHTML, /Onyx Studio 8/);

  batch3 = setup('?category=L03&spec1=Cáp&brand=Anker');
  assert.match(batch3.nodes.productCount.textContent, /2 sản phẩm/);
  assert.match(batch3.grid.innerHTML, /Flow USB-C to Lightning|Zolo USB-C 240W/);

  batch3 = setup('?category=L03&sort=price-desc&page=2');
  assert.match(batch3.nodes.productCount.textContent, /20 sản phẩm · Trang 2\/2/);
  assert.match(batch3.context.location.search, /category=L03/);
  assert.match(batch3.context.location.search, /sort=price-desc/);

  batch3 = setup('?id=HP-SWHXM5&category=L05');
  assert.match(batch3.nodes.productDetailPage.innerHTML, /Chống ồn/);
  assert.match(batch3.nodes.productDetailPage.innerHTML, /ANC chủ động/);
  assert.doesNotMatch(batch3.nodes.productDetailPage.innerHTML, /Camera sau|Camera trước|>RAM</);

  const laptopDetail = setup('?id=LT-HPVICT16&category=L04');
  assert.match(laptopDetail.nodes.productDetailPage.innerHTML, /Intel Core i7 13700H/);
  assert.match(laptopDetail.nodes.productDetailPage.innerHTML, /NVIDIA GeForce RTX 3050 6 GB/);
  assert.match(laptopDetail.nodes.productDetailPage.innerHTML, /Đồ họa/);
  assert.doesNotMatch(laptopDetail.nodes.productDetailPage.innerHTML, /Camera sau|Camera trước/);

  // 17. OR trong cùng nhóm, AND giữa các nhóm và chip riêng cho từng giá trị.
  let dot4 = setup('?category=L01&brand=Apple&brand=Samsung');
  assert.match(dot4.nodes.productCount.textContent, /7 sản phẩm/);
  assert.match(dot4.nodes.activeFilters.innerHTML, /Hãng: Apple/);
  assert.match(dot4.nodes.activeFilters.innerHTML, /Hãng: Samsung/);
  dot4 = setup('?category=L01&brand=Apple&brand=Samsung&ram=3 GB');
  assert.match(dot4.nodes.productCount.textContent, /3 sản phẩm/);

  // 18. Các bộ lọc riêng theo tablet/laptop/tai nghe/đồng hồ/loa.
  dot4 = setup('?category=L02&screen=tu-11-inch');
  assert.match(dot4.nodes.productCount.textContent, /8 sản phẩm/);
  dot4 = setup('?category=L02&os=iPadOS');
  assert.match(dot4.nodes.productCount.textContent, /5 sản phẩm/);
  dot4 = setup('?category=L04&spec1=NVIDIA RTX 4050');
  assert.match(dot4.nodes.productCount.textContent, /2 sản phẩm/);
  dot4 = setup('?category=L05&spec1=Over-ear&spec3=ANC chủ động');
  assert.match(dot4.nodes.productCount.textContent, /3 sản phẩm/);
  dot4 = setup('?category=L06&spec2=AMOLED&spec4=5ATM');
  assert.match(dot4.nodes.productCount.textContent, /4 sản phẩm/);
  dot4 = setup('?category=L07&spec1=Bluetooth&spec2=20 W');
  assert.match(dot4.nodes.productCount.textContent, /1 sản phẩm/);
  assert.match(dot4.grid.innerHTML, /Emberton II/);

  // 19. Mỗi nhóm phụ kiện chỉ dùng schema phù hợp với loại đang chọn.
  const accessoryCases = [
    ['?category=L03&spec1=Chuột&spec2=Bluetooth', /3 sản phẩm/, /MX Master 3S|Signature M650|Magic Mouse/],
    ['?category=L03&spec1=Bàn phím&spec3=80% TKL, ANSI', /1 sản phẩm/, /Keychron K8/],
    ['?category=L03&spec1=Củ sạc&spec2=30 W', /1 sản phẩm/, /Anker 511 Nano 3/],
    ['?category=L03&spec1=Cáp&spec2=USB-C ↔ USB-C', /3 sản phẩm/, /Apple USB-C|Zolo|UGREEN Uno/],
    ['?category=L03&spec1=Pin dự phòng&spec2=10.000 mAh', /3 sản phẩm/, /Anker Nano|Samsung|Xiaomi/],
  ];
  for (const [query, countPattern, productPattern] of accessoryCases) {
    dot4 = setup(query);
    assert.match(dot4.nodes.productCount.textContent, countPattern);
    assert.match(dot4.grid.innerHTML, productPattern);
  }
  dot4 = setup('?category=L03&spec1=Củ sạc&spec3=3 cổng&spec4=USB-C');
  assert.match(dot4.nodes.productCount.textContent, /2 sản phẩm/);

  // 20. Đổi danh mục loại bỏ điều kiện ẩn/không còn ý nghĩa và quay về trang 1.
  dot4 = setup('?category=L04&ram=16 GB&spec1=NVIDIA RTX 4050&page=2');
  dot4.forms[0].elements.category.value = 'L05';
  dot4.forms[0].elements.category.change();
  assert.match(dot4.context.location.search, /category=L05/);
  assert.doesNotMatch(dot4.context.location.search, /ram=|spec1=|page=/);
  assert.match(dot4.nodes.productCount.textContent, /15 sản phẩm · Trang 1\/2/);

  // 21. URL lỗi được làm sạch; page quá lớn được kẹp về trang cuối hợp lệ.
  dot4 = setup('?category=KHONG-CO&foo=bar&page=999');
  assert.match(dot4.nodes.productCount.textContent, /120 sản phẩm · Trang 12\/12/);
  assert.doesNotMatch(dot4.context.location.search, /category=|foo=/);
  assert.match(dot4.context.location.search, /page=12/);
  dot4 = setup('?category=L05&ram=8 GB');
  assert.match(dot4.nodes.productCount.textContent, /15 sản phẩm/);
  assert.doesNotMatch(dot4.context.location.search, /ram=/);

  // 22. Sản phẩm thiếu thuộc tính chỉ bị loại khi chính thuộc tính đó đang lọc.
  const missingAttributeProducts = [
    { masp: 'MISSING', name: 'Thiếu RAM', company: 'Test', categoryId: 'L01', img: 'images/samsung-galaxy-j4-plus-pink-400x400.jpg', price: 1000000, detail: { os: 'Android 13' } },
    { masp: 'HASRAM', name: 'Có RAM', company: 'Test', categoryId: 'L01', img: 'images/samsung-galaxy-j4-plus-pink-400x400.jpg', price: 1000000, detail: { os: 'Android 13', ram: '8GB' } },
  ];
  dot4 = setup('?category=L01', missingAttributeProducts);
  assert.match(dot4.nodes.productCount.textContent, /2 sản phẩm/);
  dot4 = setup('?category=L01&ram=8 GB', missingAttributeProducts);
  assert.match(dot4.nodes.productCount.textContent, /1 sản phẩm/);
  assert.match(dot4.grid.innerHTML, /Có RAM/);
  assert.doesNotMatch(dot4.grid.innerHTML, /Thiếu RAM/);

  // 23. Sắp xếp chạy trước phân trang và hai trang liên tiếp không lặp/mất ID.
  const sortedPage1 = setup('?category=L04&sort=price-asc&page=1');
  const sortedPage2 = setup('?category=L04&sort=price-asc&page=2');
  const idsOn = html => Array.from(html.matchAll(/data-buy="([^"]+)"/g), match => match[1]);
  const page1Ids = idsOn(sortedPage1.grid.innerHTML);
  const page2Ids = idsOn(sortedPage2.grid.innerHTML);
  assert.equal(page1Ids.length, 10);
  assert.equal(page2Ids.length, 10);
  assert.equal(new Set([...page1Ids, ...page2Ids]).size, 20);

  // 24. Dữ liệu Admin mới/sửa/ẩn được đọc động, không cần danh sách hãng cố định.
  dot4 = setup();
  const adminStore = dot4.context.window.TechStore;
  const adminDb = adminStore.load(dot4.context.list_products);
  adminDb.products.push({
    masp: 'ADMIN-FILTER-1', name: 'Tai nghe Admin Filter', company: 'NewBrand',
    categoryId: 'L05', img: '../images/airpods-3.png', hidden: false,
    threshold: 1, detail: { type: 'Over-ear', connection: 'Bluetooth 5.3', noiseCancellation: 'Không ANC' },
  });
  adminDb.ledger.push({ id: 'OPEN-ADMIN-FILTER-1', productId: 'ADMIN-FILTER-1', quantity: 3, cost: 1000000, kind: 'opening', at: adminStore.now() });
  adminStore.save(adminDb);
  dot4.history.pushState(null, '', '?category=L05&brand=NewBrand&spec1=Over-ear');
  dot4.events.popstate();
  assert.match(dot4.nodes.productCount.textContent, /1 sản phẩm/);
  assert.match(dot4.grid.innerHTML, /Tai nghe Admin Filter/);
  const editedDb = adminStore.load(dot4.context.list_products);
  editedDb.products.find(product => product.masp === 'ADMIN-FILTER-1').detail.type = 'On-ear';
  adminStore.save(editedDb);
  dot4.events.pageshow();
  assert.match(dot4.nodes.productCount.textContent, /0 sản phẩm/);
  const hiddenDb = adminStore.load(dot4.context.list_products);
  hiddenDb.products.find(product => product.masp === 'ADMIN-FILTER-1').hidden = true;
  adminStore.save(hiddenDb);
  dot4.history.pushState(null, '', '?category=L05&brand=NewBrand');
  dot4.events.popstate();
  assert.doesNotMatch(dot4.context.location.search, /brand=NewBrand/);

  console.log('PASS: Tất cả kiểm thử bộ lọc mở rộng và nghiệp vụ đã chạy thành công!');
})().catch(e => { console.error(e); process.exitCode = 1; });
