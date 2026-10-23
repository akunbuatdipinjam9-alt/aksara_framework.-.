'use strict';
// Run with Electron, using its real sandboxed renderer and preload bridge.
const fs=require('node:fs');
const report=(status,detail='')=>{if(process.env.AKSARA_ELECTRON_TEST_RESULT)fs.writeFileSync(process.env.AKSARA_ELECTRON_TEST_RESULT,JSON.stringify({status,detail},null,2))};
report('starting');
const {app,BrowserWindow,ipcMain}=require('electron');
const assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let win,openCount=0,saveCount=0,startCount=0,releaseSave=null,holdSave=false;
let disk={'program.aks':'tampilkan "awal"\n'};
const ok=data=>({ok:true,data});
const until=async predicate=>{const end=Date.now()+7000;while(!await predicate()){if(Date.now()>end)throw Error('Electron UI timed out');await new Promise(r=>setTimeout(r,20))}};
const js=code=>win.webContents.executeJavaScript(code);
const command=name=>win.webContents.send('aksara:command',name);
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 for(const action of ['open-folder','save-all','save-file','start-task','stop-task','reload'])ipcMain.handle('aksara:'+action,async(_event,args)=>{
  if(action==='reload')return ok(null);
  if(action==='open-folder'){openCount++;return ok({path:root,name:'Pengujian',files:{...disk}})}
  if(action==='save-all'){
   saveCount++;if(holdSave)await new Promise(resolve=>releaseSave=resolve);
   disk={...args.files};return ok({saved:Object.keys(disk).length});
  }
  if(action==='save-file'){disk[args.name]=args.content;return ok(args.name)}
  if(action==='start-task'){
   startCount++;win.webContents.send('aksara:task-event',{type:'done',code:0});
   return ok({mode:args.mode});
  }
  return ok({stopped:false});
 });
 win=new BrowserWindow({show:false,webPreferences:{partition:'aksara-test-'+process.pid,nodeIntegration:false,contextIsolation:true,sandbox:true,preload:path.join(root,'electron/preload.cjs')}});
 const errors=[];win.webContents.on('console-message',(_e,level,message)=>{if(level>=3)errors.push(message)});
 await win.loadFile(path.join(root,'index.html'));
 await until(()=>js('!!window.AksaraStudioBridge && !!document.getElementById("workspaceTree")'));
 command('open-folder');await until(()=>js('document.getElementById("workspaceName").textContent.includes("Pengujian")'));
 await js('document.getElementById("source").value=\'tampilkan "berubah"\\n\';document.getElementById("source").dispatchEvent(new Event("input",{bubbles:true}))');
 holdSave=true;command('save-all');await until(()=>!!releaseSave);
 command('open-folder');await new Promise(r=>setTimeout(r,100));
 assert.equal(openCount,1,'Opening a project overlapped an unfinished save');
 // Edits made while a save is awaiting acknowledgement must stay dirty.
 await js('document.getElementById("source").value=\'tampilkan "lebih baru"\\n\';document.getElementById("source").dispatchEvent(new Event("input",{bubbles:true}))');
 holdSave=false;releaseSave();
 await until(()=>js('document.getElementById("nativeStatus").textContent.includes("tersimpan")'));
 assert.equal(disk['program.aks'],'tampilkan "berubah"\n');
 assert.equal(await js('!!document.querySelector(".desktop-tree-file.dirty")'),true);
 const prevented=await js('window.confirm=()=>false;const closeEvent=new Event("beforeunload",{cancelable:true});window.dispatchEvent(closeEvent);closeEvent.defaultPrevented');
 assert.equal(prevented,true,'Unsaved native project did not prevent closing');
 command('task-run');await until(()=>startCount===1);
 await until(()=>js('document.getElementById("nativeStatus").textContent.includes("berhasil")'));
 command('task-run');await until(()=>startCount===2);
 assert.ok(saveCount>=3);
 assert.equal(disk['program.aks'],'tampilkan "lebih baru"\n');
 // Exercise real web preview communication and compilation inside Chromium.
 await js('window.AksaraStudioBridge.setFiles({"program.aks":\'gunakan web\\nbuat judul "Stabil"\\nbuat teks "Preview berjalan"\\n\'});window.AksaraStudioBridge.run()');
 await until(()=>js('document.getElementById("buildStatus").textContent==="Program selesai"'));
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('Electron UI: real Chromium/preload, save/open race, dirty edits, close protection, fast task completion and web preview passed');
 report('passed');
 app.exit(0);
}).catch(error=>{report('failed',error.stack||String(error));console.error(error);app.exit(1)});
