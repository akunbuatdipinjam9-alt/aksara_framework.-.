'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const http=require('node:http');
const {spawnSync}=require('node:child_process');
const Runtime=require('../runtime.js');
global.AksaraRuntime=Runtime;
const Compiler=require('../compiler.js');
const cli=path.resolve(__dirname,'../cli.js');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'aksara-v7-'));
let checks=0;
function check(condition,message){assert.ok(condition,message);checks++}
function cmd(mode,file,extra=[]){return spawnSync(process.execPath,[cli,mode,file,...extra],{cwd:temp,encoding:'utf8',timeout:20000})}
function run(code,expected,status=0){const file=path.join(temp,'run.aks');fs.writeFileSync(file,code);const result=cmd('run',file);assert.equal(result.status,status,`STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);if(expected)assert.match(result.stdout,expected);checks++;return result}
(async()=>{
 const cwd=process.cwd();let server;
 try{
  check(Compiler.version==='7.0.0-beta.1','Version should be v7 beta');
  const src='uji "matematika"\n    pastikan(2+2==4,"salah")\nselesai\n';
  const compiled=Compiler.compile(src,{strict:true});check(Boolean(compiled.javascript),'uji compiles');
  check(!compiled.diagnostics.some(x=>x.severity==='error'),'uji has no semantic errors');
  run(src,/1 lolos, 0 gagal/);
  run('uji "gagal"\n    pastikan(salah,"expected failure")\nselesai\nuji "lanjut"\n    pastikan(benar)\nselesai',/1 lolos, 1 gagal/,1);
  const nested=Compiler.compile('fungsi f()\n    uji "tidak boleh"\n        pastikan(benar)\n    selesai\nselesai');
  check(nested.javascript===null&&nested.diagnostics.some(x=>/uji hanya boleh/.test(x.message)),'test scope validation');
  fs.writeFileSync(path.join(temp,'hello.txt'),'Halo Aksara');
  run('teks = tunggu baca_file("hello.txt")\ntampilkan teks',/Halo Aksara/);
  run('tunggu simpan_file("baru.txt", "Bahasa Indonesia")\ntampilkan tunggu baca_file("baru.txt")',/Bahasa Indonesia/);
  check(fs.readFileSync(path.join(temp,'baru.txt'),'utf8')==='Bahasa Indonesia','writeTextFile persists');
  run('file = tunggu daftar_file(".")\ntampilkan panjang(file)',/\d+/);
  run('daftar = ["a","b","a","c","a"]\ntampilkan frekuensi(daftar).a',/3/);
  run('daftar = [{jenis:"a",nilai:1},{jenis:"b",nilai:2},{jenis:"a",nilai:3}]\nhasil = kelompokkan(daftar,"jenis")\ntampilkan panjang(hasil.a)',/2/);
  run('tampilkan baca_env("AKSARA_V7_NOT_SET", "cadangan")',/cadangan/);
  run('fungsi asinkron dobel(x)\n    tunggu jeda(10)\n    kembalikan x*2\nselesai\nhasil = tunggu kerjakan_paralel([1,2,3,4],dobel,2)\ntampilkan hasil',/\[2,4,6,8\]/);
  process.chdir(temp);
  const rt=Runtime();
  await assert.rejects(rt.readTextFile('../secret.txt'),/di dalam folder proyek/);checks++;
  await assert.rejects(rt.writeTextFile('../secret.txt','x'),/di dalam folder proyek/);checks++;
  await assert.rejects(rt.listFiles('../'),/di luar proyek/);checks++;
  await assert.rejects(rt.readTextFile('missing.txt'),/ENOENT/);checks++;
  await assert.rejects(rt.writeTextFile('hello.txt','x'.repeat(1024*1024+1)),/1 MB/);checks++;
  const outside=fs.mkdtempSync(path.join(os.tmpdir(),'aksara-v7-outside-'));
  try{
   fs.writeFileSync(path.join(outside,'hidden.txt'),'nope');
   try{fs.symlinkSync(path.join(outside,'hidden.txt'),path.join(temp,'link.txt'));await assert.rejects(rt.readTextFile('link.txt'),/symlink/);checks++}catch(e){if(e.code!=='EPERM')throw e}
  }finally{fs.rmSync(outside,{recursive:true,force:true})}
  check(rt.frequencies(['a','b','a']).a===2,'frequency count');
  check(rt.groupBy([{a:'x'},{a:'y'},{a:'x'}],'a').x.length===2,'grouping');
  let active=0,peak=0;
  const values=await rt.parallelMap([1,2,3,4,5],async n=>{active++;peak=Math.max(active,peak);await new Promise(r=>setTimeout(r,10));active--;return n*n},2);
  check(peak===2&&JSON.stringify(values)==='[1,4,9,16,25]','bounded concurrency and order');
  await assert.rejects(rt.parallelMap([1],x=>x,0),/1–16/);checks++;
  await assert.rejects(rt.parallelMap([1,2],async n=>{if(n===2)throw Error('boom');return n}),/boom/);checks++;
  server=http.createServer((req,res)=>{if(req.url==='/json'){res.setHeader('content-type','application/json');res.end(JSON.stringify({pesan:'halo'}));return}if(req.url==='/echo'){let buf='';req.on('data',c=>buf+=c);req.on('end',()=>{res.setHeader('content-type','application/json');res.end(buf)})}else if(req.url==='/large'){res.setHeader('content-length','2000000');res.end('x')}else if(req.url==='/slow'){setTimeout(()=>res.end('late'),300)}else{res.statusCode=404;res.end('missing')}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  rt.enable('jaringan');
  const fetched=await rt.fetchAPI(base+'/json');check(fetched.berhasil&&fetched.status===200&&fetched.data.pesan==='halo','HTTP GET JSON');
  const posted=await rt.postAPI(base+'/echo',{nama:'Aksara'});check(posted.status===200&&posted.data.nama==='Aksara','HTTP POST JSON');
  const notFound=await rt.fetchAPI(base+'/missing');check(notFound.status===404&&!notFound.berhasil,'HTTP error status');
  await assert.rejects(rt.fetchAPI(base+'/large'),/1 MB/);checks++;
  await assert.rejects(rt.fetchAPI(base+'/slow',{timeout:100}),/batas waktu/);checks++;
  await assert.rejects(rt.fetchAPI('file:///etc/passwd'),/HTTP\(S\)/);checks++;
  await assert.rejects(rt.fetchAPI(base+'/json',{metode:'BOGUS'}),/Metode/);checks++;
  await assert.rejects(rt.fetchAPI(base+'/json',{header:{'bad header':'x'}}),/Header/);checks++;
  const testDir=path.join(temp,'suite');fs.mkdirSync(testDir);
  fs.writeFileSync(path.join(testDir,'a.test.aks'),'uji "satu"\n    pastikan(benar)\nselesai');
  fs.writeFileSync(path.join(testDir,'b.test.aks'),'uji "dua"\n    pastikan(2+2==4)\nselesai');
  const suite=cmd('test',testDir);check(suite.status===0&&/2\/2 file tes berhasil/.test(suite.stdout),'test folder runner');
  fs.writeFileSync(path.join(testDir,'b.test.aks'),'uji "gagal"\n    pastikan(salah)\nselesai');
  const badSuite=cmd('test',testDir);check(badSuite.status===1&&/1\/2 file tes berhasil/.test(badSuite.stdout),'test folder failure');
  const newProject=path.join(temp,'project-template');const init=cmd('init',newProject,['--template','api']);
  check(init.status===0&&fs.readFileSync(path.join(newProject,'program.aks'),'utf8').includes('server_buat'),'API template');
  const invalid=cmd('init',path.join(temp,'bad-template'),['--template','bogus']);check(invalid.status===1&&!fs.existsSync(path.join(temp,'bad-template')),'invalid template does not create directory');
  console.log(`✓ ${checks} tes Aksara v7: bahasa, file, HTTP, paralel, uji, template, CLI`);
 }finally{process.chdir(cwd);if(server)await new Promise(resolve=>server.close(resolve));fs.rmSync(temp,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
