const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
for(const file of ['index.html','san-pham.html','chi_tiet_sp.html','don-hang.html']){
 const html=fs.readFileSync(path.join(root,file),'utf8');let n=0;
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  const src=m[1].match(/src="([^"]+)"/);
  if(src){if(!fs.existsSync(path.join(root,src[1])))throw Error('Thiếu '+src[1]);}
  else {new vm.Script(m[2],{filename:file+':inline:'+n++});}
 }
 console.log('PASS HTML scripts: '+file);
}
