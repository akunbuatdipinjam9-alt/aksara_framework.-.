 'use strict';
const AksaraLanguageTools=(()=>{
 const vocabulary=[
 ['gunakan web','Aktifkan modul web'],['buat halaman bernama ""','Setel judul halaman'],
 ['buat judul ""','Tambahkan heading'],['buat teks ""','Tambahkan paragraf'],
 ['buat tombol ""','Tambahkan tombol'],['buat masukan angka ""','Input numerik'],
 ['buat wadah ""','Mulai kontainer layout'],['tutup wadah','Tutup kontainer layout'],
 ['atur gaya "" properti "" menjadi ""','Setel CSS whitelist'],
 ['atur kelas "" menjadi ""','Tambahkan kelas CSS'],
 ['nama = "Akhtar"','Buat variabel dengan sintaks ringkas'],['tampilkan "Halo, {nama}"','Sisipkan variabel ke dalam teks'],['ingat nilai sebagai 0','Deklarasi variabel'],['tetap nama sebagai ""','Deklarasi konstanta'],
 ['fungsi hitung(a: angka): angka','Fungsi dengan tipe'],['kembalikan 0','Nilai kembalian'],
 ['jika benar maka','Percabangan'],['jika tidak','Alternatif kondisi'],
 ['untuk setiap item dalam daftar','Iterasi daftar'],['tampilkan "Halo!"','Tulis ke terminal'],
 ['web_angka("")','Baca input angka'],['web_nilai("")','Baca input'],
 ['jeda(100)','Jeda asinkron'],['ambil_json("")','Fetch JSON (gunakan jaringan)'],
 ['baca_json("{}")','Parse JSON'],['baca_file_json("data.json")','Baca file JSON (pakai tunggu)'],['simpan_file_json("hasil.json", data)','Simpan JSON (pakai tunggu)'],['gunakan python "random"','Smart Import Python'],['gunakan javascript "node:os" sebagai os','Smart Import JavaScript'],['python_panggil_async("random", "randint", [1,100])','Python non-blocking'],['bersamaan([jeda(100), jeda(100)])','Tugas bersamaan'],['huruf_awal(teks, "A")','Periksa prefix teks'],
 ['uji "penjumlahan"','Blok tes otomatis (akhiri dengan selesai)'],['kerjakan_paralel(daftar, fungsi, 4)','Jalankan pekerjaan dengan batas konkurensi'],['baca_file("catatan.txt")','Baca teks dari file proyek (pakai tunggu)'],['simpan_file("catatan.txt", "Halo")','Simpan teks (pakai tunggu)'],['daftar_file(".")','Daftar file proyek (pakai tunggu)'],['ambil_api("https://example.com")','HTTP client dengan status dan data'],['kirim_api("https://example.com", data)','POST JSON ke API'],['baca_env("PORT", "3000")','Baca environment variable'],['kelompokkan(daftar, "kategori")','Kelompokkan data'],['frekuensi(daftar)','Hitung kemunculan item'],
 ['rapikan_teks(teks)','Trim teks']
 ];
 function suggest(prefix=''){const q=String(prefix).toLowerCase().trim();return vocabulary.filter(([label])=>label.toLowerCase().includes(q)).slice(0,12).map(([label,detail])=>({label,detail}))}
 function tokens(source){const found=[];let i=0,line=1,col=1;function advance(char){if(char==='\n'){line++;col=1}else col++}
  while(i<source.length){const ch=source[i];if(ch==='#'){while(i<source.length&&source[i]!=='\n'){advance(source[i]);i++}continue}
   if(ch==='"'||ch==="'"){const q=ch;advance(source[i++]);let escape=false;while(i<source.length){const c=source[i++];advance(c);if(escape){escape=false;continue}if(c==='\\'){escape=true;continue}if(c===q)break}continue}
   const part=/^[\p{L}_][\p{L}\p{N}_]*/u.exec(source.slice(i));if(part){found.push({name:part[0],start:i,end:i+part[0].length,line,column:col});for(let j=0;j<part[0].length;j++)advance(part[0][j]);i+=part[0].length;continue}
   advance(ch);i++
  }return found;
 }
 function findDefinition(source,symbol){const rows=String(source).split('\n');const escaped=String(symbol).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const re=new RegExp('^(\\s*(?:ekspor\\s+)?(?:(?:ingat|tetap|fungsi(?: asinkron)?|asinkron fungsi|kelas)\\s+))'+escaped+'(?![\\p{L}\\p{N}_])','u');for(let i=0;i<rows.length;i++){const hit=re.exec(rows[i]);if(hit)return {line:i+1,column:hit[1].length+1};const simple=/^\s*([\p{L}_][\p{L}\p{N}_]*)\s*=(?!=)/u.exec(rows[i]);if(simple&&simple[1]===symbol)return {line:i+1,column:rows[i].indexOf(symbol)+1}}return null}
 function rename(source,oldName,newName){if(!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(newName))throw Error('Nama simbol tidak valid');const compiler=typeof Aksara!=='undefined'?Aksara:require('./compiler.js');compiler.parse('ingat '+newName+' sebagai 0');const matches=tokens(source).filter(t=>t.name===oldName);let output=source;for(const hit of matches.reverse())output=output.slice(0,hit.start)+newName+output.slice(hit.end);return {source:output,count:matches.length}}
 return {suggest,tokens,findDefinition,rename};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=AksaraLanguageTools;
