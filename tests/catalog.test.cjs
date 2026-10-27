const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.join(__dirname,'..');
function setup(search=''){
 const memory=new Map(),events={},nodes={},forms=[];
 const element=()=>({style:{},innerHTML:'',textContent:'',className:'',elements:Object.fromEntries(['q','category','min','max'].map(k=>[k,{value:'',innerHTML:'',addEventListener(k,f){this[k]=f;}}])),requestSubmit(){this.submit?.({preventDefault(){}});},setAttribute(){},before(){},append(){},prepend(){},addEventListener(k,f){this[k]=f;},scrollIntoView(){}});
 const root=element(),grid=element();root.querySelector=()=>grid;
 const document={querySelector:s=>s==='.products-section'?root:s==='.hero'? (nodes.hero ||=element()):null,createElement:()=>{const e=element();forms.push(e);return e;},getElementById:id=>id==='productList'?grid:(nodes[id] ||=element()),addEventListener(){}};
 const context=vm.createContext({console,URLSearchParams,location:{search,protocol:'http:'},history:{pushState(){}},document,localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},window:{addEventListener:(k,f)=>events[k]=f,dispatchEvent(){}},CustomEvent:function(t,o){this.detail=o.detail;}});
 for(const p of ['products.js','admin/js/store.js','js/catalog.js'])vm.runInContext(fs.readFileSync(path.join(base,p),'utf8'),context);
 events.pageshow();return{context,events,grid,nodes,memory,forms};
}
let a=setup();assert.equal((a.grid.innerHTML.match(/<article/g)||[]).length,8);assert.match(a.nodes.productCount.textContent,/20 sản phẩm/);
a=setup();a.forms[0].elements.category.value='L01';a.forms[0].elements.category.change();assert.match(a.nodes.productCount.textContent,/19 sản phẩm/);assert.doesNotMatch(a.grid.innerHTML,/iPad/);
a=setup('?q=Samsung&category=L01&min=3000000&max=10000000&page=2');assert.match(a.grid.innerHTML,/SamSung|Samsung/);assert.doesNotMatch(a.grid.innerHTML,/Oppo|Xiaomi/);
a=setup('?min=9000000&max=100');assert.match(a.nodes.filterError.textContent,/không hợp lệ/);assert.doesNotMatch(a.grid.innerHTML,/<article/);
a=setup('?q=khong-có-san-pham');assert.match(a.grid.innerHTML,/Không tìm thấy/);
a=setup('?page=999');assert.match(a.nodes.productCount.textContent,/Trang 3\/3/);assert.equal((a.grid.innerHTML.match(/<article/g)||[]).length,4);
a=setup();const S=a.context.window.TechStore;let db=S.load(a.context.list_products);db=S.transact(db,d=>{d.categories.find(c=>c.id==='L01').hidden=true;});a.events.pageshow();assert.match(a.nodes.productCount.textContent,/1 sản phẩm/);
a=setup('?id=Sam0');assert.match(a.nodes.productDetailPage.innerHTML,/SamSung Galaxy J4/);assert.match(a.nodes.productDetailPage.innerHTML,/Thông số kỹ thuật/);
a=setup('?id=invalid');assert.match(a.nodes.productDetailPage.innerHTML,/không tồn tại/);
(async()=>{
 a=setup();let role='CUSTOMER',id=1;
 a.context.fetch=async(url)=>({ok:true,json:async()=>url==='/api/me'?({account:{maKH:id,vaiTro:role}}):({products:[{maSP:'Sam0',tenSanPham:'SamSung Galaxy J4+',gia:3490000,soLuongTon:10,hinhAnh:'images/samsung-galaxy-j4-plus-pink-400x400.jpg',trangThai:'ACTIVE'}]})});
 vm.runInContext(fs.readFileSync(path.join(base,'js/cart-bridge.js'),'utf8'),a.context);
 const C=a.context.window.TechStoreCart;
 await C.add({productId:'Sam0',quantity:1});assert.equal(C.read({maKH:1})[0].quantity,1);
 id=2;assert.equal(C.read({maKH:2}).length,0);
 role='ADMIN';await assert.rejects(C.add({productId:'Sam0',quantity:1}),/đăng nhập/);
 role='CUSTOMER';await assert.rejects(C.add({productId:'Sam0',quantity:999999}),/tồn kho/);
 let local=setup();
 local.context.window.location={protocol:'file:'};
 local.context.window.TechStoreDemo={localMode:true,getAccount:()=>({maKH:'LOCAL-1',vaiTro:'CUSTOMER'}),accountId:a=>String(a?.maKH||'')};
 vm.runInContext(fs.readFileSync(path.join(base,'js/cart-bridge.js'),'utf8'),local.context);
 await local.context.window.TechStoreCart.add({productId:'Sam0',quantity:1});
 assert.equal(local.context.window.TechStoreCart.read({maKH:'LOCAL-1'})[0].name,'SamSung Galaxy J4+');
 console.log('PASS: phân trang, lọc kết hợp, giá sai, rỗng, loại ẩn, chi tiết, giỏ riêng tài khoản, quyền khách hàng, kiểm tra tồn kho và chế độ file://.');
})().catch(e=>{console.error(e);process.exitCode=1;});
