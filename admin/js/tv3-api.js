/* Thêm ?source=server vào URL admin để dùng SQL. Mở file HTML vẫn dùng offline. */
(function () {
  const enabled = location.protocol !== 'file:' && new URLSearchParams(location.search).get('source') === 'server';
  async function call(url, body) {
    const response = await fetch(url, { method:body ? 'POST':'GET', credentials:'same-origin',
      headers:body ? {'Content-Type':'application/json'} : {}, body:body ? JSON.stringify(body) : undefined });
    const result = await response.json();
    if(!response.ok) throw Error(result.message || 'Không thể kết nối máy chủ.');
    return result;
  }
  window.TV3 = { enabled, call,
    async commit(before, operation) {
      const next = JSON.parse(JSON.stringify(before));
      operation(next);
      let command;
      const changedReceipt = next.imports.find(r=>JSON.stringify(r)!==JSON.stringify(before.imports.find(x=>x.id===r.id)));
      const changedProduct = next.products.find(p=>JSON.stringify(p)!==JSON.stringify(before.products.find(x=>x.masp===p.masp)));
      const removed = before.products.find(p=>!next.products.some(x=>x.masp===p.masp));
      if(changedReceipt) {
        const old=before.imports.find(r=>r.id===changedReceipt.id);
        command=old && changedReceipt.status==='completed' ? {type:'completeReceipt',id:old.id} : {type:'saveReceipt',id:old?.id,input:changedReceipt};
      } else if(changedProduct) {
        const old=before.products.find(p=>p.masp===changedProduct.masp);
        command=old && old.hidden!==changedProduct.hidden ? {type:'toggleProduct',id:old.masp} : {type:'saveProduct',id:old?.masp,input:changedProduct};
      } else if(removed) command={type:'deleteProduct',id:removed.masp};
      else throw Error('Thao tác này chưa kết nối SQL trong phạm vi TV3.');
      return call('/api/admin/tv3/command',{...command,revision:before.revision});
    }
  };
})();
