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
  async function products(){
    const r=await fetch('/api/products',{credentials:'same-origin'});
    const data=r.ok?await r.json():{};
    if(!r.ok || !Array.isArray(data.products)) throw Error('Không thể kiểm tra sản phẩm và tồn kho từ database.');
    return data.products;
  }
  const key=a=>'techstore_cart_v1:'+a.maKH;
  function read(a){const v=JSON.parse(localStorage.getItem(key(a))||'[]'); if(!Array.isArray(v))throw Error('Dữ liệu giỏ hàng không hợp lệ.');return v;}
  window.TechStoreCart=window.TechStoreCart||{
    async add({productId,quantity}){
      const a=await account(), catalog=await products();
      const p=catalog.find(p=>p.maSP===productId);
      if(!p || Number(p.gia)<=0)throw Error('Sản phẩm không còn khả dụng.');
      const items=read(a),line=items.find(i=>i.productId===productId),next=(line?.quantity||0)+quantity;
      if(!Number.isSafeInteger(next)||next<1||next>Number(p.soLuongTon))throw Error('Số lượng trong giỏ vượt quá tồn kho trong database.');
      if(line)line.quantity=next;else items.push({productId,quantity:next});
      localStorage.setItem(key(a),JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('techstore:cart-changed',{detail:{accountId:a.maKH,items}}));
    },account,read,key,products
  };
})();

