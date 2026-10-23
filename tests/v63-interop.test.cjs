'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),cli=path.join(root,'cli.js');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'aksara-v63-'));
function run(args,opts={}){return cp.spawnSync(process.execPath,[cli,...args],{cwd:tmp,encoding:'utf8',timeout:45000,...opts})}
try{
 fs.writeFileSync(path.join(tmp,'aksara.json'),'{}');
 let r=run(['paket','tambah','py:bad;name']);assert.notEqual(r.status,0);
 r=run(['paket','tambah','js:bad;name']);assert.notEqual(r.status,0);
 r=run(['paket','py:siapkan']);assert.equal(r.status,0,r.stderr);
 fs.writeFileSync(path.join(tmp,'python.aks'),'gunakan python\ningat x sebagai python_panggil("statistics", "mean", [[10,20,30]])\ntampilkan x\n');
 r=run(['run','python.aks']);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/20/);
 fs.writeFileSync(path.join(tmp,'print.aks'),'gunakan python\ntampilkan python_panggil("builtins", "print", ["Halo dunia"])\ntampilkan python_panggil("json", "loads", ["\\"こんにちは\\""])\n');
 r=run(['run','print.aks']);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/kosong/);assert.match(r.stdout,/こんにちは/);
 fs.writeFileSync(path.join(tmp,'bad.aks'),'gunakan python\ningat x sebagai python_panggil("not_existing_module_xyz", "mean", [[1,2]])\ntampilkan x\n');
 r=run(['run','bad.aks']);assert.notEqual(r.status,0);
 fs.writeFileSync(path.join(tmp,'js.aks'),'gunakan javascript\ningat os sebagai tunggu modul_js("node:os")\ntampilkan os.platform()\n');
 r=run(['run','js.aks']);assert.equal(r.status,0,r.stderr);
 fs.writeFileSync(path.join(tmp,'ai.aks'),'gunakan ai\ningat x sebagai tunggu ai_tanya("hello", "invalid model")\ntampilkan x\n');
 r=run(['check','ai.aks']);assert.equal(r.status,0,r.stderr);
 console.log('✓ v6.3: venv Python, interop JSON, error, Node JS, AI compiler');
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
