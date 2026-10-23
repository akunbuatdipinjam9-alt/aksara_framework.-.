'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const actions=['open-folder','new-project','reload','save-file','save-all','create-file','delete-file','start-task','stop-task','open-devtools'];
const requests=Object.fromEntries(actions.map(action=>[
 action.replaceAll('-', '_'), args=>ipcRenderer.invoke('aksara:'+action,args)
]));
contextBridge.exposeInMainWorld('aksaraDesktop',Object.freeze({
 platform:process.platform,
 ...requests,
 onCommand(callback){
  if(typeof callback!=='function')return ()=>{};
  const listener=(_event,command)=>callback(command);
  ipcRenderer.on('aksara:command',listener);
  return ()=>ipcRenderer.removeListener('aksara:command',listener);
 },
 onTaskEvent(callback){
  if(typeof callback!=='function')return ()=>{};
  const listener=(_event,data)=>callback(data);
  ipcRenderer.on('aksara:task-event',listener);
  return ()=>ipcRenderer.removeListener('aksara:task-event',listener);
 }
}));
