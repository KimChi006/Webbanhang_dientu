// Kiểm thử UI gọi API bằng máy chủ giả lập; không thay thế kiểm thử SQL thật.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const S = require('../js/store');
const {applyCommand} = require('../../server/tv3');
let chromium;
try { ({chromium}=require('playwright')); }
catch { ({chromium}=require(path.join(require('node:os').tmpdir(),'electro-admin-qa/node_modules/playwright'))); }
(async()=>{
  const root=path.resolve(__dirname,'../..');
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
    fs.readFile(file,(err,bytes)=>{
      if(err) {res.writeHead(404).end();return;}
      res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'image/jpeg');res.end(bytes);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await chromium.launch({channel:'chrome',headless:true});
    const page=await browser.newPage();
    let db=S.seed(require('../../products')), logged=false, rejectNext=false, disconnectNext=false;
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/**',async route=>{
      const url=new URL(route.request().url()).pathname;
      const data=route.request().postDataJSON();
      let result={},status=200;
      if(url.endsWith('/login')) {
        logged=data.email==='admin@test.vn' && data.matKhau==='Testing123!';
        if(!logged){status=401;result={message:'Sai tài khoản'};}
      } else if(url.endsWith('/logout')) logged=false;
      else if(!logged){status=401;result={message:'Chưa đăng nhập'};}
      else if(url.endsWith('/state')) result=db;
      else if(url.endsWith('/command')) {
        if(disconnectNext){disconnectNext=false;await route.abort('failed');return;}
        if(rejectNext || data.revision!==db.revision){rejectNext=false;status=409;result={message:'Dữ liệu đã thay đổi. Tải lại trang trước khi lưu.'};}
        else {const next=JSON.parse(JSON.stringify(db));applyCommand(next,data);next.revision++;db=next;result=db;}
      }
      await route.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/admin/index.html?source=server`);
    await page.locator('#adminEmail').fill('admin@test.vn');
    await page.locator('#adminPassword').fill('Testing123!');
    await page.locator('#adminLoginForm button[type=submit]').click();
    await page.locator('#adminApp').waitFor({state:'visible'});
    assert.equal(await page.locator('[data-page]').count(),2);
    const action=(name,id)=>page.locator(`[data-action="${name}"]${id===undefined?'':`[data-id="${id}"]`}`).first();
    const save=async()=>{await page.locator('#saveButton').click();await page.locator('#modal').waitFor({state:'hidden'});};
    const filter=async(value)=>{await page.locator('#filter-q').fill(value);await page.locator('[data-filter-form=main] button[type=submit]').click();};
    // Thêm, ảnh upload, kiểm tra ảnh không hợp lệ, prefill, ẩn/hiện, xóa.
    await action('edit-product','').click();
    await page.locator('#f-masp').fill('QA-API');
    await page.locator('#f-name').fill('Điện thoại API');
    await page.locator('#f-company').fill('TechStore');
    await page.locator('#f-categoryId').selectOption('L01');
    await page.locator('#f-description').fill('Mô tả sản phẩm API');
    await page.locator('#f-ram').fill('8GB');
    await page.locator('#imageUpload').setInputFiles({name:'wrong.txt',mimeType:'text/plain',buffer:Buffer.from('text')});
    assert.match(await page.locator('#toast').innerText(),/500 KB/);
    assert.equal(await page.locator('#productImageValue').inputValue(),'');
    await page.locator('#imageUpload').setInputFiles({name:'big.png',mimeType:'image/png',buffer:Buffer.alloc(501*1024)});
    assert.equal(await page.locator('#productImageValue').inputValue(),'');
    await page.locator('#imageUpload').setInputFiles({name:'sample.jpg',mimeType:'image/jpeg',buffer:fs.readFileSync(path.join(root,'images',S.assets[0]))});
    await page.waitForFunction(()=>document.querySelector('#productImageValue').value.startsWith('data:image/jpeg;base64,'));
    await save();
    assert.equal(S.stock(db,'QA-API'),0);
    await filter('QA-API');assert.equal(await page.locator('#pageContent tbody tr').count(),1);
    await action('edit-product','QA-API').click();
    assert.equal(await page.locator('#f-ram').inputValue(),'8GB');
    assert.match(await page.locator('#productImageValue').inputValue(),/^data:image/);
    await page.locator('#closeModal').click();
    await action('toggle-product','QA-API').click();
    await page.waitForFunction(()=>document.querySelector('#pageContent tbody').textContent.includes('Đã ẩn'));
    assert.equal(db.products.find(p=>p.masp==='QA-API').hidden,true);
    await action('toggle-product','QA-API').click();
    await page.waitForFunction(()=>document.querySelector('#pageContent tbody').textContent.includes('Đang hiển thị'));
    await action('delete-product','QA-API').click();await save();
    assert.equal(db.products.some(p=>p.masp==='QA-API'),false);
    await filter('');
    console.log('PASS API UI: add/upload/prefill/filter/hide/show/delete unused product; reject invalid and oversized images.');
    // Tạo phiếu 2 dòng, bỏ dòng, tính tiền, sửa nháp, tìm kiếm và lọc.
    await page.locator('[data-page=imports]').click();
    await action('edit-receipt','').click();
    await page.locator('#f-note').fill('QA phiếu API');
    await page.locator('[name=lineProduct]').selectOption(db.products[0].masp);
    await page.locator('[name=lineQuantity]').fill('2');
    await page.locator('[name=lineCost]').fill('100000');
    await action('add-line').click();
    await page.locator('[name=lineProduct]').nth(1).selectOption(db.products[1].masp);
    await page.locator('[name=lineQuantity]').nth(1).fill('3');
    await page.locator('[name=lineCost]').nth(1).fill('200000');
    assert.match(await page.locator('#receiptTotal').innerText(),/800\.000/);
    await action('add-line').click();
    await page.locator('[data-action=remove-line]').last().click();
    assert.equal(await page.locator('.receipt-line').count(),2);
    const stockBefore=S.stock(db,db.products[0].masp);
    await save();
    const created=db.imports.find(r=>r.note==='QA phiếu API');
    assert.equal(created.items.length,2);assert.equal(S.stock(db,db.products[0].masp),stockBefore);
    await action('edit-receipt',created.id).click();
    assert.equal(await page.locator('[name=lineQuantity]').first().inputValue(),'2');
    await page.locator('[name=lineQuantity]').first().fill('4');await save();
    assert.equal(db.imports.find(r=>r.id===created.id).items[0].quantity,4);
    for(const search of [created.id,'QA phiếu API',db.products[0].name,db.products[0].masp]) {
      await filter(search);assert.ok(await action('view-receipt',created.id).count());
    }
    await page.locator('#filter-status').selectOption('completed');await filter(created.id);
    assert.equal(await page.locator(`[data-action=view-receipt][data-id="${created.id}"]`).count(),0);
    await page.locator('#filter-status').selectOption('draft');
    await page.locator('#filter-from').fill(created.at.slice(0,10));
    await page.locator('#filter-to').fill(created.at.slice(0,10));await filter(created.id);
    assert.equal(await page.locator(`[data-action=view-receipt][data-id="${created.id}"]`).count(),1);
    await page.locator('#filter-from').fill('2099-01-01');await filter(created.id);
    assert.match(await page.locator('#pageContent .message').innerText(),/Ngày bắt đầu phải trước hoặc bằng ngày kết thúc/);
    await page.reload();await page.locator('#adminApp').waitFor({state:'visible'});
    assert.ok(db.imports.some(r=>r.id===created.id));
    console.log('PASS API UI: multi-line draft, remove line, total, edit, search code/name/note, date/status filters, reload.');
    const id=db.products[0].masp;
    await page.locator(`[data-action="edit-product"][data-id="${id}"]`).click();
    await page.locator('[name=name]').fill('Sản phẩm SQL đã sửa');
    await page.locator('#saveButton').click();
    await page.locator('#modal').waitFor({state:'hidden'});
    assert.equal(db.products[0].name,'Sản phẩm SQL đã sửa');
    await page.locator('[data-page=imports]').click();
    const receipt=db.imports.find(r=>r.status==='draft');
    await page.locator(`[data-action="complete-receipt"][data-id="${receipt.id}"]`).click();
    await page.locator('#saveButton').click();
    await page.locator('#modal').waitFor({state:'hidden'});
    assert.equal(db.imports.find(r=>r.id===receipt.id).status,'completed');
    assert.equal(await page.locator(`[data-action="complete-receipt"][data-id="${receipt.id}"]`).count(),0);
    await page.locator('[data-page=products]').click();
    await page.locator(`[data-action="edit-product"][data-id="${id}"]`).click();
    await page.locator('[name=name]').fill('Không được lưu');rejectNext=true;
    await page.locator('#saveButton').click();
    await page.waitForFunction(()=>document.querySelector('#formMessage').textContent.includes('Tải lại'));
    assert.equal(db.products[0].name,'Sản phẩm SQL đã sửa');
    assert.equal(await page.locator('#saveButton').isEnabled(),true);
    disconnectNext=true;
    await page.locator('#saveButton').click();
    await page.waitForFunction(()=>document.querySelector('#formMessage').textContent.includes('fetch'));
    assert.equal(db.products[0].name,'Sản phẩm SQL đã sửa');
    assert.equal(await page.locator('#saveButton').isEnabled(),true);
    await page.locator('#closeModal').click();
    await page.locator('#logoutButton').click();
    await page.locator('#loginScreen').waitFor({state:'visible'});
    assert.equal(logged,false);assert.deepEqual(errors,[]);
    console.log('PASS UI server mode: login, edit, complete receipt, conflict feedback, logout (mock API).');
  } finally {if(browser) await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
