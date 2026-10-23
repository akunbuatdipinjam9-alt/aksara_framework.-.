'use strict';
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createRunner}=require('../electron/task-runner.cjs');
const root=path.resolve(__dirname,'..');
function fake(){const p=new EventEmitter();p.stdout=new EventEmitter();p.stderr=new EventEmitter();p.kill=()=>true;return p}
(async()=>{
 const children=[],events=[],killed=[];
 const runner=createRunner({root,cwd:root,emit:e=>events.push(e),timeout:40,spawnProcess:()=>{const p=fake();children.push(p);return p},terminateProcess:p=>killed.push(p)});
 runner.start('run',true);
 const first=children[0];
 const text=Buffer.from('こんにちは 🌍');
 for(const byte of text)first.stdout.emit('data',Buffer.from([byte]));
 first.emit('error',Error('spawn failed'));
 assert.equal(runner.busy(),false);
 assert.equal(events.filter(e=>e.type==='line'&&!e.error).map(e=>e.text).join(''),'こんにちは 🌍');
 assert.equal(events.filter(e=>e.type==='done').length,1);
 runner.start('check');
 first.emit('close',1); // Delayed close of the failed run cannot clear the new timer.
 await new Promise(resolve=>setTimeout(resolve,80));
 assert.deepEqual(killed,[children[1]]);
 children[1].emit('close',null,'SIGTERM');
 assert.equal(runner.busy(),false);
 assert.equal(events.filter(e=>e.type==='done').length,2);
 runner.start('build');
 children[2].stdout.emit('data',Buffer.alloc(200000,65));
 children[2].stdout.emit('data',Buffer.alloc(200000,65));
 children[2].emit('close',0);
 assert.equal(events.filter(e=>e.text?.includes('OUTPUT DIBATASI')).length,1);
 // Exercise a real CLI -> generated program process tree. Stop must release the HTTP port.
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'aksara-runner-stop-'));
 let live=null;
 try{
  fs.writeFileSync(path.join(temp,'program.aks'),'gunakan server\ningat app sebagai server_buat(0)\ntampilkan tunggu app.jalankan()\n');
  let output='';let addressResolve,doneResolve;
  const address=new Promise(resolve=>addressResolve=resolve),done=new Promise(resolve=>doneResolve=resolve);
  live=createRunner({root,cwd:temp,emit:e=>{if(e.type==='line'){output+=e.text;const found=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(found)addressResolve(found[0])}if(e.type==='done')doneResolve(e)}});
  const deadline=(p)=>{let timer;return Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Runner deadline: '+output)),10000)})]).finally(()=>clearTimeout(timer))};
  live.start('run');
  const url=await deadline(address);
  assert.equal((await fetch(url)).status,404);
  assert.equal(live.stop(),true);
  await deadline(done);
  assert.equal(live.busy(),false);
  // taskkill exits the root and descendants together; wait briefly for socket teardown.
  let alive=true;
  for(let i=0;i<20;i++){
   try{await fetch(url,{signal:AbortSignal.timeout(300)})}catch{alive=false;break}
   await new Promise(resolve=>setTimeout(resolve,50));
  }
  assert.equal(alive,false,'Stop left the generated HTTP server alive');
 }finally{live?.stop();fs.rmSync(temp,{recursive:true,force:true})}
 console.log('Runner stability: UTF-8, spawn recovery, stale events, timeout, output limit and real process-tree Stop passed');
})().catch(e=>{console.error(e);process.exitCode=1});
