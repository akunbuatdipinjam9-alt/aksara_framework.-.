'use strict';
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function cli(...args){return cp.spawnSync(process.execPath,[path.join(root,'cli.js'),...args],{encoding:'utf8'});}
assert.match(cli('versi').stdout,new RegExp(require('../package.json').version.replaceAll('.','\\.')));
assert.equal(cli('doctor').status,0);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aksara32-'));
try {
 const proj=path.join(dir,'demo');
 assert.equal(cli('buat',proj).status,0);
 assert.equal(JSON.parse(fs.readFileSync(path.join(proj,'aksara.json'),'utf8')).utama,'program.aks');
 const main=path.join(proj,'program.aks');
 assert.equal(cli('periksa',main,'--ketat').status,0);
 assert.equal(cli('jalankan',main).status,0);
 assert.equal(cli('bangun',main,path.join(proj,'hasil.js')).status,0);
 assert.ok(fs.existsSync(path.join(proj,'hasil.js.map')));
 assert.equal(cli('rapikan',main).status,0);
} finally {fs.rmSync(dir,{recursive:true,force:true});}
console.log('v3.2: 7 SDK tests passed');
