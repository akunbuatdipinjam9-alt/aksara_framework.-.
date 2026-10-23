'use strict';
const {app,BrowserWindow,Menu,dialog,shell,ipcMain} = require('electron');
const path = require('node:path');
const workspace = require('./workspace.cjs');
const {createRunner} = require('./task-runner.cjs');
const root = path.resolve(__dirname,'..');
let win=null, guideWindow=null, projectRoot=null, runner=null;
function showGuide(){
 if(guideWindow&&!guideWindow.isDestroyed()){guideWindow.focus();return}
 guideWindow=new BrowserWindow({width:960,height:740,minWidth:600,minHeight:400,title:'Panduan Aksara 6.4',backgroundColor:'#101522',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
 guideWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 guideWindow.webContents.on('will-navigate',(event,url)=>{if(url!==guideWindow.webContents.getURL())event.preventDefault()});
 guideWindow.on('closed',()=>{guideWindow=null});
 guideWindow.loadFile(path.join(root,'panduan.html'));
}

const safeError=e=>({ok:false,error:e?.message||'Kesalahan tak dikenal'});
function notify(command){if(win && !win.isDestroyed())win.webContents.send('aksara:command',command)}
function requireProject(){if(!projectRoot)throw Error('Buka folder proyek Aksara terlebih dahulu');return projectRoot}
async function pickFolder(){
 const result=await dialog.showOpenDialog(win,{title:'Pilih folder proyek Aksara',properties:['openDirectory','createDirectory']});
 return result.canceled?null:result.filePaths[0];
}
function bindIpc(){
 const handle=(name,fn)=>ipcMain.handle('aksara:'+name,async(event,args)=>{
  if(!win || event.sender!==win.webContents) return {ok:false,error:'Jendela tidak dikenal'};
  try{return {ok:true,data:await fn(args)}}catch(e){return safeError(e)}
 });
 handle('open-folder',async()=>{
  const chosen=await pickFolder();if(!chosen)return null;
  const found=workspace.readProject(chosen);
  runner?.stop();runner=null;projectRoot=found.path;
  return found;
 });
 handle('new-project',async()=>{
  const chosen=await pickFolder();if(!chosen)return null;
  const found=workspace.createProject(chosen);
  runner?.stop();runner=null;projectRoot=found.path;
  return found;
 });
 handle('reload',()=>projectRoot?{...workspace.readProject(projectRoot),running:!!runner?.busy()}:null);
 handle('save-file',({name,content})=>workspace.saveFile(requireProject(),name,content));
 handle('save-all',({files})=>workspace.saveAll(requireProject(),files));
 handle('create-file',({name,content})=>workspace.saveFile(requireProject(),name,content||'',true));
 handle('delete-file',({name})=>workspace.deleteFile(requireProject(),name));
 handle('start-task',({mode,strict})=>{
  if(runner?.busy())throw Error('Task sudah berjalan');
  const cwd=requireProject();
  // Confirm project files exist and are regular files before running.
  workspace.readProject(cwd);
  const nextRunner=createRunner({root,cwd,emit:msg=>{
   if(runner!==nextRunner)return;
   if(win&&!win.isDestroyed())win.webContents.send('aksara:task-event',msg);
  }});
  runner=nextRunner;runner.start(mode,strict===true);
  return {mode};
 });
 handle('stop-task',()=>({stopped:runner?.stop()||false}));
 handle('open-devtools',()=>{win.webContents.openDevTools({mode:'detach',activate:true});return {opened:true}});
}
function createWindow(){
 win=new BrowserWindow({
  width:1500,height:940,minWidth:1040,minHeight:680,show:false,
  backgroundColor:'#0b101b',title:'Aksara Studio 6.4',
  webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,
   preload:path.join(__dirname,'preload.cjs')}
 });
 win.once('ready-to-show',()=>win.show());
 win.webContents.setWindowOpenHandler(({url})=>{
  if(/^https:\/\//i.test(url)){shell.openExternal(url);return {action:'deny'}}
  if(url.endsWith('/panduan.html')){showGuide();return {action:'deny'}}
  return {action:'deny'};
 });
 win.webContents.on('will-navigate',(ev,url)=>{
  // Renderer navigation never loads arbitrary local or remote content.
  if(url!==win.webContents.getURL())ev.preventDefault();
 });
 win.webContents.session.setPermissionRequestHandler((_wc,_permission,reply)=>reply(false));
 win.on('closed',()=>{runner?.stop();win=null});
 const menu=Menu.buildFromTemplate([
  {label:'Proyek',submenu:[
   {label:'Buka Folder…',accelerator:'CmdOrCtrl+Shift+O',click:()=>notify('open-folder')},
   {label:'Buat Proyek…',click:()=>notify('new-project')},
   {type:'separator'},
   {label:'Simpan Berkas',accelerator:'CmdOrCtrl+S',click:()=>notify('save-file')},
   {label:'Simpan Semua',accelerator:'CmdOrCtrl+Shift+S',click:()=>notify('save-all')},
   {type:'separator'},{role:'quit'}
  ]},
  {label:'Kode',submenu:[
   {label:'Preview Web',accelerator:'CmdOrCtrl+Enter',click:()=>notify('preview')},
   {label:'Compile',accelerator:'F6',click:()=>notify('compile')},
   {label:'Jalankan CLI',accelerator:'F5',click:()=>notify('task-run')},
   {label:'Periksa (Ketat)',accelerator:'F7',click:()=>notify('task-check')},
   {label:'Bangun JavaScript',accelerator:'F8',click:()=>notify('task-build')},
   {label:'Hentikan Task',accelerator:'Shift+F5',click:()=>notify('task-stop')},
   {type:'separator'},
   {label:'Rapikan',accelerator:'CmdOrCtrl+Shift+F',click:()=>notify('format')},
   {label:'Cari dalam Berkas',accelerator:'CmdOrCtrl+F',click:()=>notify('find')},
   {label:'Cepat Buka Berkas',accelerator:'CmdOrCtrl+P',click:()=>notify('quick-open')}
  ]},
  {label:'Tampilan',submenu:[{role:'reload'},{role:'toggleDevTools'},{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'}]},
  {label:'Bantuan',submenu:[
   {label:'Panduan Bahasa',click:showGuide},
   {label:'Tentang',click:()=>dialog.showMessageBox(win,{type:'info',title:'Aksara Studio',message:'Aksara Studio 6.4',detail:'Native workspace, CLI task runner, dan editor bahasa Aksara.'})}
  ]}
 ]);
 Menu.setApplicationMenu(menu);
 win.loadFile(path.join(root,'index.html'));
}
app.whenReady().then(()=>{bindIpc();createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()})});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
