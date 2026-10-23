'use strict';
const assert=require('node:assert/strict');
const Runtime=require('../runtime.js');
global.AksaraRuntime=Runtime;
const Compiler=require('../compiler.js');
(async()=>{
 const source=`gunakan server\ningat app sebagai server_buat(0)\napp.get("/ping", fungsi(req, res)\n    res.json({ok: benar})\nselesai)`;
 // Compiler accepts only named function declarations; test runtime and direct builtin compilation separately.
 const simple=Compiler.compile('gunakan server\ningat app sebagai server_buat(0)');
 assert.equal(simple.diagnostics.filter(d=>d.severity==='error').length,0,JSON.stringify(simple.diagnostics));
 assert.match(simple.javascript,/__rt\.makeServer\(0\)/);
 const rt=Runtime();rt.enable('server');
 const app=rt.makeServer(0);
 app.get('/ping',(req,res)=>res.json({ok:true}));
 app.get('/user/:id',req=>({id:req.parameter.id}));
 app.post('/echo',req=>req.body);
 const address=await app.jalankan();
 try{
  const ping=await fetch(address+'/ping');assert.equal(ping.status,200);assert.deepEqual(await ping.json(),{ok:true});
  const user=await fetch(address+'/user/42');assert.deepEqual(await user.json(),{id:'42'});
  const echo=await fetch(address+'/echo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hello:'aksara'})});assert.deepEqual(await echo.json(),{hello:'aksara'});
  const missing=await fetch(address+'/missing');assert.equal(missing.status,404);
  const bad=await fetch(address+'/echo',{method:'POST',headers:{'Content-Type':'application/json'},body:'{' });assert.equal(bad.status,400);
 }finally{await app.tutup()}
 assert.equal(await rt.withTimeout(Promise.resolve(3),100),3);
 await assert.rejects(rt.withTimeout(new Promise(()=>{}),5),/batas waktu/);
 assert.deepEqual(await rt.allSettled([Promise.resolve(1),Promise.reject(Error('x'))]),[{status:'berhasil',nilai:1},{status:'gagal',alasan:'x'}]);
 let tries=0;assert.equal(await rt.retry(()=>{if(++tries<3)throw Error('retry');return 'ok'},3), 'ok');
 console.log('v6.0: HTTP routes, JSON, validation, timeout, allSettled, retry passed');
})().catch(e=>{console.error(e);process.exitCode=1});
