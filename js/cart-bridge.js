/* Cầu nối giỏ hàng dùng Local Storage, không gọi backend hoặc SQL Server. */
(function () {
  'use strict';
  const S = window.TechStore;
  const CART_KEY = 'techstore_customer_carts_v1';
  function currentAccount() { return window.TechStoreDemo?.getAccount?.() || null; }
  function accountId(account) { return String(account?.maKH ?? account?.id ?? ''); }
  function readCarts() {
    try { const value = JSON.parse(localStorage.getItem(CART_KEY) || '{}'); return value && typeof value === 'object' ? value : {}; }
    catch (_) { return {}; }
  }
  function read(account = currentAccount()) {
    if (!account) return [];
    const carts = readCarts();
    return Array.isArray(carts[accountId(account)]) ? carts[accountId(account)] : [];
  }
  function write(account, items) {
    const carts = readCarts();
    carts[accountId(account)] = items;
    localStorage.setItem(CART_KEY, JSON.stringify(carts));
    window.dispatchEvent(new CustomEvent('techstore:cart-changed', { detail: { accountId: accountId(account), items } }));
  }
  async function add({ productId, quantity = 1 }) {
    const account = currentAccount();
    if (!account || account.vaiTro !== 'CUSTOMER') {
      window.openModal?.('login');
      throw new Error('Vui lòng đăng nhập tài khoản khách hàng trước khi mua hàng.');
    }
    const db = S.load(typeof list_products !== 'undefined' ? list_products : []);
    const product = db.products.find(p => String(p.masp) === String(productId) && !p.hidden);
    if (!product) throw new Error('Sản phẩm không tồn tại hoặc đã bị ẩn.');
    const price = S.sellingPrice(db, product);
    const stock = S.stock(db, product.masp);
    if (price <= 0 || stock <= 0) throw new Error('Sản phẩm hiện không còn hàng hoặc chưa có giá bán.');
    const items = read(account);
    const line = items.find(item => String(item.productId) === String(productId));
    const next = (Number(line?.quantity) || 0) + Number(quantity);
    if (!Number.isSafeInteger(next) || next < 1 || next > stock) throw new Error('Số lượng trong giỏ vượt quá tồn kho hiện có.');
    if (line) { line.quantity = next; line.price = price; line.name = product.name; line.image = product.img; }
    else items.push({ productId: product.masp, name: product.name, price, image: product.img, quantity: Number(quantity) });
    write(account, items);
    return items;
  }
  window.TechStoreCart = { add, account: currentAccount, read, key: accountId };
})();
