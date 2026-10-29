/* TV2: danh mục dùng chung với admin; URL giữ bộ lọc và trang. */
(function () {
  'use strict';
  const S = window.TechStore;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => Number(v).toLocaleString('vi-VN') + ' ₫';
  const image = p => S.safeImage(p.img) ? p.img.replace(/^\.\.\//, '') : '';
  const size = 8;
  const categoryMenu = document.getElementById('navCategoryDropdown');
  let db, dataError = ''; 
  const root = document.querySelector('.products-section');
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const filters = document.createElement('form');
  filters.className = 'catalog-filters';
  filters.innerHTML = `<label>Tên sản phẩm<input name="q" maxlength="200" placeholder="Bạn đang tìm thiết bị nào?"></label><label>Loại sản phẩm<select name="category"><option value="">Tất cả loại</option></select></label><label>Giá từ (₫)<input name="min" type="number" min="0" step="1" placeholder="0"></label><label>Giá đến (₫)<input name="max" type="number" min="0" step="1" placeholder="Không giới hạn"></label><button class="btn btn-primary">Tìm kiếm</button><a class="btn btn-outline" href="index.html#san-pham">Xóa bộ lọc</a><p id="filterError" role="alert"></p>`;
  root.querySelector('.product-grid').before(filters);
  const pages = document.createElement('nav'); pages.className = 'catalog-pages'; pages.setAttribute('aria-label','Phân trang sản phẩm'); root.append(pages);
  const notice = document.createElement('p'); notice.className = 'catalog-notice'; notice.setAttribute('role','status'); root.prepend(notice);
  const active = p => !p.hidden && (!p.categoryId || db.categories.some(c => c.id === p.categoryId && !c.hidden));
  const price = p => Number.isFinite(p.sqlPrice) ? p.sqlPrice : S.sellingPrice(db,p);
  const stock = p => Number.isInteger(p?.sqlStock) ? p.sqlStock : S.stock(db,typeof p === 'string' ? p : p.masp);
  function reload() {
    db = S.load(list_products);
    window.__customerProducts = db.products;
    const selected = filters.elements.category.value || params.get('category') || '';
    filters.elements.category.innerHTML = '<option value="">Tất cả loại</option>' + db.categories.filter(c => !c.hidden).map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    filters.elements.category.value = selected;
    if (categoryMenu) {
      categoryMenu.innerHTML = '<a href="index.html#san-pham" data-nav-category="" role="menuitem">Tất cả sản phẩm</a>' +
        db.categories.filter(c => !c.hidden).map(c => `<a href="index.html?category=${encodeURIComponent(c.id)}#san-pham" data-nav-category="${esc(c.id)}" role="menuitem">${esc(c.name)}</a>`).join('');
    }
  }
  function render() {
    reload();
    for (const key of ['q','category','min','max']) filters.elements[key].value = params.get(key) || '';
    const min = params.get('min') || '', max = params.get('max') || '';
    const invalid = [min,max].some(v => v !== '' && (!Number.isSafeInteger(Number(v)) || Number(v) < 0)) || (min !== '' && max !== '' && Number(min) > Number(max));
    document.getElementById('filterError').textContent = invalid ? 'Khoảng giá không hợp lệ. Giá phải là số nguyên không âm và giá từ không vượt giá đến.' : '';
    let products = invalid ? [] : (window.__customerProducts || db.products).filter(p => active(p) && S.normalize(p.name).includes(S.normalize(params.get('q') || '')) && (!params.get('category') || p.categoryId === params.get('category')) && (min === '' || price(p) >= Number(min)) && (max === '' || price(p) <= Number(max)));
    const count = Math.max(1, Math.ceil(products.length / size));
    const page = Math.min(count, Math.max(1, Math.floor(Number(params.get('page')) || 1)));
    document.getElementById('productCount').textContent = `${products.length} sản phẩm · Trang ${page}/${count}`;
    document.getElementById('productList').innerHTML = products.slice((page-1)*size,page*size).map(p => {
      const qty = stock(p), amount = price(p), type = db.categories.find(c=>c.id===p.categoryId)?.name || 'Chưa phân loại';
      return `<article class="product-card"><a class="product-image" href="${detailURL(p.masp)}"><img src="${esc(image(p))}" alt="${esc(p.name)}" loading="lazy"></a><div class="product-company">${esc(type)} · ${esc(p.company)}</div><h3 class="product-name"><a href="${detailURL(p.masp)}">${esc(p.name)}</a></h3><div class="product-price">${money(amount)}</div><p>${qty > 0 ? 'Còn ' + qty + ' sản phẩm' : 'Hết hàng'}</p><div class="catalog-actions"><a class="btn btn-outline" href="${detailURL(p.masp)}">Chi tiết</a><button class="btn btn-primary" data-buy="${esc(p.masp)}" ${qty <= 0 || amount <= 0 ? 'disabled' : ''}>Thêm vào giỏ</button></div></article>`;
    }).join('') || '<div class="empty-products">Không tìm thấy sản phẩm phù hợp. Hãy thử đổi tên, loại hoặc khoảng giá.</div>';
    pages.innerHTML = products.length ? Array.from({length:count},(_,i)=>`<button class="btn ${i+1===page?'btn-primary':'btn-outline'}" data-page="${i+1}" ${i+1===page?'aria-current="page"':''}>${i+1}</button>`).join('') : '';
    if (params.has('id')) detail(params.get('id'));
    if (dataError) notice.textContent = dataError;
  }
  function detailURL(id) {
    const q = new URLSearchParams(params);
    q.set('id', id);
    const target = 'chi_tiet_sp.html?' + q.toString();
    return window.TechStoreDemo?.localMode ? window.TechStoreDemo.transferURL(target) : target;
  }

  function detail(id) {
    document.querySelector('.hero').style.display='none'; root.style.display='none';
    let section = document.getElementById('productDetailPage');
    if (!section) { section=document.createElement('section'); section.id='productDetailPage'; section.className='product-detail-page'; root.before(section); }
    const back = new URLSearchParams(params); back.delete('id');
    const p = (window.__customerProducts || db.products).find(p => p.masp===id && active(p));
    const backTarget = 'index.html' + (back.toString() ? '?' + back.toString() : '');
    const backHref = window.TechStoreDemo?.localMode ? window.TechStoreDemo.transferURL(backTarget) : backTarget + '#san-pham';
    const link = `<a class="detail-back" href="${esc(backHref)}">← Quay lại kết quả</a>`;
    if (!p) { section.innerHTML = link + '<h1>Sản phẩm không tồn tại hoặc đã được ẩn</h1>'; return; }
    document.title = p.name + ' | TechStore';
    const labels = {screen:'Màn hình',os:'Hệ điều hành',camara:'Camera sau',camaraFront:'Camera trước',cpu:'Bộ xử lý',ram:'RAM',rom:'Bộ nhớ',microUSB:'Thẻ nhớ / kết nối',battery:'Pin'};
    const qty = stock(p.masp), amount = price(p);
    section.innerHTML = link + `<div class="detail-container"><div class="detail-image"><img src="${esc(image(p))}" alt="${esc(p.name)}"></div><div class="detail-info"><p>${esc(p.company)} · Mã ${esc(p.masp)}</p><h1>${esc(p.name)}</h1><div class="detail-price">${money(amount)}</div><p>${qty>0?'Còn '+qty+' sản phẩm':'Hết hàng'}</p><p class="catalog-description">${esc(p.description)}</p><div class="detail-purchase-actions"><button class="btn btn-primary" data-buy="${esc(p.masp)}" ${qty<=0 || amount<=0?'disabled':''}>Thêm vào giỏ hàng</button><button class="btn btn-outline" data-buy-now="${esc(p.masp)}" ${qty<=0 || amount<=0?'disabled':''}>Mua ngay</button></div><p class="catalog-feedback" role="status"></p><h2>Thông số kỹ thuật</h2><table class="spec-table"><tbody>${Object.entries(p.detail || {}).filter(([,v])=>v).map(([k,v])=>`<tr><td>${esc(labels[k] || k)}</td><td>${esc(v)}</td></tr>`).join('') || '<tr><td>Thông số đang cập nhật</td></tr>'}</tbody></table></div></div>`;
  }
  const productMenu = document.querySelector('.nav-product-menu');
  const productTrigger = document.querySelector('.nav-product-trigger');
  if (productMenu && productTrigger) {
    productMenu.addEventListener('mouseenter', () => productTrigger.setAttribute('aria-expanded', 'true'));
    productMenu.addEventListener('mouseleave', () => productTrigger.setAttribute('aria-expanded', 'false'));
    productMenu.addEventListener('focusin', () => productTrigger.setAttribute('aria-expanded', 'true'));
    productMenu.addEventListener('focusout', e => { if (!productMenu.contains(e.relatedTarget)) productTrigger.setAttribute('aria-expanded', 'false'); });
  }
  filters.addEventListener('submit', e => { e.preventDefault(); params.delete('page'); params.delete('id'); for (const key of ['q','category','min','max']) { const v=filters.elements[key].value.trim(); v?params.set(key,v):params.delete(key); } history.pushState(null,'','?'+params.toString()+'#san-pham'); render(); });
  filters.elements.category.addEventListener('change', () => filters.requestSubmit());
  document.addEventListener('click', async e => {
    const categoryLink = e.target.closest('[data-nav-category]');
    if (categoryLink) {
      e.preventDefault();
      const categoryId = categoryLink.dataset.navCategory || '';
      params.delete('id'); params.delete('page');
      categoryId ? params.set('category', categoryId) : params.delete('category');
      history.pushState(null, '', 'index.html' + (params.toString() ? '?' + params.toString() : '') + '#san-pham');
      render();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const trigger = document.querySelector('.nav-product-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      return;
    }
    const page=e.target.closest('[data-page]');
    if (page) { params.set('page',page.dataset.page); history.pushState(null,'','?'+params.toString()+'#san-pham'); render(); root.scrollIntoView(); }
    const buyNow = e.target.closest('[data-buy-now]');
    const buy = e.target.closest('[data-buy]') || buyNow;
    if (!buy) return;
    const feedback = document.querySelector('.catalog-feedback') || notice;
    buy.disabled = true;
    try {
      reload(); const requestedId = buy.dataset.buy ?? buy.dataset.buyNow; const p=(window.__customerProducts||db.products).find(p=>String(p.masp)===String(requestedId) && active(p));
      if (!p || stock(p)<=0 || price(p)<=0) throw Error('Sản phẩm không còn khả dụng. Vui lòng tải lại danh sách.');
      if (!window.TechStoreDemo?.getAccount?.()) {
        window.openModal('login');
        throw Error('Vui lòng đăng nhập tài khoản khách hàng trước khi mua hàng.');
      }
      if (!window.TechStoreCart?.add) throw Error('Chức năng giỏ hàng chưa được tải. Hãy tải lại trang.');
      await window.TechStoreCart.add({productId:p.masp,quantity:1});
      if (buyNow) { window.location.href = 'don-hang.html?checkout=1'; return; }
      feedback.textContent='Đã thêm sản phẩm vào giỏ hàng.';
    } catch(error) { feedback.textContent=location.protocol==='file:' && !window.TechStoreCart ? 'Cần đăng nhập để mua hàng. Mở bản chạy Node.js để dùng tài khoản, hoặc kết nối module giỏ hàng TV4.' : error.message; }
    finally { buy.disabled=false; }
  });
  window.addEventListener('popstate',()=>location.reload());
  window.addEventListener('storage', e=>{if(e.key===S.KEY) render();});
  function loadProducts(){
    try {
      reload();
      window.__customerProducts = db.products;
      dataError = '';
      render();
    } catch (e) {
      dataError = 'Không thể đọc dữ liệu sản phẩm trong Local Storage: ' + e.message;
      window.__customerProducts = [];
      render();
    }
  }
  window.addEventListener('pageshow',loadProducts);
})();

