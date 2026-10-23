'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const {createRunner}=require('../electron/task-runner.cjs');
const W=require('../electron/workspace.cjs');
const root=path.resolve(__dirname,'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'aksara-v4-'));
let cases=0;
async function check(name,fn){await fn();cases++;console.log('✓ '+name)}
async function run(){
 try {
  const empty=path.join(tmp,'new-project');fs.mkdirSync(empty);
  await check('reject folder without program.aks',()=>assert.throws(()=>W.readProject(empty),/program\.aks/));
  const created=W.createProject(empty);
  await check('initialize on-disk project',()=>{assert.equal(created.entry,'program.aks');assert.ok(fs.existsSync(path.join(empty,'aksara.json')))});
  await check('nonempty folder cannot be overwritten',()=>assert.throws(()=>W.createProject(empty),/kosong/));
  await check('regular file read',()=>assert.match(W.readProject(empty).files['program.aks'],/Aksara/));
  await check('path traversal blocked',()=>assert.throws(()=>W.saveFile(empty,'../outside.aks','Halo'),/Nama berkas/));
  await check('non-aks extension blocked',()=>assert.throws(()=>W.saveFile(empty,'config.json','x'),/Nama berkas/));
  await check('size limit enforced',()=>assert.throws(()=>W.saveFile(empty,'big.aks','X'.repeat(100001)),/100 KB/));
  await check('create additional module',()=>{W.saveFile(empty,'util.aks','ekspor fungsi sapa()\n  kembalikan "Halo"\nselesai',true);assert.ok(W.readProject(empty).files['util.aks'])});
  await check('cannot recreate existing file',()=>assert.throws(()=>W.saveFile(empty,'util.aks','x',true),/sudah ada/));
  await check('save all updates each module',()=>{const data=W.readProject(empty).files;data['program.aks']='impor sapa dari "util"\ntampilkan sapa()\n';W.saveAll(empty,data);assert.match(fs.readFileSync(path.join(empty,'program.aks'),'utf8'),/impor sapa/)});
  await check('cannot omit program.aks',()=>assert.throws(()=>W.saveAll(empty,{'util.aks':'x'}),/program\.aks/));
  await check('protect program.aks from deletion',()=>assert.throws(()=>W.deleteFile(empty,'program.aks'),/tidak boleh/));
  await check('delete module from disk',()=>{W.deleteFile(empty,'util.aks');assert.ok(!fs.existsSync(path.join(empty,'util.aks')))});
  await check('symlink cannot overwrite external data',()=>{
   const external=path.join(tmp,'external.txt');fs.writeFileSync(external,'unchanged');
   try{fs.symlinkSync(external,path.join(empty,'alias.aks'));assert.throws(()=>W.saveFile(empty,'alias.aks','changed'),/simbolik/);assert.equal(fs.readFileSync(external,'utf8'),'unchanged')}
   catch(e){if(e.code==='EPERM')console.log('  Symlink unavailable on this platform; skipped');else throw e}
   finally{try{fs.unlinkSync(path.join(empty,'alias.aks'))}catch{}}
  });
  const example='ingat angka: angka sebagai 4\ntampilkan angka * 2\n';
  W.saveFile(empty,'program.aks',example);
  await check('native CLI can compile project',()=>{
   const p=cp.spawnSync(process.execPath,[path.join(root,'cli.js'),'periksa','program.aks','--ketat'],{cwd:empty,encoding:'utf8'});
   assert.equal(p.status,0,p.stderr);
  });
  const events=[];
  const runner=createRunner({root,cwd:empty,emit:e=>events.push(e),timeout:15000});
  await check('reject arbitrary task names',()=>assert.throws(()=>runner.start('powershell'),/diizinkan/));
  await check('run single CLI task and receive output',()=>new Promise((resolve,reject)=>{
   let timeout=setTimeout(()=>reject(Error('Runner did not finish')),20000);
   const wrapped=createRunner({root,cwd:empty,emit:e=>{events.push(e);if(e.type==='done'){clearTimeout(timeout);try{assert.equal(e.code,0);assert.ok(events.some(x=>x.type==='line'&&x.text.includes('8')));resolve()}catch(err){reject(err)}}},timeout:15000});
   wrapped.start('run');assert.equal(wrapped.busy(),true);
  }));
  // The async promise above is awaited separately in test runner below.
 }finally{}
}
async function main(){
 try{
  await run();
  console.log('v4.0: '+cases+' integration checks passed');
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
}
main().catch(e=>{console.error(e);process.exitCode=1});
