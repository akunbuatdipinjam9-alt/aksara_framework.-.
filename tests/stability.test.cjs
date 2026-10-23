'use strict';
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {spawnSync}=require('./process.cjs');
global.AksaraRuntime=require('../runtime.js');
const A=require('../compiler.js'),F=require('../formatter.js');
let cases=0;
function valid(source,expected){
 const c=A.compile(source,{strict:true});
 assert.deepEqual(c.diagnostics.filter(d=>d.severity==='error'),[],source);
 new vm.Script(c.javascript);
 const r=spawnSync(process.execPath,['-e',c.javascript],{encoding:'utf8',timeout:5000});
 assert.equal(r.status,0,r.stderr);assert.equal(r.stdout.trim(),expected);cases++;
}
function invalid(source,files){
 const c=files?A.compileProject(files):A.compile(source);
 assert.equal(c.javascript,null,source);assert.ok(c.diagnostics.some(d=>d.severity==='error'),source);cases++;
}
valid('coba\n tampilkan 1\nakhirnya\nselesai','1');
invalid('coba\n tampilkan 1\nselesai');
invalid('ingat __exp sebagai 1');
invalid('fungsi f(x)\n ingat x sebagai 1\nselesai');
invalid('fungsi f(x)\n fungsi x()\n selesai\nselesai');
invalid('untuk setiap x dalam [1]\n ingat x sebagai 2\nselesai');
invalid('ulangi 2 kali\n ingat indeks sebagai 2\nselesai');
invalid('impor f dari "m"\ningat f sebagai 1',{'program.aks':'impor f dari "m"\ningat f sebagai 1','m.aks':'ekspor fungsi f()\nselesai'});
invalid('impor f dari "m"\nubah f menjadi 1',{'program.aks':'impor f dari "m"\nubah f menjadi 1','m.aks':'ekspor fungsi f()\nselesai'});
invalid('selama benar maka\n ketika tombol "x" diklik\n  berhenti\n selesai\n berhenti\nselesai');
valid('tampilkan (1).toString()','1');
valid('ingat Math sebagai 0\ntampilkan 7 // 2','3');
valid('ingat Error sebagai 0\ncoba\n lempar "pesan asli"\ntangkap\n tampilkan kesalahan\nselesai','pesan asli');
valid('tampilkan [1,2]["join"]("-")','1-2');
valid('ingat f sebagai panjang\ntampilkan f([1,2])','2');
valid('fungsi ident(x)\n kembalikan x\nselesai\nuntuk setiap panjang dalam [ident]\n tampilkan panjang(7)\nselesai','7');
valid('tetap x sebagai 1\nuntuk setiap x dalam [2]\n ubah x menjadi 3\n tampilkan x\nselesai','3');
valid('coba\n lempar "pesan"\ntangkap\n sebagai teks\n tampilkan teks\nselesai','pesan');
invalid('fungsi f()\n tunggu jeda(1)\nselesai');
invalid('kelas K\n asinkron fungsi mulai()\n selesai\nselesai');
invalid('fungsi f()\n impor x dari "m"\nselesai');
invalid('jika benar maka\n ekspor ingat x sebagai 1\nselesai');
for(const name of ['enum','implements','interface','package','private','protected','public','benar','salah','kosong','diri','baru','tunggu','tidak'])invalid('ingat '+name+' sebagai 1');
invalid('tampilkan '+ '9'.repeat(400));
invalid('tampilkan "teks\nterpisah"');
const L=require('../language-tools.js');
assert.deepEqual(L.findDefinition('ingat 名字 sebagai 1\ntampilkan 名字','名字'),{line:1,column:7});
assert.throws(()=>L.rename('ingat nama sebagai 1','nama','enum'));
cases+=2;
invalid('kelas K\n fungsi mulai()\n selesai\n fungsi mulai()\n selesai\nselesai');
invalid('kelas K mewarisi K\nselesai');
for(const expression of ['induk','induk()','induk["f"]()'])invalid('kelas B\nselesai\nkelas K mewarisi B\n fungsi f()\n tampilkan '+expression+'\n selesai\nselesai');
invalid('kelas B\nselesai\nkelas K mewarisi B\n fungsi f()\n fungsi dalam_f()\n induk.f()\n selesai\n selesai\nselesai');
valid('kelas B\n fungsi mulai(x)\n diri.x = x\n selesai\n fungsi f()\n kembalikan diri.x\n selesai\nselesai\nkelas K mewarisi B\n fungsi mulai(x)\n induk(x)\n selesai\n fungsi f()\n kembalikan induk.f() + 1\n selesai\nselesai\ningat k sebagai baru K(2)\ntampilkan k.f()','3');
const mapped=A.compile('ingat x sebagai 1\ntampilkan x');
const printLine=mapped.javascript.split('\n').findIndex(line=>line.includes('__rt.print(x)'));
assert.ok(mapped.sourceMap.mappings.split(';')[printLine],'Executable statement has no source-map mapping');cases++;
for(const source of [
 'ekspor fungsi f(x: angka): angka\n kembalikan x\nselesai\ntampilkan f(2)',
 'fungsi asinkron f()\n kembalikan 1\nselesai\ntampilkan tunggu f()',
 'jika benar maka # catatan\n tampilkan "# bukan komentar"\nselesai # akhir',
 'pilih 1 # pilihan\nkasus 1 # satu\ntampilkan 1\nselesai # akhir'
]){
 const formatted=F.format(source);
 assert.deepEqual(A.parse(formatted),A.parse(source));
 assert.equal(F.format(formatted),formatted);cases++;
}
console.log('Stability: '+cases+' compiler/formatter regression checks passed');
