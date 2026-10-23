'use strict';
(()=>{
const $=id=>document.getElementById(id);
const example={
web:`# Aksara 2.5 — Website interaktif\ngunakan web\nbuat halaman bernama "Beranda"\natur latar halaman menjadi "#f4f7ff"\nbuat judul "Website Aksara"\nbuat teks "Ditulis dalam Bahasa Indonesia."\nbuat tombol "Mulai"\nketika tombol "Mulai" diklik\n    ubah judul menjadi "Halo dari Aksara!"\n    buat teks "Tombol berhasil diklik."\n    tampilkan "Event berhasil!"\nselesai`,
oop:`kelas Kendaraan\n    fungsi mulai(merk)\n        diri.merk = merk\n    selesai\n    fungsi info()\n        tampilkan "Merk: " + diri.merk\n    selesai\nselesai\nkelas Mobil mewarisi Kendaraan\n    fungsi klakson()\n        tampilkan "Tin tin!"\n    selesai\nselesai\ningat mobil sebagai baru Mobil("Toyota")\nmobil.info()\nmobil.klakson()`,
modules:`impor sapa dari "salam"\ntampilkan sapa("Aksara")`,
async:`fungsi asinkron hitung()\n    tunggu jeda(50)\n    kembalikan 42\nselesai\ntampilkan tunggu hitung()`,
data:`ingat siswa sebagai ["Akhtar", "Budi", "Andi"]\ningat profil sebagai {"nama":"Akhtar", "kelas":9}\ntampilkan profil["nama"]\nuntuk setiap nama dalam siswa\n    tampilkan "Halo " + nama\nselesai\ntampilkan "Total: " + panjang(siswa)`,
errors:`coba tangkap masalah\n    lempar "Contoh kesalahan"\ntangkap\n    tampilkan "Ditangkap: " + masalah\nakhirnya\n    tampilkan "Selesai"\nselesai`
};

example.select=`# Aksara 2.5 - pilah status nilai
ingat nilai sebagai 2 # komentar inline kini didukung
pilih nilai
    kasus 1
        tampilkan "Perlu latihan"
    kasus 2
        tampilkan "Cukup baik"
    kasus 3
        tampilkan "Hebat!"
    lainnya
        tampilkan "Nilai tidak diketahui"
selesai`;
example.typed=`# Aksara 2.5 — Jenis data eksplisit
ingat nama: teks sebagai "Akhtar"
ingat umur: angka sebagai 14
ingat aktif: logika sebagai benar
ingat nilai: daftar sebagai [80, 90, 100]
tampilkan "Halo, " + nama
tampilkan "Rata-rata: " + rata_rata(nilai)
tampilkan "Umur: " + umur`;
example.typedError=`# Aksara 2.5 — Jalankan Compile untuk melihat pesan tipe
ingat umur: angka sebagai "empat belas"
tampilkan umur`;
example.nestedselect=`# Aksara 2.5 - pilihan bersarang
ingat kelas sebagai 9
ingat kelompok sebagai "A"
pilih kelas
    kasus 9
        pilih kelompok
            kasus "A"
                tampilkan "Kelas 9A"
            lainnya
                tampilkan "Kelas 9 lainnya"
        selesai
    lainnya
        tampilkan "Kelas berbeda"
selesai`;

example.advanced=`# Aksara 2.5 — Pengolahan data dan percabangan\ningat nilai sebagai [70, 88, 92, 65, 100]\n\nfungsi lulus(n)\n    kembalikan n >= 75\nselesai\n\ningat hasil sebagai saring(nilai, lulus)\ntampilkan "Nilai lulus: " + hasil\ntampilkan "Rata-rata: " + rata_rata(nilai)\n\njika rata_rata(nilai) >= 90 maka\n    tampilkan "Sangat baik"\natau jika rata_rata(nilai) >= 75 maka\n    tampilkan "Baik"\njika tidak\n    tampilkan "Belajar lagi"\nselesai\n\nuntuk i dari 1 sampai 3\n    tampilkan "Putaran: " + i\nselesai`;
example.concurrent=`fungsi asinkron kali_dua(n)\n    tunggu jeda(20)\n    kembalikan n * 2\nselesai\n\ningat hasil sebagai tunggu serentak([kali_dua(5), kali_dua(10), kali_dua(15)])\ntampilkan hasil`;
example.datastruct=`ingat daftar sebagai [1, 2, 3]\ndaftar[1] = 99\ntampilkan daftar\ningat orang sebagai {"nama": "Akhtar", "kelas": 9}\norang["kelas"] = 10\ntampilkan orang`;
example.todo=`# Aksara 2.5 — To-do app dengan penyimpanan browser
gunakan web
gunakan penyimpanan
buat halaman bernama "Tugasku"
atur tema menjadi "terang"
buat judul "Daftar Tugas"
buat teks "Catat tugasmu, lalu refresh halaman untuk mencoba penyimpanan."
buat masukan "Tugas baru"
buat tombol "Tambah"
buat tombol "Hapus semua"

ingat tugas sebagai tunggu baca_data("tugas-saya")
jika tugas == kosong maka
    tugas = []
selesai
web_daftar("Tugas tersimpan", tugas)

ketika tombol "Tambah" diklik
    ingat baru_tugas sebagai web_nilai("Tugas baru")
    jika panjang(baru_tugas) > 0 maka
        tambah(tugas, baru_tugas)
        web_ubah_daftar("Tugas tersimpan", tugas)
        tunggu simpan_data("tugas-saya", tugas)
        web_bersihkan_masukan("Tugas baru")
        tampilkan "Tersimpan: " + baru_tugas
    selesai
selesai

ketika tombol "Hapus semua" diklik
    tugas = []
    web_ubah_daftar("Tugas tersimpan", tugas)
    tunggu simpan_data("tugas-saya", tugas)
selesai`;
example.dashboard=`# Aksara 2.5 — Dashboard analitik
gunakan web
buat halaman bernama "Dasbor"
atau = 1
atur tema menjadi "terang"
buat judul "Aksara Analytics"
buat teks "Dashboard dengan komponen asli runtime Aksara."

ingat pengunjung sebagai [120, 165, 132, 210, 250, 221, 310]
buat kartu "Total pengunjung minggu ini: " + jumlah(pengunjung)
buat kartu "Rata-rata pengunjung: " + rata_rata(pengunjung)
buat grafik "Pengunjung per hari" dari pengunjung
buat tombol "Mode gelap"
ketika tombol "Mode gelap" diklik
    web_tema("gelap")
selesai`;
example.dashboard=example.dashboard.replace('atau = 1\n','');
example.form=`# Aksara 2.5 — Form responsif
gunakan web
buat halaman bernama "Form Aksara"
buat judul "Halo, siapa namamu?"
buat teks "Isi nama untuk mengubah judul secara langsung."
buat masukan "Nama"
ketika masukan "Nama" berubah
    ubah judul menjadi "Halo, " + web_nilai("Nama")
selesai`;
example.operators=`tetap nama sebagai "Aksara"
ingat daftar sebagai [10, 20, 30]
tampilkan "20 ada? " + (20 dalam daftar)
tampilkan "X ada? " + ("x" dalam {"x":1, "y":2})
tampilkan kosong ?? "nilai cadangan"
tampilkan "Nama: " + nama
pastikan(panjang(daftar) == 3, "panjang daftar harus 3")`;
example.multiline=`ingat profil sebagai {
    "nama": "Aksara",
    "versi": 2,
    "fitur": [
       "compiler",
       "web",
       "penyimpanan"
    ]
}
tampilkan cetak_json(profil)`;
example.v7tests=`# Aksara 7 — Tes langsung di Studio
uji "aritmetika"
    pastikan(2 + 2 == 4, "Hasil salah")
selesai
uji "interpolasi"
    nama = "Aksara"
    pastikan("Halo, {nama}" == "Halo, Aksara", "Teks salah")
selesai`;
example.v7parallel=`# Aksara 7 — Pekerjaan paralel dibatasi
fungsi asinkron kuadrat(n)
    tunggu jeda(50)
    kembalikan n * n
selesai
hasil = tunggu kerjakan_paralel([1,2,3,4,5], kuadrat, 2)
tampilkan hasil`;
example.v7data=`# Aksara 7 — Analisis data satu baris
daftar = ["merah", "biru", "merah", "hijau", "merah"]
tampilkan frekuensi(daftar)
orang = [{kelas:"9A",nama:"A"},{kelas:"9B",nama:"B"},{kelas:"9A",nama:"C"}]
tampilkan kelompokkan(orang, "kelas")`;
let files={'program.aks':example.web,'salam.aks':'ekspor fungsi sapa(nama)\n    kembalikan "Halo, " + nama\nselesai'},active='program.aks',last=null,tab='preview',runId=0;
const source=$('source'),frame=$('previewFrame');
function validateProject(next){
 if(!next||typeof next!=='object'||Array.isArray(next)||!Object.hasOwn(next,'program.aks'))throw Error('Format proyek tidak valid');
 const names=Object.keys(next);if(!names.length||names.length>40)throw Error('Proyek harus memiliki 1–40 berkas');
 for(const name of names)if(!/^[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)*(?:\/[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)*)*\.aks$/u.test(name)||typeof next[name]!=='string'||new TextEncoder().encode(next[name]).length>100000)throw Error('Berkas tidak valid atau melebihi 100 KB: '+name);
 return Object.assign(Object.create(null),next);
}
try{const saved=localStorage.getItem('aksara-v2-project')||localStorage.getItem('aksara-1.4-project');if(saved){const obj=JSON.parse(saved);files=validateProject(obj)}}catch{}
const keywords=new Set('uji tetap pilih masukan berubah tema kartu grafik penyimpanan javascript pastikan sebagai ingat sebagai tampilkan fungsi asinkron kembalikan kelas mewarisi turunan baru diri induk jika maka atau tidak selesai selama ulangi kali untuk setiap dalam dari sampai langkah coba tangkap akhirnya lempar berhenti lanjut gunakan impor ekspor ketika tombol diklik buat halaman bernama judul teks atur latar warna menjadi ubah benar salah kosong tunggu dan pilih kasus lainnya angka logika kamus bebas'.split(' '));
function highlightCode(code){let out='';for(const line of code.split('\n')){let i=0;while(i<line.length){const ch=line[i];if(ch==='#'){out+='<span class="com">'+esc(line.slice(i))+'</span>';break}if(ch==='"'||ch==="'"){const start=i,quote=ch;i++;while(i<line.length){if(line[i]==='\\'){i+=2;continue}if(line[i++]===quote)break}out+='<span class="str">'+esc(line.slice(start,i))+'</span>';continue}const hit=/^[\p{L}_][\p{L}\p{N}_]*/u.exec(line.slice(i));if(hit){const word=hit[0];out+=(keywords.has(word)?'<span class="kw">'+esc(word)+'</span>':esc(word));i+=word.length;continue}const num=/^\d+(?:\.\d+)?/.exec(line.slice(i));if(num){out+='<span class="num">'+num[0]+'</span>';i+=num[0].length;continue}out+=esc(ch);i++}out+='\n'}return out}
function esc(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function saveState(){files[active]=source.value;try{localStorage.setItem('aksara-v2-project',JSON.stringify(files))}catch{}}
function refresh(){const lines=source.value.split('\n');$('lineNumbers').textContent=lines.map((_,i)=>i+1).join('\n');$('highlight').innerHTML=highlightCode(source.value);$('lineInfo').textContent=lines.length+' baris';$('fileCount').textContent=Object.keys(files).length+' BERKAS';$('fileStrip').replaceChildren();for(const name of Object.keys(files)){const b=document.createElement('button');b.textContent=name;b.className=name===active?'fileTab active':'fileTab';b.onclick=()=>{saveState();active=name;source.value=files[name];refresh()};$('fileStrip').append(b)}cursor();document.dispatchEvent(new CustomEvent('aksara:studio-refresh'))}
function cursor(){const pos=source.selectionStart;const before=source.value.slice(0,pos).split('\n');$('cursorInfo').textContent=`Baris ${before.length}, Kolom ${before.at(-1).length+1}`}
function switchTab(name){tab=name;for(const b of document.querySelectorAll('[data-tab]'))b.classList.toggle('selected',b.dataset.tab===name);for(const [key,id] of Object.entries({preview:'preview',terminal:'terminal',javascript:'javascript',ast:'ast',tokens:'tokens'}))$(id).classList.toggle('hidden',key!==name)}
const terminalState=new WeakMap();
function log(msg,error=false){
 const pane=$('terminal');let state=terminalState.get(pane);
 if(!state||!pane.hasChildNodes()){state={characters:0,lines:0,truncated:false};terminalState.set(pane,state)}
 if(state.truncated)return;
 const text=String(msg)+'\n',remaining=Math.max(0,180000-state.characters),span=document.createElement('span');
 span.textContent=text.slice(0,remaining);span.className=error?'errorText':'successText';pane.append(span);
 state.characters+=span.textContent.length;state.lines++;
 if(text.length>remaining||state.lines>=2000){state.truncated=true;const notice=document.createElement('span');notice.className='errorText';notice.textContent='\n[OUTPUT DIBATASI: 180 KB / 2000 pesan]\n';pane.append(notice)}
 pane.scrollTop=pane.scrollHeight;
}
function diagnostic(items){$('diagnostics').replaceChildren();$('diagCount').textContent=items.length+' masalah';if(!items.length){const el=document.createElement('span');el.textContent='✓ Tidak ada masalah statis yang terdeteksi.';el.className='successText';$('diagnostics').append(el)}else for(const d of items){const el=document.createElement('div');el.textContent=`${d.severity==='warning'?'⚠':'✕'} ${d.file||active}:${d.line||'?'}${d.column?':'+d.column:''} — ${d.code?'['+d.code+'] ':''}${d.message}${d.suggestion?'\n💡 '+d.suggestion:''}`;el.className=d.severity==='warning'?'diagnostic warning':'diagnostic error';el.title='Klik untuk membuka baris ini';el.onclick=()=>{const file=d.file||active;if(file!==active&&Object.hasOwn(files,file)){saveState();active=file;source.value=files[file];refresh()}const parts=source.value.split('\n');const pos=parts.slice(0,Math.max(0,(d.line||1)-1)).reduce((sum,row)=>sum+row.length+1,0);source.focus();source.setSelectionRange(pos,pos+parts[Math.max(0,(d.line||1)-1)]?.length||pos);source.scrollTop=Math.max(0,((d.line||1)-4)*25);$('highlight').scrollTop=source.scrollTop;cursor()};$('diagnostics').append(el)}}
function compile(options={}){saveState();try{last=Aksara.compileProject(files,'program.aks',{strict:$('strictMode').checked,breakpoints:options.breakpoints||{}});diagnostic(last.diagnostics);$('javascript').textContent=last.javascript||'Kompilasi gagal';$('ast').textContent=JSON.stringify(last.modules,null,2);$('tokens').textContent=JSON.stringify(Aksara.lex(source.value),null,2);$('stats').textContent=`${last.stats.lines} baris · ${last.stats.statements} instruksi AST · ${last.stats.modules} modul · Aksara ${last.version}`;$('buildStatus').textContent=last.javascript?'Kompilasi berhasil':'Kompilasi gagal';return last.javascript?last:null}catch(e){last=null;diagnostic([{line:e.line||1,message:e.message,severity:'error'}]);$('buildStatus').textContent='Kesalahan compiler';return null}}
function run(options={}){const id=++runId;frame.srcdoc='';const c=compile(options);if(!c){switchTab('terminal');return}$('terminal').replaceChildren();const script=c.javascript.replace(/<\//gi,'<\\/');const runtime=`<!doctype html><html><head><meta charset="utf-8"><style>body{font:16px system-ui;background:#f4f7ff;color:#111827;margin:0}#aksara-root{padding:26px;min-height:100vh;box-sizing:border-box}h2{color:var(--aksara-title-color,#2838ad);font-size:27px;margin:8px 0 18px}p{line-height:1.7}.aksara-button{border:0;border-radius:10px;background:#5865f2;color:#fff;padding:12px 20px;cursor:pointer;font:600 14px system-ui;margin:7px 8px 7px 0}.aksara-button:hover{filter:brightness(1.08)}.aksara-field{display:flex;flex-direction:column;gap:8px;max-width:440px;margin:18px 0 7px;font-weight:600}.aksara-field input{padding:12px 14px;border:1px solid #cbd5e1;border-radius:10px;font:inherit;outline:0}.aksara-field input:focus{border-color:#5865f2;box-shadow:0 0 0 3px #5865f225}.aksara-card{display:inline-block;max-width:100%;margin:12px 12px 12px 0;padding:18px 22px;background:#fff;border:1px solid #e2e8f0;border-radius:13px;box-shadow:0 5px 18px #0b162a10;font-weight:600}.aksara-list-section{margin:22px 0}.aksara-list-section ul{padding:0;list-style:none;max-width:580px}.aksara-list-section li{padding:10px 14px;margin:8px 0;background:#fff;border:1px solid #e2e8f0;border-radius:9px}.aksara-chart{margin:20px 0;padding:18px;background:#fff;border:1px solid #e2e8f0;border-radius:15px;max-width:640px}.aksara-chart h3{margin:0 0 18px}.aksara-bars{display:flex;align-items:end;gap:12px;height:220px;border-bottom:1px solid #94a3b8;padding:10px}.aksara-bar-cell{height:100%;display:flex;align-items:center;justify-content:flex-end;flex-direction:column;flex:1;min-width:0;gap:5px;font-size:11px;color:#64748b}.aksara-bar{background:linear-gradient(#8d9aff,#5865f2);border-radius:7px 7px 0 0;width:min(100%,44px)}#aksara-root[data-theme=gelap]{background:#111827!important;color:#e2e8f0}#aksara-root[data-theme=gelap] h2{color:#a5b4fc}#aksara-root[data-theme=gelap] .aksara-card,#aksara-root[data-theme=gelap] li,#aksara-root[data-theme=gelap] .aksara-chart{background:#1f2937;color:#e2e8f0;border-color:#334155}#aksara-root[data-theme=gelap] .aksara-field input{background:#111827;color:white;border-color:#4b5563}</style></head><body><main id="aksara-root"></main><script>const pending=new Map();let requestNo=0;window.__AKSARA_HOST__={send:(type,value)=>parent.postMessage({aksaraStudio:true,id:${id},type,value},'*'),request:(action,payload)=>new Promise((resolve,reject)=>{const requestId=++requestNo;pending.set(requestId,{resolve,reject});parent.postMessage({aksaraStudio:true,id:${id},type:'hostRequest',action,payload,requestId},'*');setTimeout(()=>{if(pending.has(requestId)){pending.delete(requestId);reject(Error('Penyimpanan tidak merespons'))}},5000)})};window.addEventListener('message',e=>{if(e.source!==parent||!e.data?.aksaraStorageReply||e.data.id!==${id})return;const p=pending.get(e.data.requestId);if(!p)return;pending.delete(e.data.requestId);e.data.error?p.reject(Error(e.data.error)):p.resolve(e.data.value)});window.addEventListener('unhandledrejection',event=>{event.preventDefault();window.__AKSARA_HOST__.send('error',String(event.reason?.message??event.reason))});window.onerror=(m)=>parent.postMessage({aksaraStudio:true,id:${id},type:'error',value:String(m)},'*');<\/script><script>${script}<\/script></body></html>`;frame.srcdoc=runtime;$('buildStatus').textContent='Menjalankan program';switchTab('preview')}
function storageHost(action,payload){const prefix='aksara-v2:data:';const key=String(payload?.key??'');if(key.length>120)throw Error('Kunci maksimal 120 karakter');if(action==='storageKeys'){return Object.keys(localStorage).filter(x=>x.startsWith(prefix)).map(x=>x.slice(prefix.length))}if(!['storageSet','storageGet','storageDelete'].includes(action))throw Error('Perintah penyimpanan tidak valid');const k=prefix+key;if(action==='storageSet'){const value=payload?.value;if(typeof value!=='string'||value.length>50000)throw Error('Ukuran data maksimal 50 KB');if(Object.keys(localStorage).filter(x=>x.startsWith(prefix)).length>=120&&localStorage.getItem(k)===null)throw Error('Batas 120 kunci tercapai');localStorage.setItem(k,value);return true}if(action==='storageGet')return localStorage.getItem(k);localStorage.removeItem(k);return true}
window.addEventListener('message',e=>{if(e.source!==frame.contentWindow||!e.data?.aksaraStudio||e.data.id!==runId)return;if(e.data.type==='hostRequest'){let value=null,error=null;try{value=storageHost(e.data.action,e.data.payload)}catch(ex){error=ex.message}frame.contentWindow.postMessage({aksaraStorageReply:true,id:runId,requestId:e.data.requestId,value,error},'*');return}if(e.data.type==='print')log(e.data.value);if(e.data.type==='error'){log(e.data.value,true);$('buildStatus').textContent='Kesalahan runtime'}if(e.data.type==='done')$('buildStatus').textContent='Program selesai'});
source.addEventListener('input',()=>{saveState();refresh()});source.addEventListener('scroll',()=>{$('highlight').scrollTop=source.scrollTop;$('highlight').scrollLeft=source.scrollLeft;$('lineNumbers').scrollTop=source.scrollTop});source.addEventListener('click',cursor);source.addEventListener('keyup',cursor);source.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();source.setRangeText('    ',source.selectionStart,source.selectionEnd,'end');source.dispatchEvent(new Event('input'))}if(e.key==='Enter'&&!e.ctrlKey&&!e.metaKey){const pos=source.selectionStart;const before=source.value.slice(0,pos);const line=before.split('\n').at(-1);const indent=/^\s*/.exec(line)[0];if(indent){e.preventDefault();source.setRangeText('\n'+indent,pos,source.selectionEnd,'end');source.dispatchEvent(new Event('input'))}}});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run()}if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='d'){e.preventDefault();debugRun()}if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='f'){e.preventDefault();formatSource()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();download(active,source.value)}});
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>switchTab(b.dataset.tab);
function formatSource(){try{Aksara.parse(source.value);const formatted=AksaraFormatter.format(source.value);if(source.value!==formatted){source.value=formatted;saveState();refresh()}$('buildStatus').textContent='Indentasi dirapikan'}catch(e){diagnostic([{file:active,line:e.line||1,message:e.message,severity:'error'}]);$('buildStatus').textContent='Kode belum bisa dirapikan'}}
$('format').onclick=formatSource;
function debugRun(){
 const cursorLine=source.value.slice(0,source.selectionStart).split('\n').length,locations=[];
 const visit=node=>{if(!node||typeof node!=='object')return;if(Number.isInteger(node.n)&&node.type)locations.push(node.n);for(const value of Object.values(node))if(value&&typeof value==='object')Array.isArray(value)?value.forEach(visit):visit(value)};
 try{visit(Aksara.parse(source.value))}catch{return run()}
 locations.sort((a,b)=>a-b);const line=locations.find(n=>n>=cursorLine)??locations.at(-1)??1;
 window.aksaraDesktop?.open_devtools?.();return run({breakpoints:{[active]:[line]}});
}
$('debugRun').onclick=debugRun;
$('run').onclick=run;$('testRun').onclick=()=>{run();switchTab('terminal')};$('compile').onclick=compile;$('clear').onclick=()=>$('terminal').replaceChildren();$('examples').onclick=()=>$('menu').classList.toggle('hidden');
for(const b of document.querySelectorAll('[data-example]'))b.onclick=()=>{if(b.dataset.example==='modules'){files['salam.aks']='ekspor fungsi sapa(nama)\n    kembalikan "Halo, " + nama\nselesai'}source.value=example[b.dataset.example];saveState();refresh();$('menu').classList.add('hidden');run()};
function download(name,data,type='text/plain'){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}
$('guide').onclick=()=>window.open('panduan.html','_blank','noopener');$('save').onclick=()=>download(active,source.value);$('saveProject').onclick=()=>{saveState();download('aksara-project.json',JSON.stringify(files,null,2),'application/json')};$('downloadJS').onclick=()=>{const c=compile();if(c)download('program.js',c.javascript,'text/javascript')};$('downloadMap').onclick=()=>{const c=compile();if(c&&c.sourceMap)download('program.js.map',JSON.stringify(c.sourceMap,null,2),'application/json')};$('copyJS').onclick=async()=>{const c=compile();if(c)try{await navigator.clipboard.writeText(c.javascript);$('buildStatus').textContent='JavaScript disalin'}catch{$('buildStatus').textContent='Clipboard tidak tersedia'}};
$('newFile').onclick=()=>{const name=prompt('Nama modul baru (contoh: util.aks)');if(!name)return;if(!/^[\w-]+\.aks$/.test(name)||Object.hasOwn(files,name)){alert('Nama tidak valid atau sudah ada');return}saveState();files[name]='';active=name;source.value='';saveState();refresh()};
$('deleteFile').onclick=()=>{if(active==='program.aks'){alert('program.aks tidak boleh dihapus');return}if(!confirm('Hapus '+active+'?'))return;delete files[active];active='program.aks';source.value=files[active];saveState();refresh()};
$('open').onclick=()=>$('file').click();$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const txt=await f.text();if(f.name.endsWith('.json')){const obj=JSON.parse(txt);files=validateProject(obj);active='program.aks';source.value=files[active]}else{if(!/^[\w-]+\.aks$/.test(f.name))throw Error('Gunakan file .aks');const next=validateProject({...files,[f.name]:txt});files=next;active=f.name;source.value=txt}saveState();refresh()}catch(err){alert(err.message)}e.target.value=''};
window.AksaraStudioBridge=Object.freeze({
  getFiles(){saveState();return {...files}},
  activeName(){return active},
  selectFile(name){if(!Object.hasOwn(files,name))throw Error('Berkas tidak ditemukan: '+name);saveState();active=name;source.value=files[name];refresh();source.focus()},
  setFiles(next,selected='program.aks'){
    const validated=validateProject(next);if(!Object.hasOwn(validated,selected))throw Error('Berkas aktif tidak valid');
    runId++;frame.srcdoc='';files=validated;
    active=selected;source.value=files[active];saveState();refresh();compile();
  },
  status(value){$('buildStatus').textContent=value},
  terminal(value,isError=false){log(value,isError);switchTab('terminal')},
  showTab:switchTab,compile,run,format:formatSource
});
source.value=files[active];refresh();run();
})();
