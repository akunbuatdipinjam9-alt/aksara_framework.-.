'use strict';
function AksaraRuntime(){
 const root=typeof globalThis!=='undefined'?globalThis:{};
 const enabled=new Set(),handlers=new Map(),inputHandlers=new Map(),inputs=new Map(),functions=new Map(),memoryStore=new Map(),containers=[],components=new Map(),mounts=new Set(),routes=new Map();let currentPath='/',routeMount=null,refreshQueued=false,routeParams=Object.create(null);let steps=0,currentLine=1,currentFile='program.aks';
 let testPassed=0,testFailed=0;
 const maxSteps=50000;
 let turnSteps=0,resetScheduled=false;
 const browser=typeof document!=='undefined';
 function format(value){if(value===null||value===undefined)return 'kosong';if(value===true)return 'benar';if(value===false)return 'salah';if(typeof value==='object'){try{return JSON.stringify(value)}catch{return '[objek]'}}return String(value)}
 function send(type,value){if(root.__AKSARA_HOST__?.send){root.__AKSARA_HOST__.send(type,value);return}if(type==='print')console.log(value);else if(type==='error')console.error(value)}
 function safeNum(x){const n=Number(x);if(!Number.isFinite(n))throw Error('Nilai bukan angka valid');return n}
 async function http(url,options,read){const parsed=new URL(String(url),browser?location.href:'https://example.com');if(!['https:','http:'].includes(parsed.protocol))throw Error('Alamat HTTP(S) dibutuhkan');const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);try{const response=await fetch(parsed.toString(),{...options,signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);return await read(response)}finally{clearTimeout(timer)}}
 function appendWeb(element){(containers.at(-1)||dom()).append(element);return element}
 function array(x,method){if(!Array.isArray(x))throw Error(`${method} membutuhkan daftar`);return x}
 function dom(){if(!enabled.has('web'))throw Error('Gunakan modul web terlebih dahulu: gunakan web');if(!browser)throw Error('Modul web hanya tersedia di browser');return document.getElementById('aksara-root')||document.body}
 function renderComponent(item){
   item.mount.replaceChildren();const renderer=components.get(item.key);if(!renderer)return;
   const depth=containers.length;containers.push(item.mount);
   try{const ret=renderer(item.props);if(ret&&typeof ret.then==='function')throw Error('Render komponen harus sinkron; gunakan handler asinkron untuk mengambil data')}
   finally{containers.length=depth}
 }
 function queueRefresh(){if(refreshQueued)return;refreshQueued=true;queueMicrotask(()=>{refreshQueued=false;for(const item of mounts){if(item.mount.isConnected===false){mounts.delete(item);continue}try{renderComponent(item)}catch(e){api.fail(e)}}})}
 function renderRoute(path){
   const requested=String(path);
   if(!/^\/[a-zA-Z0-9_/:.\-]*$/.test(requested)||requested.length>250)throw Error('Path navigasi tidak valid');
   const parts=requested.split('/');let selected=null,params=Object.create(null),bestScore=-1;
   for(const [pattern,renderer] of routes){
     const segments=pattern.split('/');if(segments.length!==parts.length)continue;
     const found=Object.create(null);let ok=true,score=0;
     for(let i=0;i<segments.length;i++){
       if(segments[i].startsWith(':'))found[segments[i].slice(1)]=parts[i];
       else if(segments[i]===parts[i])score++;
       else{ok=false;break}
     }
     if(ok&&score>bestScore){selected=renderer;params=found;bestScore=score}
   }
   if(!selected)throw Error('Halaman tidak ditemukan: '+requested);
   // Clear outdated component references when switching between pages.
   for(const item of mounts)if(routeMount.contains?.(item.mount))mounts.delete(item);
   routeMount.replaceChildren();currentPath=requested;routeParams=params;
   const depth=containers.length;containers.push(routeMount);
   try{const ret=selected(params);if(ret&&typeof ret.then==='function')throw Error('Render halaman harus sinkron')}
   finally{containers.length=depth}
 }
 // Hardware is intentionally browser-scoped. Never expose Node/Electron privileges to web code.
 function hardwareAPI(){
  if(!enabled.has('hardware'))throw Error('Aktifkan modul hardware: gunakan hardware');
  if(!browser)throw Error('Hardware API memerlukan browser atau renderer Electron; tidak tersedia di CLI');
  const nav=root.navigator||{};
  const unavailable=(name)=>{throw Error(name+' tidak didukung browser/perangkat ini')};
  const required=(value,name)=>value||unavailable(name);
  const media=async kind=>required(nav.mediaDevices?.getUserMedia,'MediaDevices').call(nav.mediaDevices,{[kind]:true});
  const stop=stream=>{if(!stream?.getTracks)throw Error('Stream tidak valid');stream.getTracks().forEach(track=>track.stop());return true};
  const select=async(method,service,name,options)=>required(service?.[method],name).call(service,options);
  const connectDevice=(method,service,name,options)=>select(method,service,name,options);
  const getStore=()=>required(root.localStorage,'Storage');
  return Object.freeze({
   dukungan:()=>({kamera:!!nav.mediaDevices?.getUserMedia,mikrofon:!!nav.mediaDevices?.getUserMedia,layar:!!nav.mediaDevices?.getDisplayMedia,lokasi:!!nav.geolocation,bluetooth:!!nav.bluetooth,usb:!!nav.usb,serial:!!nav.serial,hid:!!nav.hid,midi:!!nav.requestMIDIAccess,gamepad:!!nav.getGamepads,baterai:!!nav.getBattery,getar:!!nav.vibrate,sensor:!!root.Accelerometer,clipboard:!!nav.clipboard,notifikasi:!!root.Notification,wakelock:!!nav.wakeLock}),
   kamera:Object.freeze({buka:()=>media('video'),tutup:stop}),
   mikrofon:Object.freeze({buka:()=>media('audio'),tutup:stop}),
   audio:Object.freeze({putar:async(src)=>{const a=new Audio(String(src));await a.play();return a},hentikan:a=>{a.pause();a.currentTime=0;return true}}),
   layar:Object.freeze({bagikan:()=>select('getDisplayMedia',nav.mediaDevices,'Screen Capture',{video:true}),hentikan:stop,info:()=>({lebar:root.screen?.width||0,tinggi:root.screen?.height||0})}),
   lokasi:Object.freeze({ambil:(options={})=>new Promise((resolve,reject)=>{required(nav.geolocation,'Geolocation').getCurrentPosition(p=>resolve({lintang:p.coords.latitude,bujur:p.coords.longitude,akurasi:p.coords.accuracy}),reject,{timeout:10000,maximumAge:0,...options})})}),
   bluetooth:Object.freeze({pilih:(filters)=>connectDevice('requestDevice',nav.bluetooth,'Bluetooth',filters||{acceptAllDevices:true})}),
   usb:Object.freeze({pilih:(filters=[])=>connectDevice('requestDevice',nav.usb,'WebUSB',{filters})}),
   serial:Object.freeze({pilih:(filters=[])=>connectDevice('requestPort',nav.serial,'WebSerial',{filters})}),
   hid:Object.freeze({pilih:(filters=[])=>connectDevice('requestDevice',nav.hid,'WebHID',{filters})}),
   midi:Object.freeze({buka:()=>connectDevice('requestMIDIAccess',nav,'WebMIDI',{sysex:false})}),
   gamepad:Object.freeze({daftar:()=>Array.from(required(nav.getGamepads,'Gamepad').call(nav)||[]).filter(Boolean).map(g=>({id:g.id,indeks:g.index,tombol:g.buttons.map(b=>b.value),sumbu:[...g.axes]}))}),
   penyimpanan:Object.freeze({simpan:(k,v)=>{getStore().setItem('aksara-hw:'+String(k),JSON.stringify(v));return true},baca:k=>{const v=getStore().getItem('aksara-hw:'+String(k));return v===null?null:JSON.parse(v)},hapus:k=>{getStore().removeItem('aksara-hw:'+String(k));return true}}),
   sistem:Object.freeze({info:()=>({platform:nav.userAgentData?.platform||nav.platform||'tidak diketahui',bahasa:nav.language||'',inti_logis:nav.hardwareConcurrency??null,memori_gb_perkiraan:nav.deviceMemory??null,online:nav.onLine??null})}),
   printer:Object.freeze({cetak:()=>{required(root.print,'Print').call(root);return true}}),
   baterai:Object.freeze({info:async()=>{const b=await required(nav.getBattery,'Battery').call(nav);return {persen:Math.round(b.level*100),mengisi:b.charging}}}),
   getaran:Object.freeze({getar:durasi=>{const n=Number(durasi);if(!Number.isFinite(n)||n<0||n>5000)throw Error('Durasi getaran harus 0–5000 ms');return required(nav.vibrate,'Vibration').call(nav,n)}}),
   sensor:Object.freeze({akselerometer:(frekuensi=10)=>{const C=required(root.Accelerometer,'Accelerometer');const sensor=new C({frequency:Math.max(1,Math.min(30,Number(frekuensi)||10))});sensor.start();return sensor},hentikan:s=>s.stop()}),
   clipboard:Object.freeze({baca:()=>required(nav.clipboard?.readText,'Clipboard').call(nav.clipboard),tulis:teks=>required(nav.clipboard?.writeText,'Clipboard').call(nav.clipboard,String(teks))}),
   notifikasi:Object.freeze({izin:()=>required(root.Notification?.requestPermission,'Notification').call(root.Notification),kirim:(judul,isi)=>{const N=required(root.Notification,'Notification');if(N.permission!=='granted')throw Error('Izin notifikasi belum diberikan');return new N(String(judul),{body:String(isi??'')})}}),
   wakelock:Object.freeze({aktifkan:()=>required(nav.wakeLock?.request,'Wake Lock').call(nav.wakeLock,'screen'),hentikan:lock=>lock.release()})
  });
 }
 const api={
  hardwareAPI,
  tick(line,file){currentLine=line;currentFile=file||currentFile;steps++;if(!resetScheduled){resetScheduled=true;const timer=setTimeout(()=>{turnSteps=0;resetScheduled=false},0);timer?.unref?.()}if(++turnSteps>maxSteps)throw Error(`${currentFile}:${line}: batas ${maxSteps} instruksi per giliran tercapai`)},
  done(){if(testPassed||testFailed){send('print',`Hasil uji: ${testPassed} lolos, ${testFailed} gagal`);if(testFailed&&typeof process!=='undefined')process.exitCode=1}send('done',{steps,tests:{passed:testPassed,failed:testFailed}})},
  async test(name,fn){if(typeof fn!=='function')throw Error('uji membutuhkan blok');const label=format(name);try{await fn();testPassed++;send('print','✓ '+label);return true}catch(e){testFailed++;send('print','✗ '+label+': '+(e?.message||e));return false}},fail(e){send('error',`${currentFile}:${currentLine} — ${e?.message||e}`)},
  str:format, print(x){send('print',format(x))},
  error:value=>new Error(format(value)),
  callIndex(base,key,args,line){const fn=api.index(base,key,line);if(typeof fn!=='function')throw Error('Target indeks bukan fungsi');return Reflect.apply(fn,base,args)},
  add(a,b){return typeof a==='string'||typeof b==='string'?format(a)+format(b):a+b},
  dict(x){const out=Object.create(null);for(const [k,v] of Object.entries(x))out[k]=v;return out},
  index(v,k,line){if(v==null)throw Error(`Baris ${line}: tidak bisa mengakses indeks dari kosong`);if(['__proto__','constructor','prototype'].includes(String(k)))throw Error('Properti terlarang');return v[k]===undefined?null:v[k]},
  setIndex(v,k,value,line){if(v===null||v===undefined)throw Error(`Baris ${line}: target indeks kosong`);if(['__proto__','constructor','prototype'].includes(String(k)))throw Error('Properti terlarang');if(typeof v!=='object')throw Error('Perubahan indeks hanya pada daftar/kamus');v[k]=value;return value},
  repeatCount(x){const n=Number(x);if(!Number.isInteger(n)||n<0||n>100000)throw Error('Jumlah ulang harus bilangan bulat 0–100000');return n},
  iter(x){if(x==null||typeof x[Symbol.iterator]!=='function')throw Error('untuk setiap membutuhkan daftar atau teks');return x},
  register(name,fn){functions.set(name,fn)},
  num:safeNum,strValue:format,len:x=>x==null?0:(typeof x==='object'&&!Array.isArray(x)?Object.keys(x).length:x.length??0),
  type:x=>x===null?'kosong':Array.isArray(x)?'daftar':typeof x==='object'?'kamus':typeof x==='number'?'angka':typeof x==='string'?'teks':'boolean',
  sum:x=>array(x,'jumlah').reduce((a,b)=>a+safeNum(b),0),
  max:x=>Math.max(...array(x,'maksimum')),min:x=>Math.min(...array(x,'minimum')),
  floor:x=>Math.floor(safeNum(x)),abs:x=>Math.abs(safeNum(x)),sqrt:x=>Math.sqrt(safeNum(x)),pow:(a,b)=>Math.pow(safeNum(a),safeNum(b)),
  ceil:x=>Math.ceil(safeNum(x)),round:x=>Math.round(safeNum(x)),random:()=>Math.random(),
  sort:x=>[...array(x,'urut')].sort((a,b)=>typeof a==='number'&&typeof b==='number'?a-b:String(a).localeCompare(String(b))),
  reverse:x=>Array.isArray(x)?[...x].reverse():[...String(x)].reverse().join(''),
  includes:(x,v)=>Array.isArray(x)?x.includes(v):String(x).includes(String(v)),
  contains:(container,item)=>Array.isArray(container)?container.includes(item):typeof container==='string'?container.includes(String(item)):container&&typeof container==='object'?Object.hasOwn(container,String(item)):false,
  assert:(condition,message='Pernyataan gagal')=>{if(!condition)throw Error(format(message));return true},
  replace:(x,a,b)=>String(x).split(String(a)).join(String(b)),
  range:n=>{n=safeNum(n);if(!Number.isInteger(n)||n<0||n>10000)throw Error('rentang 0–10000');return Array.from({length:n},(_,i)=>i+1)},
  rangeInclusive(start,end,step=1){start=safeNum(start);end=safeNum(end);step=safeNum(step);if(![start,end,step].every(Number.isInteger)||step===0)throw Error('untuk ... dari ... sampai membutuhkan bilangan bulat dan langkah bukan nol');if((end-start)*step<0)return [];const count=Math.floor((end-start)/step)+1;if(count>10000)throw Error('Rentang maksimal 10000 nilai');return Array.from({length:count},(_,i)=>start+i*step)},
  average:x=>{x=array(x,'rata_rata');return x.length?x.reduce((a,b)=>a+safeNum(b),0)/x.length:0},
  unique:x=>[...new Set(array(x,'unik'))],
  slice:(x,a=0,b)=>Array.isArray(x)?x.slice(a,b):String(x).slice(a,b),
  map:(x,fn)=>array(x,'petakan').map(fn),
  filter:(x,fn)=>array(x,'saring').filter(fn),
  find:(x,fn)=>array(x,'temukan').find(fn)??null,
  reduce:(x,fn,initial)=>initial===undefined?array(x,'reduksi').reduce(fn):array(x,'reduksi').reduce(fn,initial),
  every:(x,fn)=>array(x,'semua').every(fn),
  some:(x,fn)=>array(x,'ada').some(fn),
  count:(x,fn)=>array(x,'hitung').filter(fn).length,
  enumerate:x=>array(x,'urutan').map((v,i)=>[i,v]),
  insert:(x,i,v)=>array(x,'sisip').splice(i,0,v),
  merge:(a,b)=>api.dict({...a,...b}),
  format:(s,...values)=>String(s).replace(/\{(\d+)\}/g,(match,n)=>Number(n)<values.length?format(values[Number(n)]):match),
  prettyJSON:x=>JSON.stringify(x,null,2),
  all:x=>Promise.all(array(x,'serentak')),
  race:x=>Promise.race(array(x,'tercepat')),
  randomInt:(a,b)=>{a=safeNum(a);b=safeNum(b);if(!Number.isInteger(a)||!Number.isInteger(b)||b<a)throw Error('acak_antara membutuhkan batas bulat yang valid');return Math.floor(Math.random()*(b-a+1))+a},
  startsWith:(s,p)=>String(s).startsWith(String(p)),
  endsWith:(s,p)=>String(s).endsWith(String(p)),
  trim:s=>String(s).trim(),
  clamp:(n,min,max)=>{n=safeNum(n);min=safeNum(min);max=safeNum(max);if(min>max)throw Error('Batas batasi() terbalik');return Math.max(min,Math.min(n,max))},
  dateFormat:(iso,locale='id-ID')=>{const date=new Date(String(iso));if(Number.isNaN(date.getTime()))throw Error('Tanggal tidak valid');return new Intl.DateTimeFormat(String(locale),{dateStyle:'medium',timeZone:'UTC'}).format(date)},
  now:()=>Date.now(),
  date:(timestamp)=>new Date(timestamp??Date.now()).toISOString(),
  join:(x,s=',')=>array(x,'gabung').map(format).join(s),split:(x,s=' ')=>String(x).split(s),
  upper:x=>String(x).toUpperCase(),lower:x=>String(x).toLowerCase(),
  push:(x,v)=>array(x,'tambah').push(v),remove:(x,i)=>{array(x,'hapus');if(!Number.isInteger(i)||i<0||i>=x.length)throw Error('Indeks hapus invalid');return x.splice(i,1)[0]},
  keys:x=>Object.keys(x),values:x=>Object.values(x),
  toJSON:x=>JSON.stringify(x),fromJSON:x=>JSON.parse(String(x)),
  async resolveProjectFile(filename,{existing=false,extension=null}={}){
    if(browser)throw Error('Operasi file hanya tersedia di Node.js');
    const fs=require('node:fs/promises'),path=require('node:path');
    const relative=String(filename);
    if(!relative||relative.length>240||path.isAbsolute(relative)||relative.includes('\0'))throw Error('Gunakan path relatif di dalam folder proyek');
    if(extension&&!relative.toLowerCase().endsWith(extension))throw Error('Ekstensi file harus '+extension);
    const base=await fs.realpath(process.cwd());const target=path.resolve(base,relative);
    const inside=p=>{const rel=path.relative(base,p);return rel!==''&&!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)};
    if(!inside(target))throw Error('File harus berada di dalam folder proyek');
    const parent=await fs.realpath(path.dirname(target));
    if(parent!==base&&!inside(parent))throw Error('Folder file berada di luar proyek');
    try{const stat=await fs.lstat(target);if(!stat.isFile()||stat.isSymbolicLink())throw Error('File harus berupa berkas biasa, bukan symlink');const real=await fs.realpath(target);if(!inside(real))throw Error('File berada di luar proyek');if(stat.size>1024*1024)throw Error('File maksimal 1 MB')}
    catch(e){if(e.code!=='ENOENT'||existing)throw e}
    return target;
  },
  async readTextFile(filename){const fs=require('node:fs/promises');const file=await api.resolveProjectFile(filename,{existing:true});return fs.readFile(file,'utf8')},
  async writeTextFile(filename,content){const fs=require('node:fs/promises');const file=await api.resolveProjectFile(filename);const text=String(content);if(Buffer.byteLength(text,'utf8')>1024*1024)throw Error('Isi file maksimal 1 MB');await fs.writeFile(file,text,{encoding:'utf8',flag:'w'});return true},
  async listFiles(directory='.'){
    if(browser)throw Error('daftar_file hanya tersedia di Node.js');
    const fs=require('node:fs/promises'),path=require('node:path');const base=await fs.realpath(process.cwd());const name=String(directory);
    if(!name||name.length>240||path.isAbsolute(name))throw Error('Gunakan folder relatif terhadap proyek');
    const target=path.resolve(base,name),rel=path.relative(base,target);
    if(rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw Error('Folder di luar proyek');
    const real=await fs.realpath(target),realRel=path.relative(base,real);
    if(realRel==='..'||realRel.startsWith('..'+path.sep)||path.isAbsolute(realRel))throw Error('Folder di luar proyek');
    const items=await fs.readdir(real,{withFileTypes:true});if(items.length>1000)throw Error('Folder terlalu besar (maksimal 1000 entri)');
    return items.filter(x=>!x.isSymbolicLink()).map(x=>({nama:x.name,jenis:x.isDirectory()?'folder':x.isFile()?'file':'lainnya'}));
  },
  async fetchAPI(url,options={}){
    if(!enabled.has('jaringan'))throw Error('Aktifkan jaringan dengan: gunakan jaringan');
    if(options===null||typeof options!=='object'||Array.isArray(options))throw Error('Opsi HTTP harus kamus');
    const method=String(options.metode??'GET').toUpperCase();if(!['GET','POST','PUT','PATCH','DELETE'].includes(method))throw Error('Metode HTTP tidak didukung');
    const timeout=Number(options.timeout??8000);if(!Number.isInteger(timeout)||timeout<100||timeout>30000)throw Error('Timeout harus 100–30000 ms');
    const headers=options.header??{};if(headers===null||typeof headers!=='object'||Array.isArray(headers))throw Error('Header harus kamus');
    const h={};for(const [key,value] of Object.entries(headers)){if(!/^[A-Za-z0-9-]{1,80}$/.test(key)||String(value).length>4096)throw Error('Header HTTP tidak valid');h[key]=String(value)}
    const body=options.data===undefined?undefined:JSON.stringify(options.data);
    if(body!==undefined){if(new TextEncoder().encode(body).byteLength>1024*1024)throw Error('Body HTTP maksimal 1 MB');if(!Object.keys(h).some(k=>k.toLowerCase()==='content-type'))h['Content-Type']='application/json'}
    if(['GET'].includes(method)&&body!==undefined)throw Error('GET tidak menerima data body');
    const parsed=new URL(String(url));if(!['https:','http:'].includes(parsed.protocol))throw Error('URL harus HTTP(S)');
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);
    try{const response=await fetch(parsed.toString(),{method,headers:h,body,signal:controller.signal,redirect:'follow'});
      const size=Number(response.headers.get('content-length')||0);if(size>1024*1024)throw Error('Respons HTTP maksimal 1 MB');
      const chunks=[];let total=0;const reader=response.body?.getReader();
      if(reader){try{while(true){const part=await reader.read();if(part.done)break;total+=part.value.byteLength;if(total>1024*1024)throw Error('Respons HTTP maksimal 1 MB');chunks.push(part.value)}}finally{await reader.cancel().catch(()=>{})}}
      const text=new TextDecoder().decode(chunks.length?(()=>{const result=new Uint8Array(total);let at=0;for(const part of chunks){result.set(part,at);at+=part.byteLength}return result})():new Uint8Array());let data=text;
      if((response.headers.get('content-type')||'').includes('json')&&text){try{data=JSON.parse(text)}catch{throw Error('Respons server bukan JSON valid')}}
      return {status:response.status,berhasil:response.ok,data,header:api.dict(Object.fromEntries(response.headers))};
    }catch(e){if(controller.signal.aborted)throw Error('Permintaan HTTP melewati batas waktu '+timeout+' ms');throw e}finally{clearTimeout(timer)}
  },
  async postAPI(url,data,options={}){return api.fetchAPI(url,{...options,metode:'POST',data})},
  async parallelMap(items,worker,limit=4){
    items=array(items,'kerjakan_paralel');if(typeof worker!=='function')throw Error('kerjakan_paralel membutuhkan fungsi');
    const n=Number(limit);if(!Number.isInteger(n)||n<1||n>16)throw Error('Batas paralel harus 1–16');
    if(items.length>10000)throw Error('Maksimal 10000 pekerjaan');
    const results=new Array(items.length);let next=0;
    const runner=async()=>{while(next<items.length){const i=next++;results[i]=await worker(items[i],i)}};
    await Promise.all(Array.from({length:Math.min(n,items.length)},runner));return results;
  },
  readEnv(name,fallback=null){if(browser)throw Error('baca_env hanya tersedia di Node.js');const key=String(name);if(!/^[A-Z_][A-Z0-9_]{0,80}$/i.test(key))throw Error('Nama variabel lingkungan tidak valid');return process.env[key]??fallback},
  groupBy(items,key){items=array(items,'kelompokkan');const result=Object.create(null);for(const item of items){const value=typeof key==='function'?key(item):item?.[String(key)];const label=String(value??'kosong');if(['__proto__','constructor','prototype'].includes(label))throw Error('Kunci kelompok tidak diizinkan');(result[label]??=[]).push(item)}return result},
  frequencies(items){items=array(items,'frekuensi');const result=Object.create(null);for(const item of items){const label=format(item);if(['__proto__','constructor','prototype'].includes(label))throw Error('Kunci frekuensi tidak diizinkan');result[label]=(result[label]||0)+1}return result},
  async readJSONFile(filename){
    if(browser)throw Error('baca_file_json hanya tersedia di Node.js, bukan browser');
    const fs=require('node:fs/promises'),path=require('node:path');
    const relative=String(filename);
    if(!relative||relative.length>240||path.isAbsolute(relative))throw Error('Gunakan path JSON relatif terhadap proyek');
    const rootDir=await fs.realpath(process.cwd());
    const candidate=path.resolve(rootDir,relative);
    if(path.relative(rootDir,candidate).startsWith('..')||path.isAbsolute(path.relative(rootDir,candidate)))throw Error('File JSON harus berada di dalam folder proyek');
    const real=await fs.realpath(candidate);
    if(path.relative(rootDir,real).startsWith('..')||path.isAbsolute(path.relative(rootDir,real)))throw Error('File JSON berada di luar folder proyek');
    const stat=await fs.stat(real);
    if(!stat.isFile()||stat.size>1024*1024)throw Error('File JSON harus berukuran maksimal 1 MB');
    try{return JSON.parse(await fs.readFile(real,'utf8'))}catch(e){if(e instanceof SyntaxError)throw Error('Isi file JSON tidak valid: '+e.message);throw e}
  },
  async writeJSONFile(filename,value){
    if(browser)throw Error('simpan_file_json hanya tersedia di Node.js, bukan browser');
    const fs=require('node:fs/promises'),path=require('node:path');
    const relative=String(filename);
    if(!relative||relative.length>240||path.isAbsolute(relative)||!relative.toLowerCase().endsWith('.json'))throw Error('Gunakan nama file .json relatif terhadap proyek');
    const rootDir=await fs.realpath(process.cwd()),target=path.resolve(rootDir,relative),parent=await fs.realpath(path.dirname(target));
    if(parent!==rootDir&& (path.relative(rootDir,parent).startsWith('..')||path.isAbsolute(path.relative(rootDir,parent))))throw Error('File JSON harus berada di dalam folder proyek');
    if(path.relative(rootDir,target).startsWith('..')||path.isAbsolute(path.relative(rootDir,target)))throw Error('File JSON harus berada di dalam folder proyek');
    try{const stat=await fs.lstat(target);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Tidak boleh menimpa symlink atau folder')}catch(e){if(e.code!=='ENOENT')throw e}
    const serialized=JSON.stringify(value,null,2);
    if(serialized===undefined||Buffer.byteLength(serialized,'utf8')>1024*1024)throw Error('Data JSON harus maksimal 1 MB');
    await fs.writeFile(target,serialized+'\n',{encoding:'utf8',flag:'w'});return true;
  },
  input:promptText=>browser?(root.prompt(format(promptText))??''):'',
  sleep:n=>new Promise(resolve=>setTimeout(resolve,Math.max(0,Math.min(10000,safeNum(n))))),
  withTimeout(promise,ms){const timeout=safeNum(ms);if(timeout<1||timeout>60000)throw Error('Batas tunggu harus 1–60000 ms');let timer;return Promise.race([Promise.resolve(promise),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Operasi melebihi batas waktu '+timeout+' ms')),timeout)})]).finally(()=>clearTimeout(timer))},
  allSettled:x=>Promise.allSettled(array(x,'semua_selesai')).then(results=>results.map(item=>item.status==='fulfilled'?{status:'berhasil',nilai:item.value}:{status:'gagal',alasan:String(item.reason?.message||item.reason)})),
  async retry(fn,count=3,delay=0){if(typeof fn!=='function')throw Error('coba_lagi membutuhkan fungsi');count=safeNum(count);delay=safeNum(delay);if(!Number.isInteger(count)||count<1||count>10||delay<0||delay>10000)throw Error('Percobaan atau jeda tidak valid');let last;for(let i=0;i<count;i++){try{return await fn()}catch(e){last=e;if(i+1<count&&delay)await api.sleep(delay)}}throw last},
  async fetchJSON(url){if(!enabled.has('jaringan'))throw Error('Gunakan jaringan terlebih dahulu');return http(url,undefined,response=>response.json())},
  enable(name){if(!['web','matematika','teks','jaringan','data','penyimpanan','javascript','server','database','hardware','python','ai'].includes(name))throw Error(`Modul bawaan '${name}' belum tersedia`);enabled.add(name)},
  container(label){const el=document.createElement('section');el.className='aksara-container';el.dataset.aksaraName=format(label);appendWeb(el);containers.push(el);return el},
  endContainer(){if(!containers.length)throw Error('Tidak ada wadah untuk ditutup');return containers.pop()},
  setClass(label,className){const el=api.findElement(label);const names=format(className);if(!/^[a-zA-Z_][\w-]*(?:\s+[a-zA-Z_][\w-]*)*$/.test(names)||names.length>150)throw Error('Nama kelas tidak valid');el.classList?.add(...names.split(/\s+/));return el},
  findElement(label){const text=format(label);const rootEl=dom();const children=[...rootEl.querySelectorAll('h2,p,button,label,article,section')];const match=children.reverse().find(el=>el.dataset?.aksaraName===text||el.textContent===text||el.getAttribute?.('aria-label')===text||el.querySelector?.('input')?.getAttribute?.('aria-label')===text);if(!match)throw Error('Elemen tidak ditemukan: '+text);return match},
  setStyle(label,property,value){const properties=new Set(['color','background','background-color','padding','margin','gap','display','grid-template-columns','flex-direction','justify-content','align-items','border','border-radius','font-size','font-weight','width','max-width','min-height','text-align','box-shadow']);const key=format(property).toLowerCase();if(!properties.has(key))throw Error('Properti gaya tidak didukung: '+key);const v=format(value);if(v.length>180||/[;{}<>]/.test(v)||/url\s*\(|expression\s*\(|@import/i.test(v))throw Error('Nilai gaya tidak aman');const el=api.findElement(label);el.style.setProperty(key,v);return el},
  page(name){dom();if(browser)document.title=format(name);return name},
  title(name){const el=document.createElement('h2');el.textContent=format(name);appendWeb(el);return el},
  text(name){const el=document.createElement('p');el.textContent=format(name);appendWeb(el);return el},
  button(label,fn){const el=document.createElement('button');const key=format(label);el.textContent=key;el.className='aksara-button';el.addEventListener('click',async()=>{try{if(typeof fn==='function')await fn();else if(typeof fn==='string'){if(!functions.has(fn))throw Error(`Fungsi '${fn}' tidak ditemukan`);await functions.get(fn)()}for(const handler of handlers.get(key)||[])await handler()}catch(e){api.fail(e)}});appendWeb(el);return el},
  onButton(label,callback){dom();const name=format(label);if(!handlers.has(name))handlers.set(name,[]);handlers.get(name).push(callback)},
  clear(){dom().replaceChildren();containers.length=0;inputs.clear();handlers.clear();inputHandlers.clear();mounts.clear();routeMount=null;routes.clear()},
  background(color){dom().style.backgroundColor=format(color)},
  titleColor(color){dom().style.setProperty('--aksara-title-color',format(color))},
  changeTitle(text){const heading=dom().querySelector('h2');if(!heading)throw Error('Judul belum dibuat');heading.textContent=format(text)},
  inputField(label){const name=format(label),wrap=document.createElement('label');wrap.className='aksara-field';const title=document.createElement('span');title.textContent=name;const el=document.createElement('input');el.type='text';el.placeholder=name;el.autocomplete='off';el.setAttribute('aria-label',name);wrap.append(title,el);appendWeb(wrap);inputs.set(name,el);el.addEventListener('input',async()=>{for(const fn of inputHandlers.get(name)||[]){try{await fn()}catch(e){api.fail(e)}}});return el},
  numberField(label){const el=api.inputField(label);el.type='number';el.inputMode='decimal';el.step='any';return el},
  inputValue(label){dom();return inputs.get(format(label))?.value??''},
  numberValue(label){dom();const name=format(label),el=inputs.get(name);if(!el)throw Error(`Masukan '${name}' tidak ditemukan`);if(el.value.trim()==='')throw Error(`Masukan '${name}' masih kosong`);return safeNum(el.value)},
  setInputValue(label,value){dom();const name=format(label),el=inputs.get(name);if(!el)throw Error(`Masukan '${name}' tidak ditemukan`);el.value=format(value);el.dispatchEvent(new Event('input',{bubbles:true}));return el.value},
  inputClear(label){dom();const el=inputs.get(format(label));if(el)el.value=''},
  onInput(label,callback){dom();const name=format(label);if(!inputHandlers.has(name))inputHandlers.set(name,[]);inputHandlers.get(name).push(callback)},
  card(content){const el=document.createElement('article');el.className='aksara-card';el.textContent=format(content);appendWeb(el);return el},
  theme(name){const theme=format(name).toLowerCase();if(!['gelap','terang'].includes(theme))throw Error('Tema harus "gelap" atau "terang"');dom().dataset.theme=theme},
  setText(oldText,newText){const text=format(oldText),rootEl=dom();let found=false;for(const el of rootEl.querySelectorAll('p,h2,article')){if(el.textContent===text){el.textContent=format(newText);found=true;break}}if(!found)throw Error('Teks tidak ditemukan: '+text)},
  list(label,values){dom();return api.setList(label,values)},
  setList(label,values){const rootEl=dom(),key=format(label);let el=[...rootEl.querySelectorAll('[data-list-key]')].find(x=>x.dataset.listKey===key);if(!el){const section=document.createElement('section');section.className='aksara-list-section';const h=document.createElement('h3');h.textContent=key;el=document.createElement('ul');el.dataset.listKey=key;section.append(h,el);(containers.at(-1)||rootEl).append(section)}el.replaceChildren();for(const item of array(values,'web_daftar')){const li=document.createElement('li');li.textContent=format(item);el.append(li)}return el},
  chart(label,data){const values=array(data,'web_grafik').map(safeNum);if(values.length>60)throw Error('Grafik maksimal 60 data');const wrap=document.createElement('section');wrap.className='aksara-chart';const h=document.createElement('h3');h.textContent=format(label);const barWrap=document.createElement('div');barWrap.className='aksara-bars';const max=Math.max(1,...values.map(v=>Math.abs(v)));for(let i=0;i<values.length;i++){const cell=document.createElement('div');cell.className='aksara-bar-cell';const bar=document.createElement('div');bar.className='aksara-bar';bar.style.height=Math.max(2,Math.abs(values[i])/max*100)+'%';bar.title=`Nilai ${i+1}: ${values[i]}`;const val=document.createElement('span');val.textContent=format(values[i]);cell.append(bar,val);barWrap.append(cell)}wrap.append(h,barWrap);appendWeb(wrap);return wrap},
  async storageSet(key,value){if(!enabled.has('penyimpanan'))throw Error('Aktifkan: gunakan penyimpanan');const k=format(key);if(k.length>120)throw Error('Kunci terlalu panjang');const serialized=JSON.stringify(value);if(serialized===undefined||serialized.length>50000)throw Error('Data tidak bisa disimpan atau melebihi 50 KB');if(root.__AKSARA_HOST__?.request)return root.__AKSARA_HOST__.request('storageSet',{key:k,value:serialized});if(browser){localStorage.setItem('aksara-v2:'+k,serialized);return true}memoryStore.set(k,serialized);return true},
  async storageGet(key){if(!enabled.has('penyimpanan'))throw Error('Aktifkan: gunakan penyimpanan');const k=format(key);let raw;if(root.__AKSARA_HOST__?.request)raw=await root.__AKSARA_HOST__.request('storageGet',{key:k});else if(browser)raw=localStorage.getItem('aksara-v2:'+k);else raw=memoryStore.get(k);return raw==null?null:JSON.parse(raw)},
  async storageDelete(key){if(!enabled.has('penyimpanan'))throw Error('Aktifkan: gunakan penyimpanan');const k=format(key);if(root.__AKSARA_HOST__?.request)return root.__AKSARA_HOST__.request('storageDelete',{key:k});if(browser)localStorage.removeItem('aksara-v2:'+k);else memoryStore.delete(k);return true},
  async storageKeys(){if(!enabled.has('penyimpanan'))throw Error('Aktifkan: gunakan penyimpanan');if(root.__AKSARA_HOST__?.request)return root.__AKSARA_HOST__.request('storageKeys',{});if(browser)return Object.keys(localStorage).filter(k=>k.startsWith('aksara-v2:')).map(k=>k.slice(10));return [...memoryStore.keys()]},
  async fetchText(url){if(!enabled.has('jaringan'))throw Error('Aktifkan: gunakan jaringan');return http(url,undefined,async response=>(await response.text()).slice(0,100000))},
  async postJSON(url,payload){if(!enabled.has('jaringan'))throw Error('Aktifkan: gunakan jaringan');return http(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)},async response=>{const text=(await response.text()).slice(0,100000);try{return JSON.parse(text)}catch{return text}})},
  openDatabase(filename){
    if(browser)throw Error('SQLite hanya tersedia di CLI Node.js');
    if(!enabled.has('database'))throw Error('Aktifkan database: gunakan database');
    if(typeof require!=='function')throw Error('SQLite memerlukan Node.js');
    const fs=require('node:fs'),path=require('node:path');
    const name=String(filename);
    if(!name||name===':memory:'||name.includes('\0')||path.isAbsolute(name)||path.win32.isAbsolute(name)||name.split(/[\\/]/).includes('..')||!/[.](?:sqlite|db)$/i.test(name))throw Error('Gunakan path relatif .db/.sqlite tanpa ..');
    let DatabaseSync;try{({DatabaseSync}=require('node:sqlite'))}catch{throw Error('SQLite native membutuhkan Node.js 22.13+ (disarankan Node 24)')}
    const base=fs.realpathSync(process.cwd());
    const location=path.resolve(base,name);
    if(!location.startsWith(base+path.sep))throw Error('Database harus berada di folder proyek');
    // Reject existing symlinks on every path segment, including the database file itself.
    const relative=path.relative(base,location).split(path.sep);let cursor=base;
    for(const part of relative){cursor=path.join(cursor,part);if(fs.lstatSync(cursor,{throwIfNoEntry:false})?.isSymbolicLink())throw Error('Symlink database tidak diizinkan')}
    fs.mkdirSync(path.dirname(location),{recursive:true});
    if(!fs.realpathSync(path.dirname(location)).startsWith(base+path.sep)&&fs.realpathSync(path.dirname(location))!==base)throw Error('Database di luar folder proyek');
    const db=new DatabaseSync(location);db.exec('PRAGMA foreign_keys = ON');db.exec('PRAGMA busy_timeout = 3000');
    let closed=false,inTransaction=false;
    function statement(sql,params=[]){if(closed)throw Error('Database sudah ditutup');if(typeof sql!=='string'||!sql.trim())throw Error('SQL tidak valid');if(!Array.isArray(params))throw Error('Parameter SQL harus daftar');if(params.length>999)throw Error('Parameter SQL terlalu banyak');return {stmt:db.prepare(sql),args:params.map(x=>{if(x===undefined||x===null)return null;if(typeof x==='boolean')return x?1:0;if(typeof x==='number'&&!Number.isFinite(x))throw Error('Parameter SQL angka tidak valid');if(!['string','number','bigint'].includes(typeof x)&&!Buffer.isBuffer(x))throw Error('Parameter SQL harus teks, angka, boolean, buffer atau kosong');return x})}}
    return {
      jalankan(sql,params=[]){const {stmt,args}=statement(sql,params);const r=stmt.run(...args);return {perubahan:r.changes,id_terakhir:String(r.lastInsertRowid)}},
      satu(sql,params=[]){const {stmt,args}=statement(sql,params);return stmt.get(...args)??null},
      semua(sql,params=[]){const {stmt,args}=statement(sql,params);return stmt.all(...args)},
      transaksi(fn){if(closed)throw Error('Database sudah ditutup');if(typeof fn!=='function'||Object.prototype.toString.call(fn)==='[object AsyncFunction]')throw Error('Transaksi membutuhkan fungsi sinkron, bukan async');if(inTransaction)throw Error('Transaksi bersarang tidak didukung');db.exec('BEGIN IMMEDIATE');inTransaction=true;try{const result=fn();if(result&&typeof result.then==='function'){Promise.resolve(result).catch(()=>{});throw Error('Transaksi tidak mendukung fungsi async')}db.exec('COMMIT');return result}catch(e){try{db.exec('ROLLBACK')}catch{}throw e}finally{inTransaction=false}},
      tutup(){if(inTransaction)throw Error('Database tidak boleh ditutup di dalam transaksi');if(!closed){db.close();closed=true}return true}
    };
  },
  makeServer(port=3000){
    if(browser)throw Error('HTTP Server hanya tersedia di CLI Node.js, bukan Preview Web');
    if(!enabled.has('server'))throw Error('Gunakan server terlebih dahulu: gunakan server');
    if(typeof require!=='function')throw Error('Runtime Node.js diperlukan untuk server');
    const nodeHttp=require('node:http');
    if(!Number.isInteger(Number(port))||Number(port)<0||Number(port)>65535)throw Error('Port server harus 0–65535');
    const routesByMethod=new Map(),middlewares=[];let server=null;const security={bodyLimit:65536,timeout:10000,corsOrigins:[],maxRequests:100,windowMs:60000};const counters=new Map();
    const normalizePath=path=>{const text=String(path);if(!text.startsWith('/')||text.length>200||/[?#\r\n]/.test(text))throw Error('Path rute harus dimulai /, tanpa query atau fragmen');return text};
    function register(method,path,handler){const route=normalizePath(path);if(typeof handler!=='function')throw Error('Handler rute harus fungsi Aksara');const key=method+' '+route;if(routesByMethod.has(key))throw Error('Rute sudah didaftarkan: '+key);const parts=route.split('/');routesByMethod.set(key,{method,route,parts,handler});return app}
    const app={
      get(path,handler){return register('GET',path,handler)},
      post(path,handler){return register('POST',path,handler)},
      put(path,handler){return register('PUT',path,handler)},
      hapus(path,handler){return register('DELETE',path,handler)},
      keamanan(options){if(server)throw Error('Atur keamanan sebelum server dijalankan');if(!options||typeof options!=='object')throw Error('Opsi keamanan harus kamus');for(const [key,value] of Object.entries(options)){if(!['bodyLimit','timeout','corsOrigins','maxRequests','windowMs'].includes(key))throw Error('Opsi keamanan tidak dikenal: '+key);if(key==='corsOrigins'){if(!Array.isArray(value)||value.length>20||value.some(x=>{if(typeof x!=='string')return true;try{const u=new URL(x);return !['http:','https:'].includes(u.protocol)||u.origin!==x||Boolean(u.username||u.password)}catch{return true}}))throw Error('CORS origin tidak valid');security[key]=[...new Set(value)]}else{if(!Number.isInteger(value)||value<1||value> (key==='bodyLimit'?1048576:key==='timeout'?120000:key==='maxRequests'?10000:3600000))throw Error('Nilai keamanan tidak valid: '+key);security[key]=value}}return app},
      pakai(fn){if(typeof fn!=='function')throw Error('Middleware harus fungsi');middlewares.push(fn);return app},
      alamat(){if(!server?.listening)throw Error('Server belum berjalan');return 'http://127.0.0.1:'+server.address().port},
      async jalankan(chosenPort=port){if(server)throw Error('Server sudah dimulai');const portValue=Number(chosenPort);if(!Number.isInteger(portValue)||portValue<0||portValue>65535)throw Error('Port tidak valid');
        server=nodeHttp.createServer(async(req,res)=>{
          req.on('error',()=>{});
          res.setHeader('X-Content-Type-Options','nosniff');
          res.setHeader('Cache-Control','no-store');
          res.setHeader('X-Frame-Options','DENY');
          res.setHeader('Referrer-Policy','no-referrer');
          res.setTimeout(security.timeout,()=>{if(!res.writableEnded&&!res.destroyed){res.writeHead(408,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({kesalahan:'Request timeout'}))}});
          const ip=req.socket.remoteAddress||'unknown';const now=Date.now();const record=counters.get(ip)||{start:now,count:0};if(now-record.start>security.windowMs){record.start=now;record.count=0}record.count++;counters.set(ip,record);
          if(counters.size>2000){for(const [key,value] of counters)if(now-value.start>security.windowMs)counters.delete(key)}
          if(record.count>security.maxRequests){res.writeHead(429,{'Content-Type':'application/json','Retry-After':String(Math.ceil(security.windowMs/1000))});res.end(JSON.stringify({kesalahan:'Terlalu banyak permintaan'}));return}
          const origin=req.headers.origin;
          if(origin&&security.corsOrigins.includes(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type')}
          if(req.method==='OPTIONS'){res.statusCode=origin&&security.corsOrigins.includes(origin)?204:403;res.end();return}
          if(req.headers['content-length']&&Number(req.headers['content-length'])>security.bodyLimit){res.writeHead(413);res.end();return}
          if(origin&&!security.corsOrigins.includes(origin)){res.writeHead(403,{'Content-Type':'application/json'});res.end(JSON.stringify({kesalahan:'Origin tidak diizinkan'}));return}
          let done=false;let status=200;
          const reply={
            status(code){if(!Number.isInteger(code)||code<100||code>599)throw Error('Status HTTP harus 100–599');status=code;return reply},
            header(name,value){const key=String(name);if(!/^[a-zA-Z][a-zA-Z0-9-]{0,60}$/.test(key)||['set-cookie','access-control-allow-origin','content-security-policy','content-length','transfer-encoding','connection'].includes(key.toLowerCase()))throw Error('Header tidak diizinkan');res.setHeader(key,String(value));return reply},
            kirim(value){if(done||res.writableEnded||res.destroyed)return false;res.statusCode=status;res.setHeader('Content-Type','text/plain; charset=utf-8');res.end(format(value));done=true;return true},
            json(value){if(done||res.writableEnded||res.destroyed)return false;const data=JSON.stringify(value);if(data===undefined)throw Error('JSON tidak valid');res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(data);done=true;return true}
          };
          try{
            const url=new URL(req.url,'http://localhost');let pathname;try{pathname=decodeURIComponent(url.pathname)}catch{throw Object.assign(Error('Path URL tidak valid'),{httpStatus:400})};if(/\0/.test(pathname))throw Object.assign(Error('Path tidak valid'),{httpStatus:400});
            if(pathname.length>1024)throw Object.assign(Error('Path terlalu panjang'),{httpStatus:414});
            const query=Object.create(null);for(const [k,v] of url.searchParams){if(!['__proto__','constructor','prototype'].includes(k))query[k]=v}
            const chunks=await new Promise((resolve,reject)=>{
              const parts=[];let size=0;
              const cleanup=()=>{req.removeListener('data',data);req.removeListener('end',end);req.removeListener('error',error);req.removeListener('aborted',aborted);res.removeListener('close',aborted)};
              const error=e=>{cleanup();reject(e)};
              const aborted=()=>error(Object.assign(Error('Request terputus'),{httpStatus:400}));
              const data=chunk=>{size+=chunk.length;if(size>security.bodyLimit){res.setHeader('Connection','close');error(Object.assign(Error('Body melebihi batas'),{httpStatus:413}));req.resume()}else parts.push(chunk)};
              const end=()=>{cleanup();resolve(parts)};
              req.on('data',data);req.once('end',end);req.once('error',error);req.once('aborted',aborted);res.once('close',aborted);
            });
            if(res.writableEnded||res.destroyed)return;
            const raw=Buffer.concat(chunks).toString('utf8');let body=raw;
            if((req.headers['content-type']||'').includes('application/json')&&raw){try{body=JSON.parse(raw)}catch{throw Object.assign(Error('JSON request tidak valid'),{httpStatus:400})}}
            const request={metode:req.method,jalur:pathname,query,body,header:Object.assign(Object.create(null),req.headers),parameter:Object.create(null)};
            for(const middleware of middlewares){const allow=await middleware(request,reply);if(done||res.writableEnded||res.destroyed)return;if(allow===false){reply.status(403).json({kesalahan:'Akses ditolak'});return}}
            const parts=pathname.split('/');let matched=null,bestScore=-1;
            for(const route of routesByMethod.values()){
              if(route.method!==req.method||route.parts.length!==parts.length)continue;
              const params=Object.create(null);let valid=true,score=0;
              for(let i=0;i<parts.length;i++){
                if(route.parts[i].startsWith(':'))params[route.parts[i].slice(1)]=parts[i];
                else if(route.parts[i]!==parts[i]){valid=false;break}else score++;
              }
              if(valid&&score>bestScore){matched=route;bestScore=score;request.parameter=params}
            }
            if(!matched){reply.status(404).json({kesalahan:'Rute tidak ditemukan'});return}
            const answer=await matched.handler(request,reply);
            if(!done){if(answer===undefined||answer===null)reply.status(204).kirim('');else if(typeof answer==='object')reply.json(answer);else reply.kirim(answer)}
          }catch(err){if(done||res.writableEnded||res.destroyed)return;const code=err.httpStatus||500;reply.status(code).json({kesalahan:code===500?'Kesalahan internal server':err.message});if(code===500)console.error('[Aksara HTTP]',err.message)}
        });
        try{await new Promise((resolve,reject)=>{const onError=e=>{server.removeListener('listening',resolve);reject(e)};server.once('error',onError);server.once('listening',()=>{server.removeListener('error',onError);resolve()});server.listen(portValue,'127.0.0.1')})}catch(e){server=null;throw e}
        return app.alamat();
      },
      async tutup(){if(!server)return false;const old=server;server=null;await new Promise((resolve,reject)=>old.close(e=>e?reject(e):resolve()));return true}
    };
    return app;
  },
  mediaRule(minWidth,className,rules){
    dom();const px=Number(minWidth);
    if(!Number.isInteger(px)||px<320||px>2560)throw Error('Breakpoint harus 320–2560 px');
    const key=String(className);if(!/^[a-zA-Z_][\w-]{0,60}$/.test(key))throw Error('Kelas CSS tidak valid');
    if(!rules||typeof rules!=='object'||Array.isArray(rules))throw Error('Aturan responsif harus kamus');
    const rule=Object.entries(rules).map(([property,value])=>{
      const allowed=new Set(['display','grid-template-columns','flex-direction','width','max-width','padding','gap','font-size']);
      if(!allowed.has(property)||typeof value!=='string'||value.length>180||/[;{}<>]/.test(value)||/url\s*\(|expression\s*\(|@import/i.test(value))throw Error('Properti responsif tidak valid: '+property);
      return property+':'+value;
    });
    let element=document.querySelector('style[data-aksara-media="'+key+'"][data-aksara-min-width="'+px+'"]');
    if(!element){element=document.createElement('style');element.dataset.aksaraMedia=key;element.dataset.aksaraMinWidth=String(px);document.head.append(element)}
    element.textContent='@media (min-width:'+px+'px){.'+key+'{'+rule.join(';')+'}}';return key;
  },
  navigateLink(label,path){dom();const link=document.createElement('a');link.textContent=format(label);link.href='#'+String(path);link.addEventListener('click',event=>{event.preventDefault();api.navigate(path)});appendWeb(link);return link},
  styleRule(className,rules){dom();const name=String(className);if(!/^[a-zA-Z_][\w-]{0,60}$/.test(name))throw Error('Kelas CSS tidak valid');if(!rules||typeof rules!=='object'||Array.isArray(rules))throw Error('Aturan CSS harus kamus');const allowed=new Set(['color','background','background-color','padding','margin','gap','display','grid-template-columns','flex-direction','justify-content','align-items','border','border-radius','font-size','font-weight','width','max-width','min-height','text-align','box-shadow']);const declarations=[];for(const [key,value] of Object.entries(rules)){const v=String(value);if(!allowed.has(key)||v.length>180||/[;{}<>]/.test(v)||/url\s*\(|expression\s*\(|@import/i.test(v))throw Error('CSS tidak aman: '+key);declarations.push(key+':'+v)}let el=document.querySelector('style[data-aksara-style="'+name+'"]');if(!el){el=document.createElement('style');el.dataset.aksaraStyle=name;document.head.append(el)}el.textContent='.'+name+'{'+declarations.join(';')+'}';return name},
  state(initial){dom();let value=initial;const state={};Object.defineProperty(state,'nilai',{enumerable:true,get(){return value},set(next){if(Object.is(value,next))return;value=next;queueRefresh()}});return state},
  component(name,renderer){dom();const key=format(name);if(!key||key.length>80||typeof renderer!=='function')throw Error('Komponen memerlukan nama dan fungsi render');components.set(key,renderer);return key},
  mountComponent(name,props={}){dom();const key=format(name);if(!components.has(key))throw Error('Komponen belum terdaftar: '+key);if(!props||typeof props!=='object'||Array.isArray(props))throw Error('Properti komponen harus kamus');const mount=document.createElement('div');mount.className='aksara-component';mount.dataset.aksaraName=key;appendWeb(mount);const item={key,mount,props};mounts.add(item);renderComponent(item);return mount},
  route(path,renderer){dom();const key=String(path);if(!/^\/[a-zA-Z0-9_/:.-]*$/.test(key)||typeof renderer!=='function')throw Error('Rute web tidak valid');routes.set(key,renderer);return key},
  startRouter(){dom();if(routeMount)return routeMount;routeMount=document.createElement('div');routeMount.className='aksara-router';appendWeb(routeMount);
    const initial=typeof root.location?.hash==='string'&&root.location.hash.startsWith('#/')?root.location.hash.slice(1):'/';
    try{renderRoute(initial)}catch{renderRoute('/')}
    if(typeof root.addEventListener==='function')root.addEventListener('hashchange',()=>{if(!routeMount?.isConnected)return;const path=root.location.hash.startsWith('#/')?root.location.hash.slice(1):'/';try{if(path!==currentPath)renderRoute(path)}catch(e){api.fail(e)}});
    return routeMount},
  navigate(path){dom();if(!routeMount)throw Error('Panggil web_mulai_rute() dahulu');renderRoute(path);if(root.location)root.location.hash='#'+currentPath;return currentPath},
  currentRoute(){dom();return {jalur:currentPath,parameter:routeParams}},
  importPython(moduleName){
    if(!enabled.has('python'))throw Error('Aktifkan: gunakan python');
    const name=String(moduleName);
    if(!/^[a-zA-Z_][a-zA-Z0-9_.]{0,100}$/.test(name)||name.split('.').some(part=>part.startsWith('_')))throw Error('Nama modul Python tidak valid');
    return new Proxy(Object.create(null),{get(_target,property){
      if(typeof property!=='string'||property==='then'||property==='toJSON'||property==='inspect'||property.startsWith('_')||! /^[a-zA-Z][a-zA-Z0-9_]{0,80}$/.test(property))return undefined;
      return (...args)=>api.pythonCallAsync(name,property,args);
    }});
  },
  async pythonCallAsync(moduleName,functionName,args=[],timeoutMs=12000){
    if(!enabled.has('python'))throw Error('Aktifkan: gunakan python');
    if(browser)throw Error('Python hanya tersedia pada runtime CLI Node.js');
    const name=String(moduleName),fn=String(functionName),limit=Number(timeoutMs);
    if(!/^[a-zA-Z_][a-zA-Z0-9_.]{0,100}$/.test(name)||name.split('.').some(x=>x.startsWith('_'))||!/^[a-zA-Z][a-zA-Z0-9_]{0,80}$/.test(fn))throw Error('Nama modul/fungsi Python tidak valid');
    if(!Array.isArray(args))throw Error('Argumen Python harus daftar');
    if(!Number.isInteger(limit)||limit<1||limit>60000)throw Error('Batas waktu Python harus 1–60000 ms');
    const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
    const venv=path.join(process.cwd(),'.aksara-venv');
    const executable=process.platform==='win32'?path.join(venv,'Scripts','python.exe'):path.join(venv,'bin','python');
    if(!fs.existsSync(executable))throw Error('Python venv belum tersedia. Jalankan: node cli.js paket py:siapkan');
    const script='import json,sys,importlib,contextlib\ntry:\n p=json.loads(sys.stdin.read())\n with contextlib.redirect_stdout(sys.stderr):\n  m=importlib.import_module(p["module"])\n  f=getattr(m,p["function"])\n  if not callable(f): raise TypeError("Target bukan fungsi")\n  r=f(*p["args"])\n print(json.dumps({"ok":True,"value":r},allow_nan=False))\nexcept Exception as e:\n print(json.dumps({"ok":False,"error":str(e)}))';
    const input=JSON.stringify({module:name,function:fn,args});
    if(Buffer.byteLength(input,'utf8')>1024*1024)throw Error('Argumen Python terlalu besar (maksimal 1 MB)');
    return new Promise((resolve,reject)=>{
      let finished=false,out='',err='';
      const child=cp.spawn(executable,['-I','-X','utf8','-c',script],{cwd:process.cwd(),stdio:['pipe','pipe','pipe'],windowsHide:true});
      const finish=(error,value)=>{if(finished)return;finished=true;clearTimeout(timer);if(error)reject(error);else resolve(value)};
      const timer=setTimeout(()=>{child.kill();finish(Error('Python melebihi batas waktu '+limit+' ms'))},limit);
      child.on('error',e=>finish(Error('Python gagal: '+e.message)));
      const collect=(chunk,stream)=>{if(finished)return;const value=chunk.toString('utf8');if(stream==='out')out+=value;else err+=value;if(Buffer.byteLength(out,'utf8')>1024*1024||Buffer.byteLength(err,'utf8')>1024*1024){child.kill();finish(Error('Output Python melebihi 1 MB'))}};
      child.stdout.on('data',chunk=>collect(chunk,'out'));child.stderr.on('data',chunk=>collect(chunk,'err'));
      child.on('close',code=>{if(finished)return;if(code!==0)return finish(Error('Python berhenti: '+err.slice(0,300)));let result;try{result=JSON.parse(out.trim())}catch{return finish(Error('Hasil Python bukan JSON'))}if(!result.ok)return finish(Error('Python: '+result.error));finish(null,result.value)});
      child.stdin.on('error',()=>{});child.stdin.end(input);
    });
  },
  pythonCall(moduleName,functionName,args=[]){
    if(!enabled.has('python'))throw Error('Aktifkan: gunakan python');
    if(browser)throw Error('Python hanya tersedia pada runtime CLI Node.js');
    const name=String(moduleName),fn=String(functionName);
    if(!/^[a-zA-Z_][a-zA-Z0-9_.]{0,100}$/.test(name)||name.split('.').some(x=>x.startsWith('_'))||!/^[a-zA-Z][a-zA-Z0-9_]{0,80}$/.test(fn))throw Error('Nama modul/fungsi Python tidak valid');
    if(!Array.isArray(args))throw Error('Argumen Python harus array');
    const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
    const venv=path.join(process.cwd(),'.aksara-venv');
    const executable=process.platform==='win32'?path.join(venv,'Scripts','python.exe'):path.join(venv,'bin','python');
    if(!fs.existsSync(executable))throw Error('Python venv belum tersedia. Jalankan: node cli.js paket py:siapkan');
    const script='import json,sys,importlib,contextlib\ntry:\n p=json.loads(sys.stdin.read())\n with contextlib.redirect_stdout(sys.stderr):\n  m=importlib.import_module(p["module"])\n  f=getattr(m,p["function"])\n  if not callable(f): raise TypeError("Target bukan fungsi")\n  r=f(*p["args"])\n print(json.dumps({"ok":True,"value":r},allow_nan=False))\nexcept Exception as e:\n print(json.dumps({"ok":False,"error":str(e)}))';
    const child=cp.spawnSync(executable,['-I','-X','utf8','-c',script],{input:JSON.stringify({module:name,function:fn,args}),encoding:'utf8',timeout:12000,maxBuffer:1024*1024,cwd:process.cwd()});
    if(child.error)throw Error('Python gagal: '+child.error.message);
    if(child.status!==0)throw Error('Python berhenti: '+String(child.stderr||'').slice(0,300));
    let result;try{result=JSON.parse(child.stdout.trim())}catch{throw Error('Hasil Python bukan JSON. Gunakan fungsi yang menghasilkan tipe JSON.')}
    if(!result.ok)throw Error('Python: '+result.error);
    return result.value;
  },
  async aiAsk(prompt,model='llama3.2'){
    if(!enabled.has('ai'))throw Error('Aktifkan: gunakan ai');
    if(browser)throw Error('ai_tanya tersedia pada CLI Node.js; browser memerlukan backend sendiri');
    if(typeof prompt!=='string'||prompt.length>12000||typeof model!=='string'||!/^[a-zA-Z0-9_.:-]{1,80}$/.test(model))throw Error('Prompt atau model AI tidak valid');
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),60000);
    try{const response=await fetch('http://127.0.0.1:11434/api/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model,prompt,stream:false}),signal:controller.signal});if(!response.ok)throw Error('Ollama HTTP '+response.status);const data=await response.json();if(typeof data.response!=='string')throw Error('Respons Ollama tidak valid');return data.response}
    finally{clearTimeout(timer)}
  },
  async importJS(name){if(!enabled.has('javascript'))throw Error('Aktifkan: gunakan javascript');if(browser)throw Error('modul_js hanya tersedia di CLI Node.js, bukan browser');const path=String(name);if(!/^(?:node:[a-z][a-z0-9_/-]*|@[a-z\d_-]+\/[a-z\d_.-]+|[a-z\d][a-z\d_.-]*)$/i.test(path)||path.length>120)throw Error('Nama modul JavaScript tidak valid');const {createRequire}=require('node:module');const projectRequire=createRequire(require('node:path').join(process.cwd(),'package.json'));const loaded=path.startsWith('node:')?await import(path):projectRequire(path);return loaded.default??loaded},
 };

 api.str=api.strValue; // method 'teks()' uses same format as diagnostics.
 return api;
}
if(typeof module!=='undefined'&&module.exports)module.exports=AksaraRuntime;
