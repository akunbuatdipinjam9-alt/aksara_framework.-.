'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const W=require('../electron/workspace.cjs');
const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'aksara-io-stable-'));
const cli=(...args)=>spawnSync(process.execPath,[path.join(root,'cli.js'),...args],{cwd:temp,encoding:'utf8',timeout:7000});
try{
 W.createProject(temp);
 const source='tampilkan 42\n';W.saveFile(temp,'program.aks',source);
 let r=cli('build','program.aks','program.aks');assert.notEqual(r.status,0);assert.match(r.stderr,/menimpa/);assert.equal(fs.readFileSync(path.join(temp,'program.aks'),'utf8'),source);
 r=cli('build','program.aks','--ketat');assert.equal(r.status,0,r.stderr);assert.ok(fs.existsSync(path.join(temp,'program.js')));assert.equal(fs.existsSync(path.join(temp,'--ketat')),false);
 r=cli('run','program.aks');assert.equal(r.stdout.trim(),'42');
 const limited=spawnSync(process.execPath,[path.join(root,'cli.js'),'run','program.aks'],{cwd:temp,env:{...process.env,AKSARA_RUN_TIMEOUT_MS:'bad'},encoding:'utf8'});assert.notEqual(limited.status,0);assert.match(limited.stderr,/AKSARA_RUN_TIMEOUT_MS/);
 fs.writeFileSync(path.join(temp,'program.aks'),'tunggu jeda(1000)\n');
 const timeout=spawnSync(process.execPath,[path.join(root,'cli.js'),'run','program.aks'],{cwd:temp,env:{...process.env,AKSARA_RUN_TIMEOUT_MS:'50'},encoding:'utf8',timeout:7000});assert.notEqual(timeout.status,0);assert.match(timeout.stderr,/50 ms/);
 W.saveFile(temp,'program.aks',source);
 for(let i=0;i<38;i++)W.saveFile(temp,'m'+i+'.aks','tampilkan '+i);
 assert.throws(()=>W.saveAll(temp,{'program.aks':'tampilkan "overwritten"','new1.aks':'','new2.aks':''}),/40 berkas/);
 assert.equal(fs.readFileSync(path.join(temp,'program.aks'),'utf8'),source);
 assert.equal(fs.existsSync(path.join(temp,'new1.aks')),false);
 assert.throws(()=>W.saveAll(temp,{'program.aks':'changed','bad.aks':null}),/teks/);
 assert.equal(fs.readFileSync(path.join(temp,'program.aks'),'utf8'),source);
 console.log('I/O stability: source overwrite protection, strict build flags, configurable timeout and save-all preflight passed');
}finally{fs.rmSync(temp,{recursive:true,force:true})}
