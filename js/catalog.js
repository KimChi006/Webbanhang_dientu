/* TV2: danh mục dùng chung với admin; URL giữ bộ lọc và trang. */
(function () {
  'use strict';
  const S = window.TechStore;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => Number(v).toLocaleString('vi-VN') + ' ₫';
  const image = p => S.safeImage(p.img) ? p.img.replace(/^\.\.\//, '') : '';
  const size = 8;
  let db, dataError = '', sqlLoaded = false;
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
    if (!sqlLoaded) window.__customerProducts = db.products;
    const selected = filters.elements.category.value || params.get('category') || '';
    filters.elements.category.innerHTML = '<option value="">Tất cả loại</option>' + db.categories.filter(c => !c.hidden).map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    filters.elements.category.value = selected;
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
  function detailURL(id) { const q = new URLSearchParams(params); q.set('id',id); const target = 'chi_tiet_sp.html?' + q.toString(); return window.TechStoreDemo?.localMode ? window.TechStoreDemo.transferURL(target) : target; }
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
    section.innerHTML = link + `<div class="detail-container"><div class="detail-image"><img src="${esc(image(p))}" alt="${esc(p.name)}"></div><div class="detail-info"><p>${esc(p.company)} · Mã ${esc(p.masp)}</p><h1>${esc(p.name)}</h1><div class="detail-price">${money(amount)}</div><p>${qty>0?'Còn '+qty+' sản phẩm':'Hết hàng'}</p><p class="catalog-description">${esc(p.description)}</p><button class="btn btn-primary" data-buy="${esc(p.masp)}" ${qty<=0 || amount<=0?'disabled':''}>Thêm vào giỏ hàng</button><p class="catalog-feedback" role="status"></p><h2>Thông số kỹ thuật</h2><table class="spec-table"><tbody>${Object.entries(p.detail || {}).filter(([,v])=>v).map(([k,v])=>`<tr><td>${esc(labels[k] || k)}</td><td>${esc(v)}</td></tr>`).join('') || '<tr><td>Thông số đang cập nhật</td></tr>'}</tbody></table></div></div>`;
  }
  filters.addEventListener('submit', e => { e.preventDefault(); params.delete('page'); params.delete('id'); for (const key of ['q','category','min','max']) { const v=filters.elements[key].value.trim(); v?params.set(key,v):params.delete(key); } history.pushState(null,'','?'+params.toString()+'#san-pham'); render(); });
  filters.elements.category.addEventListener('change', () => filters.requestSubmit());
  document.addEventListener('click', async e => {
    const page=e.target.closest('[data-page]');
    if (page) { params.set('page',page.dataset.page); history.pushState(null,'','?'+params.toString()+'#san-pham'); render(); root.scrollIntoView(); }
    const buy=e.target.closest('[data-buy]');
    if (!buy) return;
    const feedback = document.querySelector('.catalog-feedback') || notice;
    buy.disabled = true;
    try {
      reload(); const p=(window.__customerProducts||db.products).find(p=>p.masp===buy.dataset.buy && active(p));
      if (!p || stock(p)<=0 || price(p)<=0) throw Error('Sản phẩm không còn khả dụng. Vui lòng tải lại danh sách.');
      // TV4 có thể đăng ký adapter: xác thực và lưu giỏ bằng hệ thống của nhóm.
      if (window.TechStoreCart?.add) { await window.TechStoreCart.add({productId:p.masp,quantity:1}); feedback.textContent='Đã thêm sản phẩm vào giỏ hàng.'; }
      else {
        const response = await fetch('/api/me', {credentials:'same-origin'});
        const result = response.ok ? await response.json() : {};
        if (!result.account || result.account.vaiTro !== 'CUSTOMER') { window.openModal('login'); throw Error('Vui lòng đăng nhập tài khoản khách hàng trước khi mua.'); }
        // Chưa có module giỏ của TV4: phát sự kiện có dữ liệu để tích hợp, không báo thêm thành công giả.
        window.dispatchEvent(new CustomEvent('techstore:cart-request',{detail:{productId:p.masp,quantity:1,account:result.account}}));
        throw Error('Chức năng giỏ hàng của TV4 chưa được kết nối. Sản phẩm đã sẵn sàng để tích hợp.');
      }
    } catch(error) { feedback.textContent=location.protocol==='file:' && !window.TechStoreCart ? 'Cần đăng nhập để mua hàng. Mở bản chạy Node.js để dùng tài khoản, hoặc kết nối module giỏ hàng TV4.' : error.message; }
    finally { buy.disabled=false; }
  });
  window.addEventListener('popstate',()=>location.reload());
  window.addEventListener('storage', e=>{if(e.key===S.KEY) render();});
  async function loadProducts(){
    try {
      reload();
      if (window.TechStoreDemo?.localMode) {
        sqlLoaded = false;
        window.__customerProducts = db.products;
        dataError = '';
        render();
        return;
      }
      const response=await fetch('/api/products',{credentials:'same-origin'});
      if(!response.ok) throw Error('API không tải được sản phẩm từ database ('+response.status+').');
      const result=await response.json();
      if(!Array.isArray(result.products)) throw Error('API sản phẩm trả dữ liệu không đúng định dạng.');
      const localByCode=new Map(db.products.map(p=>[p.masp,p]));
      window.__customerProducts=result.products.map(row=>{
        const old=localByCode.get(row.maSP)||{};
        const apiImage=String(row.hinhAnh||'');
        return {...old,masp:row.maSP,name:row.tenSanPham,company:row.hang,img:apiImage?(apiImage.startsWith('../')?apiImage:'../'+apiImage):(old.img||''),sqlPrice:Number(row.gia),sqlStock:Number(row.soLuongTon),price:Number(row.gia),hidden:row.trangThai!=='ACTIVE',detail:{...old.detail,screen:row.manHinh,os:row.heDieuHanh,camara:row.cameraSau,camaraFront:row.cameraTruoc,cpu:row.cpu,ram:row.ram,rom:row.rom,microUSB:row.theNho,battery:row.pin}};
      });
      sqlLoaded=true;
      dataError=''; render();
    } catch(e) {dataError=e.message;window.__customerProducts=[];render();}
  }
  window.addEventListener('pageshow',loadProducts);
})();

