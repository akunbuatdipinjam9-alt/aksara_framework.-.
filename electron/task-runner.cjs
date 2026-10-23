'use strict';
const {spawn}=require('node:child_process');
const {StringDecoder}=require('node:string_decoder');
const path=require('node:path');
const ALLOWED=new Set(['run','check','build','test']);
const LIMIT=180_000;
function terminateTree(child){
 if(!child.pid)return child.kill();
 if(process.platform==='win32'){
  const killer=spawn(path.join(process.env.SystemRoot||'C:\\Windows','System32','taskkill.exe'),['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore',shell:false});
  killer.once('error',()=>child.kill());
  killer.once('exit',code=>{if(code!==0)child.kill()});
 }else{try{process.kill(-child.pid,'SIGTERM')}catch{child.kill()}}
 return true;
}
function createRunner({root,cwd,emit,execPath=process.execPath,spawnProcess=spawn,timeout,terminateProcess=terminateTree}){
 let child=null,stopCurrent=null;
 function start(mode,strict=false){
  if(!ALLOWED.has(mode))throw Error('Perintah task tidak diizinkan');
  if(child)throw Error('Task sebelumnya masih berjalan. Tekan Stop dahulu.');
  const taskTimeout=timeout??(mode==='run'?0:25_000);
  if(!Number.isInteger(taskTimeout)||taskTimeout<0||taskTimeout>2147483647)throw Error('Batas waktu task tidak valid');
  let bytes=0,timer=null,finished=false,stopping=false;
  const decoders=[new StringDecoder('utf8'),new StringDecoder('utf8')];
  const args=[path.join(root,'cli.js'),mode,'program.aks'];
  if(strict)args.push('--ketat');
  const current=spawnProcess(execPath,args,{cwd,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},detached:process.platform!=='win32',windowsHide:true,stdio:['ignore','pipe','pipe']});
  child=current;
  stopCurrent=()=>{if(finished||stopping)return false;stopping=true;terminateProcess(current);return true};
  const push=(chunk,error=false)=>{
   if(child!==current||finished)return;
   const data=Buffer.from(chunk),remaining=LIMIT-bytes;
   if(remaining<=0)return;
   const accepted=data.subarray(0,remaining);bytes+=accepted.length;
   const value=decoders[error?1:0].write(accepted);
   if(value)emit({type:'line',text:value,error});
   if(bytes>=LIMIT)emit({type:'line',text:'\n[OUTPUT DIBATASI 180 KB]\n',error:true});
  };
  const finish=(code,signal)=>{
   if(finished)return;
   finished=true;clearTimeout(timer);
   if(child!==current)return;
   if(bytes<LIMIT)for(let i=0;i<decoders.length;i++){const value=decoders[i].end();if(value)emit({type:'line',text:value,error:!!i})}
   child=null;stopCurrent=null;
   emit({type:'done',code:code??1,signal:signal||null});
  };
  if(taskTimeout)timer=setTimeout(()=>{
   if(child===current&&!finished){emit({type:'line',text:'\n[TIMEOUT] Melebihi '+taskTimeout/1000+' detik. Task dihentikan.\n',error:true});stopCurrent?.()}
  },taskTimeout);
  current.stdout?.on('data',chunk=>push(chunk));
  current.stderr?.on('data',chunk=>push(chunk,true));
  current.once('error',e=>{if(child===current&&!finished){emit({type:'line',text:'[ERROR] '+e.message+'\n',error:true});finish(1,null)}});
  current.once('close',finish);
  return true;
 }
 function stop(){return stopCurrent?.()||false}
 return {start,stop,busy:()=>!!child};
}
module.exports={createRunner,ALLOWED,terminateTree};
