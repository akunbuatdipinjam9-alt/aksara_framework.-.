'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');
global.AksaraRuntime=require('../runtime.js');
const compiler=require('../compiler.js');
const source=fs.readFileSync(path.join(__dirname,'../examples/secure-api-v61.aks'),'utf8').replace('server_buat(3000)','server_buat(0)');
const result=compiler.compile(source,{strict:true});
assert.deepEqual(result.diagnostics.filter(d=>d.severity==='error'),[],JSON.stringify(result.diagnostics));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'aksara-fullstack-'));
const program=path.join(temp,'program.cjs');
fs.writeFileSync(program,result.javascript);
const child=spawn(process.execPath,[program],{cwd:temp,stdio:['ignore','pipe','pipe']});
(async()=>{
 let output='',errors='';child.stderr.on('data',c=>{errors+=String(c)});
 try{
   const address=await new Promise((resolve,reject)=>{
     const timer=setTimeout(()=>reject(Error('Server startup timed out: '+output+' '+errors)),7000);
     child.stdout.on('data',chunk=>{output+=String(chunk);const m=output.match(/API tugas aktif di (http:\/\/127\.0\.0\.1:\d+)/);if(m){clearTimeout(timer);resolve(m[1])}});
     child.once('exit',code=>{clearTimeout(timer);reject(Error('Server exited: '+code+' '+errors))});
   });
   let response=await fetch(address+'/api/tugas');assert.equal(response.status,200);assert.deepEqual(await response.json(),[]);
   response=await fetch(address+'/api/tugas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:'Belajar Aksara'})});
   assert.equal(response.status,201);assert.equal((await response.json()).berhasil,true);
   response=await fetch(address+'/api/tugas');assert.equal(response.status,200);
   let rows=await response.json();assert.equal(rows.length,1);assert.equal(rows[0].judul,'Belajar Aksara');
   // SQL injection strings remain values, not executable SQL.
   const payload='a\'); DROP TABLE tugas;--';
   response=await fetch(address+'/api/tugas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:payload})});assert.equal(response.status,201);
   response=await fetch(address+'/api/tugas');rows=await response.json();assert.equal(rows[0].judul,payload);assert.equal(rows.length,2);
   response=await fetch(address+'/api/tugas',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(response.status,400);
   response=await fetch(address+'/api/tugas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:'a'.repeat(130)})});assert.equal(response.status,400);
   response=await fetch(address+'/api/tugas',{method:'POST',body:'A'.repeat(8200)});assert.equal(response.status,413);
   response=await fetch(address+'/api/tugas',{headers:{Origin:'http://other.example'}});assert.equal(response.status,403);
   response=await fetch(address+'/api/tugas',{headers:{Origin:'http://localhost:4173'}});assert.equal(response.status,200);assert.equal(response.headers.get('access-control-allow-origin'),'http://localhost:4173');
   assert.equal(response.headers.get('x-content-type-options'),'nosniff');
   assert.equal(response.headers.get('x-frame-options'),'DENY');
   console.log('v6.1 fullstack: compiled .aks server, SQLite persistence, prepared SQL, validation, limits, CORS and headers passed');
 }finally{
   child.kill('SIGTERM');
   await new Promise(resolve=>{if(child.exitCode!==null||child.signalCode!==null)resolve();else{child.once('exit',resolve);setTimeout(()=>{child.kill('SIGKILL');resolve()},1000).unref()}});
   if(fs.existsSync(path.join(temp,'tugas.db'))){const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(path.join(temp,'tugas.db'));assert.equal(db.prepare('SELECT COUNT(*) AS jumlah FROM tugas').get().jumlah,2);db.close()}
   fs.rmSync(temp,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exitCode=1});
