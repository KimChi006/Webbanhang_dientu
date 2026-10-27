/* TV4 bridge: cart storage shared with don-hang.html and admin's order model. */
(function () {
  'use strict';
  const S = window.TechStore;
  const Demo = window.TechStoreDemo || {};
  const CART_KEY = 'techstore_customer_carts_v1';
  const LOCAL = window.location?.protocol === 'file:';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function readCarts() {
    try { const value = JSON.parse(localStorage.getItem(CART_KEY) || '{}'); return value && typeof value === 'object' ? value : {}; }
    catch (_) { return {}; }
  }
  function writeCarts(value) { localStorage.setItem(CART_KEY, JSON.stringify(value)); }
  function readForAccount(account) { const all = readCarts(); const items = all[accountId(account)]; return Array.isArray(items) ? items : []; }
  function accountId(account) { return String(account?.maKH ?? account?.MaTaiKhoan ?? account?.id ?? ''); }
  function normalizeImage(image) { return String(image || '').replace(/^\.\.\//, ''); }
  function localCatalogProduct(productId) {
    const db = S.load(typeof list_products !== 'undefined' ? list_products : []);
    const product = db.products.find(item => String(item.masp) === String(productId));
    if (!product || product.hidden || db.categories.some(c => c.id === product.categoryId && c.hidden)) return null;
    return { db, product };
  }
  async function currentAccount() {
    if (LOCAL) {
      const account = Demo.getAccount ? Demo.getAccount() : (() => { try { return JSON.parse(localStorage.getItem('techstore_demo_current_account_v1') || 'null'); } catch (_) { return null; } })();
      if (!account || account.vaiTro && account.vaiTro !== 'CUSTOMER') {
        if (window.openModal) window.openModal('login');
        throw new Error('Vui lòng đăng ký và đăng nhập tài khoản khách hàng trước khi mua.');
      }
      return account;
    }
    let response;
    try { response = await fetch('/api/me', { credentials: 'same-origin' }); }
    catch (_) { throw new Error('Không thể kết nối máy chủ. Hãy chạy Node.js hoặc mở prototype local.'); }
    const result = response.ok ? await response.json() : {};
    if (!result.account || result.account.vaiTro !== 'CUSTOMER') {
      if (window.openModal) window.openModal('login');
      throw new Error('Vui lòng đăng nhập tài khoản khách hàng trước khi mua.');
    }
    return result.account;
  }
  async function add({ productId, quantity = 1 }) {
    const account = await currentAccount();
    const id = accountId(account);
    if (!id) throw new Error('Không xác định được tài khoản khách hàng. Vui lòng đăng nhập lại.');
    let product;
    let available;
    if (LOCAL) {
      const found = localCatalogProduct(productId);
      if (!found) throw new Error('Sản phẩm không tồn tại hoặc đã bị ẩn.');
      product = found.product;
      available = S.stock(found.db, product.masp);
      product = {
        productId: product.masp,
        name: product.name,
        price: S.sellingPrice(found.db, product),
        image: normalizeImage(product.img),
      };
    } else {
      let response;
      try { response = await fetch('/api/products', { credentials: 'same-origin' }); }
      catch (_) { throw new Error('Không thể kiểm tra sản phẩm và tồn kho từ database.'); }
      const result = response.ok ? await response.json() : {};
      if (!response.ok || !Array.isArray(result.products)) throw new Error('Không thể kiểm tra sản phẩm và tồn kho từ database.');
      const row = result.products.find(item => String(item.maSP) === String(productId));
      if (!row || row.trangThai !== 'ACTIVE' || Number(row.gia) <= 0) throw new Error('Sản phẩm không còn khả dụng.');
      available = Number(row.soLuongTon);
      product = {
        productId: row.maSP,
        name: row.tenSanPham,
        price: Number(row.gia),
        image: normalizeImage(row.hinhAnh),
      };
    }
    if (!Number.isSafeInteger(Number(quantity)) || Number(quantity) < 1) throw new Error('Số lượng không hợp lệ.');
    const carts = readCarts();
    const items = Array.isArray(carts[id]) ? carts[id] : [];
    const line = items.find(item => String(item.productId) === String(productId));
    const next = (Number(line?.quantity) || 0) + Number(quantity);
    if (!Number.isSafeInteger(next) || next < 1 || next > available) throw new Error('Số lượng trong giỏ vượt quá tồn kho hiện có.');
    if (line) {
      line.quantity = next;
      line.name = product.name;
      line.price = Number(product.price);
      line.image = product.image;
    } else {
      items.push({ ...product, quantity: next });
    }
    carts[id] = items;
    writeCarts(carts);
    window.dispatchEvent(new CustomEvent('techstore:cart-changed', { detail: { accountId: id, items } }));
    return items;
  }
  window.TechStoreCart = { add, account: currentAccount, read: readForAccount, key: accountId };
})();
