'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'aksara35-'));
let count=0;
function check(name,condition){assert.ok(condition,name);count++;console.log('✓ '+name)}
function cli(cwd,...args){return cp.spawnSync(process.execPath,[path.join(root,'cli.js'),...args],{cwd,encoding:'utf8',timeout:60000});}
try{
 const project=path.join(tmp,'demo');
 check('project init',cli(tmp,'buat',project).status===0);
 const pkg=require('../paket.js');
 check('reject command injection',(()=>{try{pkg.validateSpec('lodash;whoami',project);return false}catch{return true}})());
 check('reject path traversal',(()=>{try{pkg.validateSpec('file:./../../outside',project);return false}catch{return true}})());
 check('reject remote url',(()=>{try{pkg.validateSpec('https://example.com/a',project);return false}catch{return true}})());
 check('empty list',cli(project,'paket','daftar').status===0);
 const vendor=path.join(project,'vendor','aksara-demo-paket');
 fs.mkdirSync(vendor,{recursive:true});
 fs.writeFileSync(path.join(vendor,'package.json'),JSON.stringify({name:'aksara-demo-paket',version:'1.0.0',main:'index.js'}));
 fs.writeFileSync(path.join(vendor,'index.js'),'module.exports={sapa:()=>"Halo dari paket Aksara!"};\n');
 const install=cli(project,'paket','tambah','file:./vendor/aksara-demo-paket');
 check('install local package: '+install.stderr,install.status===0);
 const aks=JSON.parse(fs.readFileSync(path.join(project,'aksara.json'),'utf8'));
 check('sync aksara manifest',typeof aks.paket['aksara-demo-paket']==='string');
 check('package listing',cli(project,'paket','daftar').stdout.includes('aksara-demo-paket'));
 fs.writeFileSync(path.join(project,'program.aks'),'gunakan javascript\ningat paket sebagai tunggu modul_js("aksara-demo-paket")\ntampilkan paket.sapa()\n');
 const run=cli(project,'jalankan','program.aks');
 check('JS npm interop: '+run.stderr,run.status===0 && run.stdout.includes('Halo dari paket Aksara!'));
 check('reinstall project dependencies',cli(project,'paket','pasang').status===0);
 check('remove dependency',cli(project,'paket','hapus','aksara-demo-paket').status===0);
 check('manifest cleanup',!Object.hasOwn(JSON.parse(fs.readFileSync(path.join(project,'aksara.json'),'utf8')).paket,'aksara-demo-paket'));
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
console.log('v3.5: '+count+' package ecosystem checks passed');
