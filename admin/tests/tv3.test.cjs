const assert = require('node:assert/strict');
const S = require('../js/store');
const { applyCommand } = require('../../server/tv3');
const db = S.seed([]);
const input = {masp:'TV3_TEST',name:'Điện thoại thử',company:'TechStore',categoryId:'L01',description:'Mô tả thử',img:'../images/'+S.assets[0],threshold:5,detail:{ram:'8GB',rom:'256GB'}};
applyCommand(db,{type:'saveProduct',input});
assert.equal(db.products[0].detail.ram,'8GB');
assert.throws(()=>applyCommand(db,{type:'saveProduct',input}),/tồn tại/);
applyCommand(db,{type:'saveProduct',id:input.masp,input:{...input,name:'Tên mới'}});
assert.equal(db.products[0].name,'Tên mới');
assert.throws(()=>applyCommand(db,{type:'saveProduct',id:input.masp,input:{...input,detail:{ram:'x'.repeat(101)}}}),/Thông số/);
applyCommand(db,{type:'toggleProduct',id:input.masp});
assert.equal(db.products[0].hidden,true);
const receipt={at:S.now(),note:'Thử nhiều dòng',items:[{productId:input.masp,quantity:3,cost:1000000}]};
applyCommand(db,{type:'saveReceipt',input:receipt});
const id=db.imports[0].id;
assert.equal(S.stock(db,input.masp),0);
applyCommand(db,{type:'saveReceipt',id,input:{...receipt,items:[{productId:input.masp,quantity:4,cost:1500000}]}});
applyCommand(db,{type:'completeReceipt',id});
assert.equal(S.stock(db,input.masp),4);
assert.equal(S.cost(db,input.masp),1500000);
assert.throws(()=>applyCommand(db,{type:'completeReceipt',id}),/hai lần/);
assert.throws(()=>applyCommand(db,{type:'saveReceipt',id,input:receipt}),/Chỉ sửa/);
assert.throws(()=>applyCommand(db,{type:'deleteProduct',id:input.masp}),/lịch sử/);
assert.throws(()=>applyCommand(db,{type:'saveReceipt',input:{...receipt,items:[{productId:input.masp,quantity:1000000,cost:1000000000000}]}}),/chính xác/);
assert.throws(()=>applyCommand(db,{type:'anything'}),/không hợp lệ/);
console.log('PASS TV3: sản phẩm, thông số, phiếu nháp, hoàn thành đúng một lần, bảo vệ lịch sử, giới hạn tổng tiền.');

// Mỗi ca chạy trên bản sao, bảo đảm dữ liệu đang lưu không bị thay đổi khi lỗi.
let rejected = 0;
function reject(command) {
  const snapshot = JSON.stringify(db);
  assert.throws(()=>applyCommand(JSON.parse(snapshot),command));
  assert.equal(JSON.stringify(db),snapshot);
  rejected++;
}
for(const change of [
  {masp:''},{masp:'mã có dấu'},{masp:'X'.repeat(31)},
  {masp:input.masp.toLowerCase()},
  {name:''},{name:'x'.repeat(201)}, {company:''},{company:'x'.repeat(101)},
  {categoryId:'MISSING'}, {description:''},{description:'x'.repeat(3001)},
  {img:''},{img:'https://example.com/x.jpg'},{img:'javascript:alert(1)'},
  {threshold:-1},{threshold:1.5},{threshold:1000001},
  {detail:{os:'x'.repeat(201)}},{detail:{screen:'x'.repeat(301)}},
  {detail:{ram:12}},
]) reject({type:'saveProduct',input:{...input,masp:'QA-INVALID',...change}});
reject({type:'saveProduct',id:input.masp,input:{...input,masp:'CHANGE-CODE'}});
reject({type:'saveProduct',id:'MISSING',input:{...input,masp:'MISSING'}});
reject({type:'toggleProduct',id:'MISSING'});
for(const items of [
  [], null, [{productId:'MISSING',quantity:1,cost:1}],
  [receipt.items[0],receipt.items[0]],
  ...[0,-1,1.5,1000001,'',null,'abc'].map(quantity=>[{...receipt.items[0],quantity}]),
  ...[0,-1,1.5,1000000000001,'',null,'abc'].map(cost=>[{...receipt.items[0],cost}]),
]) reject({type:'saveReceipt',input:{...receipt,items}});
for(const at of ['', 'invalid', '2026-02-30T12:00','2099-01-01T00:00'])
  reject({type:'saveReceipt',input:{...receipt,at}});
reject({type:'saveReceipt',id:'MISSING',input:receipt});
reject({type:'completeReceipt',id:'MISSING'});
console.log(`PASS ${rejected} ca dữ liệu sai/không tồn tại; bản lưu không đổi.`);
