// Kiểm tra liên kết dữ liệu xuyên Đợt 1-4 trong Local Storage tạm, không chạm dữ liệu trình duyệt.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const memory = new Map();
const context = vm.createContext({
  window: { dispatchEvent() {} },
  CustomEvent: function CustomEvent() {},
  localStorage: { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) },
});
vm.runInContext(fs.readFileSync(path.join(root, 'products.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'admin/js/store.js'), 'utf8'), context);
const S = context.window.TechStore;
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }

const requiredDetails = {
  L01: ['screen', 'os', 'camara', 'camaraFront', 'cpu', 'ram', 'rom', 'battery'],
  L02: ['screen', 'os', 'camara', 'camaraFront', 'cpu', 'ram', 'rom', 'battery'],
  L04: ['screen', 'os', 'cpu', 'gpu', 'ram', 'rom', 'battery'],
  L05: ['type', 'connection', 'noiseCancellation', 'battery'],
  L06: ['size', 'screen', 'compatibility', 'waterResistance', 'battery'],
  L07: ['connection', 'power', 'battery'],
};

test('catalog Đợt 1-3 tạo đủ danh mục, số lượng và tồn/giá hợp lệ', () => {
  const db = S.importStandardBatches(S.load(context.list_products));
  assert.deepEqual(Object.fromEntries(['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07'].map(id => [id, db.products.filter(p => p.categoryId === id).length])), {
    L01: 25, L02: 15, L03: 20, L04: 25, L05: 15, L06: 10, L07: 10,
  });
  assert.equal(new Set(db.products.map(p => p.masp.toLowerCase())).size, 120);
  for (const product of db.products) {
    assert.ok(product.masp && product.name && product.company && product.categoryId);
    assert.ok(Number.isFinite(product.price) && product.price > 0, product.masp + ' phải có giá bán dương');
    assert.ok(Number.isSafeInteger(S.stock(db, product.masp)) && S.stock(db, product.masp) >= 0, product.masp + ' có tồn kho không hợp lệ');
    assert.ok(!Object.values(product.detail || {}).some(value => /^(?:undefined|null)$/i.test(String(value).trim())), product.masp + ' có thông số dữ liệu rác');
    for (const field of requiredDetails[product.categoryId] || []) assert.ok(String(product.detail?.[field] || '').trim(), product.masp + ' thiếu ' + field);
    if (product.categoryId === 'L03') {
      assert.ok(['Chuột', 'Bàn phím', 'Củ sạc', 'Cáp', 'Pin dự phòng'].includes(product.detail?.accessoryType), product.masp + ' có nhóm phụ kiện sai');
    }
  }
});

test('ảnh catalog cục bộ, giải mã được và không có placeholder dùng chung', () => {
  const db = S.importStandardBatches(S.load(context.list_products));
  const hashes = new Map();
  for (const product of db.products) {
    assert.ok(product.img.startsWith('../images/'), product.masp + ' phải dùng ảnh local của Admin');
    const file = path.resolve(root, 'admin', product.img);
    assert.ok(fs.existsSync(file), product.masp + ' thiếu ảnh');
    const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    (hashes.get(hash) || hashes.set(hash, []).get(hash)).push(product);
  }
  const duplicates = [...hashes.values()].filter(group => group.length > 1);
  assert.equal(duplicates.length, 0);
  assert.equal(db.products.filter(product => product.img.endsWith('/image-updating.svg')).length, 0);
});

test('import lặp giữ nguyên sửa riêng, sản phẩm ẩn và sản phẩm đã xóa', () => {
  let db = S.importStandardBatches(S.load(context.list_products));
  const edited = db.products.find(p => p.masp === 'DT-IP13');
  edited.name = 'Tên riêng do Admin sửa';
  const hidden = db.products.find(p => p.masp === 'SP-JBLC5');
  hidden.hidden = true;
  const deletedCode = 'SP-JBLF6';
  db.products = db.products.filter(p => p.masp !== deletedCode);
  db.deletedProductCodes.push(deletedCode);
  db.importedBatches = [];
  db = S.importStandardBatches(db);
  assert.equal(db.products.find(p => p.masp === 'DT-IP13').name, 'Tên riêng do Admin sửa');
  assert.equal(db.products.find(p => p.masp === 'SP-JBLC5').hidden, true);
  assert.equal(db.products.some(p => p.masp === deletedCode), false);
});

(async () => {
  // Phiên giỏ mô phỏng một trình duyệt mới, không kế thừa trạng thái Admin của ca trước.
  memory.clear();
  context.window.TechStoreDemo = { getAccount: () => ({ maKH: 'KH-INTEGRATION', vaiTro: 'CUSTOMER' }) };
  vm.runInContext(fs.readFileSync(path.join(root, 'js/cart-bridge.js'), 'utf8'), context);
  const items = await context.window.TechStoreCart.add({ productId: 'SP-JBLC5' });
  assert.equal(items.length, 1);
  assert.equal(items[0].productId, 'SP-JBLC5');
  const db = S.load(context.list_products);
  assert.ok(db.products.some(product => product.masp === 'SP-JBLC5'));
  console.log('PASS Cầu nối giỏ tự nạp dữ liệu mở rộng khi catalog chưa chạy');
  console.log('Hoàn tất ' + (passed + 1) + ' kiểm tra tích hợp Đợt 1-4.');
})().catch(error => { console.error(error); process.exitCode = 1; });
