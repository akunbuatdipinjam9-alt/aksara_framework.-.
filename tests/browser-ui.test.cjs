'use strict';
// Optional real-browser integration test. Requires Playwright and Chromium/Edge.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'text/plain');
 fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,channel:process.env.AKSARA_BROWSER_CHANNEL||(process.platform==='win32'?'msedge':undefined)});
  const page=await browser.newPage();page.setDefaultTimeout(7000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
   if(window.top!==window)return;
   // Mimic native IPC, including delayed saves and a task that finishes before invoke resolves.
   const state=window.__native={opens:0,saves:0,starts:0,hold:false,release:null,command:null,event:null,disk:{'program.aks':'tampilkan "awal"\n'}};
   window.aksaraDesktop={platform:'test',
    open_folder:async()=>{state.opens++;return {ok:true,data:{path:'/test',name:'Pengujian',files:{...state.disk}}}},
    save_all:async({files})=>{state.saves++;if(state.hold)await new Promise(resolve=>state.release=resolve);state.disk={...files};return {ok:true,data:{saved:Object.keys(files).length}}},
    save_file:async({name,content})=>{state.disk[name]=content;return {ok:true,data:name}},
    start_task:async({mode})=>{state.starts++;state.event?.({type:'done',code:0});return {ok:true,data:{mode}}},
    stop_task:async()=>({ok:true,data:{stopped:false}}),
    open_devtools:async()=>({ok:true,data:{}}),
    onCommand:fn=>state.command=fn,onTaskEvent:fn=>state.event=fn
   };
   localStorage.setItem('aksara-v2-project',JSON.stringify({'program.aks':'tampilkan "bad"','bad.aks':null}));
  });
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForFunction(()=>!!document.getElementById('workspaceTree'));
  assert.equal(await page.evaluate(()=>Object.hasOwn(AksaraStudioBridge.getFiles(),'bad.aks')),false);
  const command=name=>page.evaluate(name=>window.__native.command(name),name);
  await command('open-folder');
  await page.waitForFunction(()=>document.getElementById('workspaceName').textContent.includes('Pengujian'));
  await page.locator('#source').fill('tampilkan "berubah"\n');
  await page.evaluate(()=>window.__native.hold=true);
  await command('save-all');
  await page.waitForFunction(()=>!!window.__native.release);
  await command('open-folder');
  assert.equal(await page.evaluate(()=>window.__native.opens),1);
  await page.locator('#source').fill('tampilkan "lebih baru"\n');
  await page.evaluate(()=>{window.__native.hold=false;window.__native.release()});
  await page.waitForFunction(()=>document.getElementById('nativeStatus').textContent.includes('tersimpan'));
  assert.equal(await page.evaluate(()=>window.__native.disk['program.aks']),'tampilkan "berubah"\n');
  assert.equal(await page.locator('.desktop-tree-file.dirty').count(),1);
  assert.equal(await page.evaluate(()=>{window.confirm=()=>false;const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented}),true);
  await command('task-run');
  await page.waitForFunction(()=>window.__native.starts===1&&document.getElementById('nativeStatus').textContent==='Task berhasil');
  await command('task-run');
  await page.waitForFunction(()=>window.__native.starts===2);
  assert.equal(await page.evaluate(()=>window.__native.disk['program.aks']),'tampilkan "lebih baru"\n');
  // Invalid imports cannot replace or corrupt the current in-memory project.
  const before=await page.evaluate(()=>AksaraStudioBridge.getFiles());
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('#file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({'program.aks':'tampilkan 99','bad.aks':null}))});
  assert.deepEqual(await page.evaluate(()=>AksaraStudioBridge.getFiles()),before);
  await page.evaluate(()=>{
   AksaraStudioBridge.setFiles({'program.aks':'gunakan web\nbuat judul "Stabil"\nbuat teks "Preview berjalan"\n'});
   const original=Aksara.compileProject;window.compileCount=0;Aksara.compileProject=(...args)=>{window.compileCount++;return original(...args)};
  });
  await page.locator('#source').press('Control+Enter');
  await page.waitForFunction(()=>document.getElementById('buildStatus').textContent==='Program selesai');
  assert.equal(await page.evaluate(()=>window.compileCount),1,'Ctrl+Enter compiled twice');
  assert.equal(await page.frameLocator('#previewFrame').locator('h2').textContent(),'Stabil');
  await page.locator('#debugRun').click();
  assert.match(await page.locator('#javascript').textContent(),/debugger;/);
  // A failed compilation must unload an earlier running preview.
  await page.locator('#source').fill('ingat x sebagai [\n');await page.locator('#run').click();
  assert.equal(await page.locator('#previewFrame').getAttribute('srcdoc'),'');
  // Exercise the sandbox host storage bridge in a real iframe.
  await page.evaluate(()=>{AksaraStudioBridge.setFiles({'program.aks':'gunakan penyimpanan\ntunggu simpan_data("uji", {nilai: 42})\ntampilkan tunggu baca_data("uji")\n'});AksaraStudioBridge.run()});
  await page.waitForFunction(()=>document.getElementById('buildStatus').textContent==='Program selesai');
  assert.match(await page.locator('#terminal').textContent(),/42/);
  await page.evaluate(()=>{AksaraStudioBridge.setFiles({'program.aks':'gunakan web\nweb_responsif(600,"kartu",{"padding":"4px"})\nweb_responsif(900,"kartu",{"padding":"8px"})\n'});AksaraStudioBridge.run()});
  await page.waitForFunction(()=>document.getElementById('buildStatus').textContent==='Program selesai');
  assert.equal(await page.frameLocator('#previewFrame').locator('style[data-aksara-media="kartu"]').count(),2);
  await page.evaluate(()=>{AksaraStudioBridge.setFiles({'program.aks':'ulangi 3000 kali\n tampilkan indeks\nselesai\n'});AksaraStudioBridge.run()});
  await page.waitForFunction(()=>document.getElementById('buildStatus').textContent==='Program selesai');
  assert.ok(await page.locator('#terminal > span').count()<=2001);
  assert.match(await page.locator('#terminal').textContent(),/OUTPUT DIBATASI/);
  await page.evaluate(()=>{AksaraStudioBridge.setFiles({'program.aks':'asinkron fungsi gagal()\n lempar "gagal async"\nselesai\ngagal()\n'});AksaraStudioBridge.run()});
  await page.waitForFunction(()=>document.getElementById('buildStatus').textContent==='Kesalahan runtime');
  assert.match(await page.locator('#terminal').textContent(),/gagal async/);
  assert.deepEqual(errors,[]);
  console.log('Browser UI: Chromium, save/open race, dirty edits, close protection, instant task completion, import validation, keyboard shortcut, Debug, stale preview, storage, responsive CSS, output limit and async errors passed');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
