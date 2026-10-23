/* Điểm nối TV2–TV4. TV4 có thể thay TechStoreCart bằng module giỏ chính thức. */
(function(){
  'use strict';
  const S=window.TechStore;
  async function account(){
    let r;
    try {r=await fetch('/api/me',{credentials:'same-origin'});} catch {throw Error('Vui lòng chạy website bằng Node.js và đăng nhập để sử dụng giỏ hàng.');}
    const data=r.ok?await r.json():{};
    if(!data.account || data.account.vaiTro!=='CUSTOMER') {if(window.openModal)window.openModal('login'); throw Error('Vui lòng đăng nhập tài khoản khách hàng trước khi mua.');}
    return data.account;
  }
  const key=a=>'techstore_cart_v1:'+a.maKH;
  function read(a){const v=JSON.parse(localStorage.getItem(key(a))||'[]'); if(!Array.isArray(v))throw Error('Dữ liệu giỏ hàng không hợp lệ.');return v;}
  window.TechStoreCart=window.TechStoreCart||{
    async add({productId,quantity}){
      const a=await account(), db=S.load(list_products);
      const p=db.products.find(p=>p.masp===productId && !p.hidden && db.categories.some(c=>c.id===p.categoryId&&!c.hidden));
      if(!p || S.sellingPrice(db,p)<=0)throw Error('Sản phẩm không còn khả dụng.');
      const items=read(a),line=items.find(i=>i.productId===productId),next=(line?.quantity||0)+quantity;
      if(!Number.isSafeInteger(next)||next<1||next>S.stock(db,productId))throw Error('Số lượng trong giỏ vượt quá tồn kho.');
      if(line)line.quantity=next;else items.push({productId,quantity:next});
      localStorage.setItem(key(a),JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('techstore:cart-changed',{detail:{accountId:a.maKH,items}}));
    },account,read,key
  };
})();

