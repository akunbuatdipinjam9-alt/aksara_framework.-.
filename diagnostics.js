'use strict';
// Human-readable diagnostics; all metadata can be rendered by both CLI and Studio.
const AksaraDiagnostics=(()=>{
 const commands=['tampilkan','ingat','tetap','ubah','jika','selama','ulangi','untuk','fungsi','kelas','gunakan','impor','kembalikan','lempar','pilih','coba','selesai','tunggu','uji'];
 function distance(a,b){if(Math.abs(a.length-b.length)>3)return 99;const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old}}return row[b.length]}
 function closest(name,candidates){let best=null,score=99;for(const candidate of candidates){if(candidate===name)continue;const d=distance(name,candidate);if(d<score){score=d;best=candidate}}return score<=Math.max(1,Math.floor(name.length/3))?best:null}
 function enrich(d,source,{builtins=[]}={}){
  if(!d||typeof d.message!=='string')return d;
  const row=source.split(/\r?\n/)[Math.max(0,(d.line||1)-1)]||'';
  const head=/^\s*([\p{L}_][\p{L}\p{N}_]*)/u.exec(row)?.[1];
  if((/Token berlebih|tidak dikenal|tidak boleh memulai ekspresi/.test(d.message))&&head&&!commands.includes(head)){
   const guess=closest(head,commands);
   if(guess){d.code='AKS-E101';d.column=row.indexOf(head)+1;d.suggestion=`Mungkin maksud kamu '${guess}'. Coba ganti '${head}' menjadi '${guess}'.`;return d}
  }
  if(/(?:Nama|Variabel) '[^']+' (?:belum dideklarasikan|tidak ditemukan)/.test(d.message)){
   d.code='AKS-E102';const name=/(?:Nama|Variabel) '([^']+)'/.exec(d.message)?.[1];
   const defs=[...source.matchAll(/\b(?:ingat|tetap)\s+([\p{L}_][\p{L}\p{N}_]*)|^\s*([\p{L}_][\p{L}\p{N}_]*)\s*=(?!=)/gmu)].map(m=>m[1]||m[2]);
   const guess=closest(name||'', [...new Set([...defs,...builtins])]);
   d.suggestion=guess?`Apakah maksud kamu '${guess}'? Periksa ejaan nama variabel.`:'Pastikan variabel dibuat sebelum digunakan, misalnya: nama = "Akhtar".';
  }else if(/(?:harus bertipe|seharusnya|bertipe .+ tetapi nilainya)/.test(d.message)){
   d.code='AKS-E103';d.suggestion='Periksa jenis nilai yang diberikan. Gunakan angka untuk tipe angka, dan teks untuk tipe teks.';
  }else if(/belum ditutup|tanpa pembuka|Diharapkan '.*'/.test(d.message)){
   d.code='AKS-E104';d.suggestion='Periksa pasangan pembuka dan penutup; blok seperti jika/fungsi membutuhkan selesai.';
  }else if(/Ekspresi (?:kosong|belum lengkap)|Token berlebih/.test(d.message)){
   d.code='AKS-E105';d.suggestion='Periksa kembali penulisan ekspresi dan tanda kurung. Contoh: tampilkan 1 + 2';
  }
  return d;
 }
 return {enrich};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=AksaraDiagnostics;
