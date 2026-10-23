(async function(){
 const C=window.TechStoreCart,S=window.TechStore,box=document.getElementById('cart'),msg=document.getElementById('message');
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=v=>v.toLocaleString('vi-VN')+' ₫';
 async function render(){
  try{
   const a=await C.account(),db=S.load(list_products),items=C.read(a);let total=0;
   box.innerHTML=items.length?'<table><thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th><th></th></tr></thead><tbody>'+items.map((i,index)=>{
    const p=db.products.find(p=>p.masp===i.productId),available=p&&!p.hidden&&db.categories.some(c=>c.id===p.categoryId&&!c.hidden)&&S.stock(db,p.masp)>=i.quantity&&S.sellingPrice(db,p)>0;
    const price=p?S.sellingPrice(db,p):0; if(available)total+=price*i.quantity;
    return `<tr><td>${esc(p?.name||i.productId)}${available?'':' — Không khả dụng hoặc vượt tồn kho'}</td><td>${money(price)}</td><td><input aria-label="Số lượng ${esc(p?.name||i.productId)}" type="number" min="1" max="${p?S.stock(db,p.masp):0}" value="${i.quantity}" data-index="${index}"></td><td>${money(price*i.quantity)}</td><td><button data-remove="${index}">Xóa</button></td></tr>`;
   }).join('')+`</tbody></table><h2>Tổng sản phẩm khả dụng: ${money(total)}</h2>`:'<p>Giỏ hàng đang trống.</p>';
  }catch(e){msg.textContent=e.message;box.innerHTML='<a href="index.html">Về trang chủ để đăng nhập</a>';}
 }
 box.addEventListener('change',async e=>{if(!e.target.matches('[data-index]'))return;try{const a=await C.account(),items=C.read(a),n=Number(e.target.value);if(!Number.isSafeInteger(n)||n<1||n>Number(e.target.max))throw Error('Số lượng phải là số nguyên dương và không vượt tồn kho.');items[Number(e.target.dataset.index)].quantity=n;localStorage.setItem(C.key(a),JSON.stringify(items));msg.textContent='Đã cập nhật giỏ hàng.';}catch(err){msg.textContent=err.message;}await render();});
 box.addEventListener('click',async e=>{const b=e.target.closest('[data-remove]');if(!b)return;try{const a=await C.account(),items=C.read(a);items.splice(Number(b.dataset.remove),1);localStorage.setItem(C.key(a),JSON.stringify(items));await render();}catch(err){msg.textContent=err.message;}});
 await render();
})();
