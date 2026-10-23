'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const cli=path.resolve(__dirname,'../cli.js');
let count=0;
function cmd(args){return spawnSync(process.execPath,[cli,...args],{encoding:'utf8',timeout:6000})}
const examples=path.resolve(__dirname,'../examples');
for(const [name,result] of [['data','Rata-rata: 83'],['oop','Meong!'],['async','[10,14,18]']]){
 const run=cmd(['run',path.join(examples,name+'.aks')]);assert.equal(run.status,0,run.stderr);assert.ok(run.stdout.includes(result),run.stdout);count++;console.log('✓ cli run',name)
}
const good=cmd(['check',path.join(examples,'data.aks')]);assert.equal(good.status,0,good.stderr);assert.match(good.stdout,/0 kesalahan/);count++;console.log('✓ cli check');
const dest=path.join(os.tmpdir(),'aksara-1.7-test-'+process.pid+'.js');const built=cmd(['build',path.join(examples,'data.aks'),dest]);assert.equal(built.status,0,built.stderr);const standalone=spawnSync(process.execPath,[dest],{encoding:'utf8',timeout:6000});assert.equal(standalone.status,0,standalone.stderr);assert.match(standalone.stdout,/Rata-rata: 83/);fs.unlinkSync(dest);count++;console.log('✓ cli standalone JS');
console.log(`${count} CLI tests passed`)
