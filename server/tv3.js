// TV3: dùng chung quy tắc kiểm tra với bản HTML offline.
const S = require('../admin/js/store');
const clone = value => JSON.parse(JSON.stringify(value));
const fields = { screen:'ManHinh', os:'HeDieuHanh', camara:'CameraSau', camaraFront:'CameraTruoc', cpu:'CPU', ram:'RAM', rom:'ROM', microUSB:'TheNho', battery:'Pin' };
function applyCommand(db, command) {
  const { type, id, input } = command;
  switch (type) {
    case 'saveProduct': S.saveProduct(db, input, id); break;
    case 'deleteProduct': S.deleteProduct(db, id); break;
    case 'toggleProduct': {
      const p = db.products.find(p => p.masp === id);
      if (!p) throw Error('Không tìm thấy sản phẩm.');
      p.hidden = !p.hidden; break;
    }
    case 'saveReceipt': S.saveReceipt(db, input, id); break;
    case 'completeReceipt': S.completeReceipt(db, id); break;
    default: throw Error('Thao tác không hợp lệ.');
  }
}
module.exports = function register(app, sql, getPool, requireAdmin) {
  const request = tx => tx ? new sql.Request(tx) : getPool().request();
  async function state(tx) {
    const result = await request(tx).query(`
      SELECT s.*, m.DuLieu FROM dbo.SanPham s LEFT JOIN dbo.TV3SanPham m ON s.MaSP=m.MaSP;
      SELECT DuLieu FROM dbo.PhieuNhap;
      SELECT * FROM dbo.NhatKyNhap;
      SELECT Revision FROM dbo.TV3Revision WHERE Id=1;`);
    const db = S.seed([]);
    db.revision = result.recordsets[3][0].Revision;
    db.products = result.recordsets[0].map(r => {
      const extra = r.DuLieu ? JSON.parse(r.DuLieu) : {};
      return { ...extra, masp:r.MaSP, name:r.TenSanPham, company:r.Hang,
        img: r.HinhAnh?.startsWith('images/') ? '../'+r.HinhAnh : r.HinhAnh || '',
        price:Number(r.Gia), hidden:r.TrangThai !== 'ACTIVE', categoryId:extra.categoryId || (/ipad/i.test(r.TenSanPham)?'L02':'L01'),
        description:extra.description || r.TenSanPham, threshold:extra.threshold ?? 5,
        profitRate:null, detail:Object.fromEntries(Object.entries(fields).map(([k,c])=>[k,r[c] || ''])),
        promo:{name:r.LoaiKhuyenMai || '',value:r.GiaTriKhuyenMai || ''}, star:r.SoSao, rateCount:r.SoLuotDanhGia };
    });
    db.imports = result.recordsets[1].map(r=>JSON.parse(r.DuLieu)).sort((a,b)=>b.at.localeCompare(a.at));
    db.ledger = result.recordsets[2].map(r=>({id:r.MaPhieu+'-'+r.MaSP,reference:r.MaPhieu,productId:r.MaSP,at:r.NgayNhap,quantity:r.SoLuong,cost:Number(r.GiaNhap),kind:'import'}));
    // Tồn trước tích hợp: giữ nguyên lượng SQL, không giả định giá vốn bằng giá bán.
    for (const row of result.recordsets[0]) {
      const imported = db.ledger.filter(e=>e.productId===row.MaSP).reduce((n,e)=>n+e.quantity,0);
      if(row.SoLuongTon-imported !== 0) db.ledger.unshift({id:'OPEN-'+row.MaSP,productId:row.MaSP,at:'1970-01-01T00:00',quantity:row.SoLuongTon-imported,cost:0,kind:'opening',reference:'Số dư trước tích hợp'});
    }
    db.customers=[]; db.orders=[];
    return db;
  }
  app.get('/api/admin/tv3/state',requireAdmin,async(req,res)=>{
    try { res.json(await state()); } catch(e) { console.error(e.message); res.status(500).json({message:'Không tải được dữ liệu TV3. Kiểm tra migration SQL.'}); }
  });
  app.post('/api/admin/tv3/command',requireAdmin,async(req,res)=>{
    let tx;
    try {
      tx=new sql.Transaction(getPool()); await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
      await request(tx).query(`DECLARE @lock INT; EXEC @lock=sp_getapplock @Resource='TV3-write',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @lock<0 THROW 50001,'Busy',1;`);
      const before=await state(tx), next=clone(before);
      if(req.body.revision!==before.revision) { const e=Error('Dữ liệu đã thay đổi. Tải lại trang trước khi lưu.'); e.status=409; throw e; }
      try { applyCommand(next,req.body); } catch(e) { e.status=400; throw e; }
      for(const p of next.products) {
        const old=before.products.find(x=>x.masp===p.masp);
        if(JSON.stringify(old)===JSON.stringify(p)) continue;
        const q=request(tx).input('code',sql.VarChar(30),p.masp).input('name',sql.NVarChar(200),p.name)
          .input('brand',sql.NVarChar(100),p.company).input('image',sql.NVarChar(sql.MAX),p.img.replace(/^\.\.\//,''))
          .input('status',sql.VarChar(20),p.hidden?'HIDDEN':'ACTIVE').input('data',sql.NVarChar(sql.MAX),JSON.stringify(p));
        for(const [k,c] of Object.entries(fields)) q.input(c,sql.NVarChar(300),p.detail[k] || '');
        await q.query(`
          IF NOT EXISTS(SELECT 1 FROM dbo.SanPham WHERE MaSP=@code)
            INSERT dbo.SanPham(MaSP,TenSanPham,Hang,HinhAnh,Gia,SoLuongTon) VALUES(@code,@name,@brand,@image,0,0);
          UPDATE dbo.SanPham SET TenSanPham=@name,Hang=@brand,HinhAnh=@image,TrangThai=@status,
            ${Object.values(fields).map(c=>c+'=@'+c).join(',')} WHERE MaSP=@code;
          IF EXISTS(SELECT 1 FROM dbo.TV3SanPham WHERE MaSP=@code) UPDATE dbo.TV3SanPham SET DuLieu=@data WHERE MaSP=@code;
          ELSE INSERT dbo.TV3SanPham VALUES(@code,@data);`);
      }
      for(const p of before.products.filter(p=>!next.products.some(n=>n.masp===p.masp))) {
        await request(tx).input('code',sql.VarChar(30),p.masp).query('DELETE dbo.TV3SanPham WHERE MaSP=@code; DELETE dbo.SanPham WHERE MaSP=@code;');
      }
      for(const r of next.imports) {
        if(JSON.stringify(r)===JSON.stringify(before.imports.find(x=>x.id===r.id))) continue;
        await request(tx).input('id',sql.VarChar(50),r.id).input('data',sql.NVarChar(sql.MAX),JSON.stringify(r)).query(`
          IF EXISTS(SELECT 1 FROM dbo.PhieuNhap WHERE MaPhieu=@id) UPDATE dbo.PhieuNhap SET DuLieu=@data WHERE MaPhieu=@id;
          ELSE INSERT dbo.PhieuNhap VALUES(@id,@data);`);
      }
      for(const e of next.ledger.filter(e=>!before.ledger.some(x=>x.id===e.id))) {
        await request(tx).input('id',sql.VarChar(50),e.reference).input('code',sql.VarChar(30),e.productId)
          .input('at',sql.VarChar(16),e.at).input('qty',sql.Int,e.quantity).input('cost',sql.Decimal(18,0),e.cost)
          .query(`INSERT dbo.NhatKyNhap VALUES(@id,@code,@at,@qty,@cost);
            UPDATE dbo.SanPham SET SoLuongTon=SoLuongTon+@qty WHERE MaSP=@code;`);
      }
      await request(tx).query('UPDATE dbo.TV3Revision SET Revision=Revision+1 WHERE Id=1');
      const saved=await state(tx); await tx.commit(); tx=null; res.json(saved);
    } catch(e) {
      if(tx) { try { await tx.rollback(); } catch {} }
      console.error(e.message);
      res.status(e.status || 500).json({message:e.status ? e.message : 'Không lưu được dữ liệu. Kiểm tra SQL và tải lại trang.'});
    }
  });
};
module.exports.applyCommand=applyCommand;
