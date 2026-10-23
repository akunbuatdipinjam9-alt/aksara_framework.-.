'use strict';
(()=>{
 if(!window.aksaraDesktop || !window.AksaraStudioBridge) return;
 const D=window.aksaraDesktop,A=window.AksaraStudioBridge;
 const $=id=>document.getElementById(id);
 const source=$('source');
 let project=null,saved=null,taskBusy=false,operationBusy=false,taskRevision=0;
 function exclusive(callback){return async (...args)=>{if(operationBusy){status("Tunggu operasi proyek selesai.");return false}operationBusy=true;try{return await callback(...args)}finally{operationBusy=false}}}
 const make=(tag,klass,text)=>{const el=document.createElement(tag);if(klass)el.className=klass;if(text!==undefined)el.textContent=text;return el};
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const allFiles=()=>A.getFiles();
 const isDirty=()=>project&&saved&&!same(allFiles(),saved);
 function status(text,error=false){A.status(text);const line=$('nativeStatus');if(line){line.textContent=text;line.classList.toggle('desktop-error',error)}}
 function notifyError(error){const message=typeof error==='string'?error:error?.message||'Operasi gagal';status(message,true);A.terminal('[ERROR] '+message,true)}
 function unwrap(result){if(!result?.ok)throw Error(result?.error||'Operasi desktop gagal');return result.data}
 function confirmLoss(){return !isDirty()||window.confirm('Ada perubahan yang belum disimpan ke disk. Abaikan perubahan ini?')}
 const tree=make('div','desktop-project-tree');tree.id='workspaceTree';
 const bar=make('div','desktop-toolbar');bar.id='desktopToolbar';
 const buttons=make('div','desktop-toolbar-buttons');
 const workspaceName=make('div','desktop-workspace-name','Belum ada folder proyek');workspaceName.id='workspaceName';
 function addButton(container,label,title,callback,klass=''){
  const btn=make('button',klass,label);btn.type='button';btn.title=title;btn.addEventListener('click',callback);container.append(btn);return btn;
 }
 addButton(buttons,'▣ Buka Folder','Buka folder proyek .aks',()=>openProject());
 addButton(buttons,'＋ Proyek Baru','Buat proyek di folder kosong',()=>newProject());
 addButton(buttons,'↓ Simpan Semua','Simpan semua berkas proyek ke disk',()=>saveAll());
 bar.append(buttons,workspaceName,tree);
 const caption=document.querySelector('.leftPane .paneCaption');caption.after(bar);
 const runner=make('div','desktop-runner');runner.id='desktopRunner';
 const runnerActions=make('div','desktop-runner-actions');
 addButton(runnerActions,'▶ Run CLI','Jalankan program.aks lewat Node.js (F5)',()=>startTask('run'),'desktop-run');
 addButton(runnerActions,'✓ Check','Periksa kesalahan compiler (F7)',()=>startTask('check'));
 addButton(runnerActions,'✓ Test','Jalankan uji Aksara lewat Node.js',()=>startTask('test'));
 addButton(runnerActions,'⚙ Build JS','Kompilasi program.aks ke JavaScript (F8)',()=>startTask('build'));
 addButton(runnerActions,'■ Stop','Hentikan task aktif (Shift+F5)',()=>stopTask(),'desktop-stop');
 const terminalDesc=make('span','desktop-runner-desc','CLI berjalan di folder proyek melalui Node.js · output di Terminal');
 runner.append(runnerActions,terminalDesc);
 document.querySelector('.rightTop').after(runner);
 const nativeStatus=make('div','desktop-native-status','Aksara Studio Desktop · folder belum dibuka');nativeStatus.id='nativeStatus';
 document.querySelector('.statusbar').append(nativeStatus);
 document.querySelector('.statusLeft span:nth-child(2)').textContent='● Desktop workspace';
 async function applyProject(data){
  if(!data)return;
  project={path:data.path,name:data.name};taskBusy=!!data.running;
  A.setFiles(data.files,'program.aks');saved=allFiles();
  status('Proyek aktif: '+project.name);
  renderExplorer();
 }
 async function openProject(){
  if(!confirmLoss())return;
  try{await applyProject(unwrap(await D.open_folder()))}catch(e){notifyError(e)}
 }
 async function newProject(){
  if(!confirmLoss())return;
  try{await applyProject(unwrap(await D.new_project()))}catch(e){notifyError(e)}
 }
 async function reloadProject(){
  if(!project)return status('Buka folder proyek terlebih dahulu');
  if(!confirmLoss())return;
  try{await applyProject(unwrap(await D.reload()))}catch(e){notifyError(e)}
 }
 async function restoreSession(){
  if(!D.reload)return;
  try{const revision=taskRevision;const data=unwrap(await D.reload());if(data){data.running=!!data.running&&revision===taskRevision;await applyProject(data)}}catch(e){notifyError(e)}
 }
 async function saveCurrent(){
  if(!project){$('save').click();return}
  try{
   const name=A.activeName(),contents=allFiles();
   unwrap(await D.save_file({name,content:contents[name]}));
   saved[name]=contents[name];status('Tersimpan: '+name);renderExplorer();
  }catch(e){notifyError(e)}
 }
 async function persistAll(){
  if(!project)return status('Buka Folder atau buat Proyek Baru terlebih dahulu.',true);
  try{
   const files=allFiles();const result=unwrap(await D.save_all({files}));
   saved={...files};status(result.saved+' berkas tersimpan ke disk');renderExplorer();return true;
  }catch(e){notifyError(e);return false}
 }
 async function newFile(){
  if(!project)return status('Buka folder proyek terlebih dahulu',true);
  const name=prompt('Nama modul .aks baru (contoh: util.aks)');if(name===null)return;
  try{
   unwrap(await D.create_file({name,content:''}));
   const files=allFiles();files[name]='';A.setFiles(files,name);
   saved[name]='';status('Dibuat: '+name);renderExplorer();
  }catch(e){notifyError(e)}
 }
 async function deleteFile(){
  if(!project)return status('Buka folder proyek terlebih dahulu',true);
  const name=A.activeName();if(name==='program.aks')return status('program.aks tidak boleh dihapus',true);
  if(!confirm('Hapus '+name+' dari disk? Tindakan ini tidak bisa dibatalkan.'))return;
  try{
   unwrap(await D.delete_file({name}));
   const files=allFiles();delete files[name];delete saved[name];A.setFiles(files);
   status('Dihapus: '+name);renderExplorer();
  }catch(e){notifyError(e)}
 }
 function renderExplorer(){
  tree.replaceChildren();
  workspaceName.textContent=project?'▤ '+project.name+'  ·  '+project.path:'Buka folder proyek untuk memulai';
  if(!project){tree.append(make('p','desktop-empty','File .aks di disk akan muncul di sini.'));return}
  const files=allFiles();
  for(const name of Object.keys(files).sort((a,b)=>a==='program.aks'?-1:b==='program.aks'?1:a.localeCompare(b))){
   const active=name===A.activeName();
   const dirty=saved?.[name]!==files[name];
   const label=make('button','desktop-tree-file'+(active?' selected':'')+(dirty?' dirty':''));
   label.textContent='◇  '+name+(dirty?'  ●':'');label.title='Buka '+name+(dirty?' (belum disimpan)':'');
   label.onclick=()=>{A.selectFile(name);renderExplorer()};tree.append(label);
  }
 }
 function appendOutput(msg,error=false){
  const pane=$('terminal');const el=make('span',error?'desktop-console-error':'desktop-console-text',msg);
  pane.append(el);pane.scrollTop=pane.scrollHeight;
 }
 async function startTask(mode){
  if(!project)return status('Buka folder proyek untuk menjalankan CLI',true);
  if(taskBusy)return status('Task masih berjalan. Tekan Stop terlebih dahulu.',true);
  if(!await persistAll())return;
  const term=$('terminal');term.replaceChildren();A.showTab('terminal');
  appendOutput('AKSARA 7.0 BETA  /  '+project.name+'\n$ aksara '+({run:'jalankan',check:'periksa',build:'bangun',test:'uji'}[mode]||mode)+' program.aks\n\n');
  try{
   taskBusy=true;
   const data=unwrap(await D.start_task({mode,strict:$('strictMode').checked}));
   if(taskBusy)status('Menjalankan: '+data.mode);
  }catch(e){taskBusy=false;notifyError(e)}
 }
 async function stopTask(){
  try{const r=unwrap(await D.stop_task());status(r.stopped?'Meminta proses dihentikan...':'Tidak ada proses berjalan')}catch(e){notifyError(e)}
 }
 D.onTaskEvent(e=>{
  if(!e)return;
  if(e.type==='line')appendOutput(e.text,!!e.error);
  if(e.type==='done'){
   taskRevision++;
   taskBusy=false;
   appendOutput('\n[SELESAI] Exit code: '+e.code+(e.signal?' · signal '+e.signal:'')+'\n',e.code!==0);
   status(e.code===0?'Task berhasil':'Task gagal (kode '+e.code+')',e.code!==0);
  }
 });
 const saveAll=exclusive(persistAll);
 openProject=exclusive(openProject);newProject=exclusive(newProject);reloadProject=exclusive(reloadProject);
 saveCurrent=exclusive(saveCurrent);newFile=exclusive(newFile);deleteFile=exclusive(deleteFile);startTask=exclusive(startTask);
 window.addEventListener('beforeunload',event=>{if((operationBusy||isDirty())&&!window.confirm(operationBusy?'Operasi proyek belum selesai. Tetap tutup?':'Ada perubahan belum disimpan ke disk. Tetap tutup?')){event.preventDefault();event.returnValue=false}});
 const intercept=(id,callback)=>$(id)?.addEventListener('click',ev=>{
  if(!project&&['save','newFile','deleteFile','open'].includes(id)&&id==='save'){
   // For an unsaved scratch project, preserve the browser download workflow.
   return;
  }
  ev.preventDefault();ev.stopImmediatePropagation();callback();
 },true);
 intercept('open',openProject);intercept('save',saveCurrent);intercept('newFile',newFile);intercept('deleteFile',deleteFile);
 // Native events are delivered by Electron menus (the old wrapper had no working filesystem bridge).
 D.onCommand(command=>{
  const actions={
   'open-folder':openProject,'new-project':newProject,'save-file':saveCurrent,'save-all':saveAll,
   'preview':()=>A.run(),'compile':()=>A.compile(),'format':()=>A.format(),
   'task-run':()=>startTask('run'),'task-check':()=>startTask('check'),
   'task-build':()=>startTask('build'),'task-stop':stopTask,
   'find':showFind,'quick-open':quickOpen
  };
  actions[command]?.();
 });
 // Keys are intercepted in capture phase, before the browser IDE's download handlers.
 document.addEventListener('keydown',event=>{
  const mod=event.ctrlKey||event.metaKey;
  if(mod&&event.key.toLowerCase()==='s'){
   event.preventDefault();event.stopImmediatePropagation();
   event.shiftKey?saveAll():saveCurrent();
  }
  if(mod&&event.key.toLowerCase()==='p'){
   event.preventDefault();event.stopImmediatePropagation();quickOpen();
  }
  if(mod&&event.key.toLowerCase()==='f'&&!event.shiftKey){
   event.preventDefault();event.stopImmediatePropagation();showFind();
  }
 },true);
 // Simple search/replace that works offline without editor dependencies.
 const findPanel=make('div','desktop-find hidden');
 const findInput=make('input');findInput.type='search';findInput.placeholder='Cari teks...';findInput.setAttribute('aria-label','Cari kode');
 const replaceInput=make('input');replaceInput.type='text';replaceInput.placeholder='Ganti dengan...';replaceInput.setAttribute('aria-label','Teks pengganti');
 const findMsg=make('span','desktop-find-info','');
 addButton(findPanel,'Cari ↵','Temukan berikutnya',findNext);
 addButton(findPanel,'Ganti','Ganti seleksi atau temukan berikutnya',replaceNext);
 addButton(findPanel,'Ganti semua','Ganti semua kemunculan',replaceAll);
 addButton(findPanel,'×','Tutup pencarian',()=>findPanel.classList.add('hidden'));
 findPanel.prepend(findInput,replaceInput,findMsg);
 document.querySelector('.editorShell').before(findPanel);
 function showFind(){findPanel.classList.remove('hidden');findInput.focus();findInput.select()}
 function findNext(){
  const term=findInput.value;if(!term)return;
  const content=source.value;let pos=content.toLocaleLowerCase().indexOf(term.toLocaleLowerCase(),source.selectionEnd);
  if(pos<0)pos=content.toLocaleLowerCase().indexOf(term.toLocaleLowerCase());
  if(pos<0){findMsg.textContent='Tidak ditemukan';return}
  source.focus();source.setSelectionRange(pos,pos+term.length);
  const row=content.slice(0,pos).split('\n').length;source.scrollTop=Math.max(0,(row-5)*25);
  findMsg.textContent='Baris '+row;
 }
 function changed(){source.dispatchEvent(new Event('input',{bubbles:true}));renderExplorer()}
 function replaceNext(){
  const term=findInput.value;if(!term)return;
  if(source.value.slice(source.selectionStart,source.selectionEnd).toLocaleLowerCase()!==term.toLocaleLowerCase())findNext();
  if(source.value.slice(source.selectionStart,source.selectionEnd).toLocaleLowerCase()===term.toLocaleLowerCase()){
   source.setRangeText(replaceInput.value,source.selectionStart,source.selectionEnd,'end');changed();
  }
 }
 function replaceAll(){
  const term=findInput.value;if(!term)return;
  const content=source.value;const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const regex=new RegExp(escaped,'gi'),matches=content.match(regex);
  if(!matches){findMsg.textContent='Tidak ditemukan';return}
  source.value=content.replace(regex,()=>replaceInput.value);changed();
  findMsg.textContent=matches.length+' diganti';
 }
 findInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();findNext()}if(e.key==='Escape')findPanel.classList.add('hidden')});
 replaceInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();replaceNext()}if(e.key==='Escape')findPanel.classList.add('hidden')});
 const palette=make('div','desktop-palette hidden');
 const paletteBox=make('div','desktop-palette-box');
 const paletteInput=make('input');paletteInput.type='search';paletteInput.placeholder='Buka berkas proyek...';
 const paletteResults=make('div','desktop-palette-results');
 paletteBox.append(paletteInput,paletteResults);palette.append(paletteBox);document.body.append(palette);
 palette.addEventListener('click',e=>{if(e.target===palette)palette.classList.add('hidden')});
 function quickOpen(){
  if(!project){status('Buka folder proyek terlebih dahulu');return}
  palette.classList.remove('hidden');paletteInput.value='';drawPalette();paletteInput.focus();
 }
 function drawPalette(){
  paletteResults.replaceChildren();const q=paletteInput.value.toLowerCase();
  for(const name of Object.keys(allFiles()).filter(x=>x.toLowerCase().includes(q)).slice(0,40)){
   const b=make('button','desktop-palette-item','◇ '+name);b.onclick=()=>{A.selectFile(name);palette.classList.add('hidden');renderExplorer()};paletteResults.append(b);
  }
 }
 paletteInput.addEventListener('input',drawPalette);
 paletteInput.addEventListener('keydown',e=>{if(e.key==='Escape')palette.classList.add('hidden');if(e.key==='Enter'){paletteResults.querySelector('button')?.click()}});
 document.addEventListener('aksara:studio-refresh',()=>{if(project)renderExplorer()});
 source.addEventListener('input',()=>{if(project)renderExplorer()});
 renderExplorer();
 exclusive(restoreSession)();
})();
