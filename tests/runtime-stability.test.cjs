'use strict';
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const Runtime=require('../runtime.js');
(async()=>{
 const budget=Runtime();
 for(let i=0;i<50000;i++)budget.tick(1);
 assert.throws(()=>budget.tick(1),/50000/);
 await new Promise(resolve=>setTimeout(resolve,10));
 assert.doesNotThrow(()=>budget.tick(1),'Lifetime instruction counter permanently disabled the runtime');
 const rt=Runtime();rt.enable('server');const app=rt.makeServer(0);
 app.keamanan({bodyLimit:16,timeout:60});
 app.get('/item/:id',req=>req.parameter.id);
 app.get('/item/new',()=> 'static');
 app.post('/echo',req=>req.body);
 let sideEffects=0;
 app.pakai(async req=>{if(req.jalur==='/late')await new Promise(resolve=>setTimeout(resolve,150))});
 app.get('/late',()=>{sideEffects++;return 'too late'});
 const url=await app.jalankan();
 try{
  assert.equal(await (await fetch(url+'/item/new')).text(),'static');
  assert.equal((await fetch(url+'/%ZZ')).status,400);
  const oversized=await new Promise((resolve,reject)=>{
   const req=http.request(url+'/echo',{method:'POST',headers:{'Content-Type':'text/plain','Transfer-Encoding':'chunked'}},res=>{res.resume();res.once('end',()=>resolve(res.statusCode))});
   req.once('error',reject);req.write('0123456789');req.end('0123456789');
  });
  assert.equal(oversized,413);
  assert.equal((await fetch(url+'/late')).status,408);
  await new Promise(resolve=>setTimeout(resolve,200));
  assert.equal(sideEffects,0,'Timed-out middleware still executed the route');
  assert.equal((await fetch(url+'/item/42')).status,200);
 }finally{await app.tutup()}
 const originalFetch=global.fetch,originalTimeout=global.setTimeout;
 try{
  global.setTimeout=(fn,ms,...args)=>originalTimeout(fn,ms===8000?20:ms,...args);
  global.fetch=async(_url,{signal})=>({ok:true,json:()=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('body aborted')),{once:true})),text:()=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('body aborted')),{once:true}))});
  const network=Runtime();network.enable('jaringan');
  for(const request of [()=>network.fetchJSON('http://localhost/'),()=>network.fetchText('http://localhost/'),()=>network.postJSON('http://localhost/',{})]){
   let deadline;
   try{await assert.rejects(Promise.race([request(),new Promise((_,reject)=>deadline=originalTimeout(()=>reject(Error('timeout did not protect response body')),300))]),/body aborted/)}finally{clearTimeout(deadline)}
  }
 }finally{global.fetch=originalFetch;global.setTimeout=originalTimeout}
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'aksara-db-stable-')),old=process.cwd();
 try{
  process.chdir(temp);const dbRuntime=Runtime();dbRuntime.enable('database');const db=dbRuntime.openDatabase('test.db');
  try{
   db.jalankan('CREATE TABLE t (x INTEGER)');
   let called=false;
   assert.throws(()=>db.transaksi(async()=>{called=true;db.jalankan('INSERT INTO t VALUES (1)')}),/async|sinkron/);
   assert.equal(called,false,'Async transaction ran before being rejected');
   assert.throws(()=>db.transaksi(()=>db.tutup()),/transaksi/i);
   db.transaksi(()=>db.jalankan('INSERT INTO t VALUES (2)'));
   assert.equal(db.satu('SELECT COUNT(*) AS n FROM t').n,1);
  }finally{db.tutup()}
 }finally{process.chdir(old);fs.rmSync(temp,{recursive:true,force:true})}
 console.log('Runtime stability: static routes, malformed URLs, chunked body limit, late middleware, network body timeout and transaction guards passed');
})().catch(error=>{console.error(error);process.exitCode=1});
