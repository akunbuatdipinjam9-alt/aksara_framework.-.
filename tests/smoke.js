'use strict';
const assert=require('node:assert/strict');
const {spawnSync}=require('./process.cjs');
const A=require('../compiler.js');
require('../runtime.js'); // AksaraRuntime is not global in Node; expose below for compiler helper
// See Node CLI/test setup: compiler expects named runtime function during code generation.
global.AksaraRuntime=require('../runtime.js');
let pass=0;
function test(name,code,expected){const c=A.compile(code);assert.equal(c.diagnostics.filter(x=>x.severity==='error').length,0,JSON.stringify(c.diagnostics));assert.ok(c.javascript,'JS output');const testRun=spawnSync(process.execPath,['-e',c.javascript],{encoding:'utf8',timeout:4000});assert.equal(testRun.status,0,`${name}: ${testRun.stderr}`);assert.deepEqual(testRun.stdout.trim().split('\n').filter(Boolean),expected,`${name}: actual ${testRun.stdout}`);pass++;console.log('✓',name)}
test('variables','ingat nama sebagai "Akhtar"\ntampilkan "Halo, " + nama',['Halo, Akhtar']);
test('math','fungsi kuadrat(x)\n kembalikan x*x\nselesai\nulangi 4 kali\n tampilkan kuadrat(indeks)\nselesai',['1','4','9','16']);
test('arrays','ingat data sebagai [1,2,3]\nuntuk setiap x dalam data\n tampilkan x\nselesai',['1','2','3']);
test('dictionary','ingat profil sebagai {"nama":"Akhtar","kelas":9}\ntampilkan profil["nama"]',['Akhtar']);
test('conditions','ingat angka sebagai 6\njika angka lebih dari 3 maka\n tampilkan "besar"\njika tidak\n tampilkan "kecil"\nselesai',['besar']);
test('methods','kelas Pengguna\n fungsi mulai(nama)\n  diri.nama = nama\n selesai\n fungsi sapa()\n  kembalikan "Halo " + diri.nama\n selesai\nselesai\ningat u sebagai baru Pengguna("Akhtar")\ntampilkan u.sapa()',['Halo Akhtar']);
test('inheritance mewarisi','kelas Kendaraan\n fungsi mulai(merk)\n  diri.merk = merk\n selesai\n fungsi info()\n  tampilkan "Merk: " + diri.merk\n selesai\nselesai\nkelas Mobil mewarisi Kendaraan\n fungsi klakson()\n  tampilkan "Tin tin!"\n selesai\nselesai\ningat mobil sebagai baru Mobil("Toyota")\nmobil.info()\nmobil.klakson()',['Merk: Toyota','Tin tin!']);
test('inheritance turunan','kelas Induk\n fungsi mulai(nama)\n  diri.nama = nama\n selesai\nselesai\nkelas Anak turunan Induk\n fungsi sapa()\n  tampilkan diri.nama\n selesai\nselesai\ningat a sebagai baru Anak("Akhtar")\na.sapa()',['Akhtar']);
test('exceptions','coba tangkap masalah\n lempar "ups"\ntangkap\n tampilkan "Error: " + masalah\nakhirnya\n tampilkan "bersih"\nselesai',['Error: ups','bersih']);
test('async','fungsi asinkron tunggu_dulu()\n tunggu jeda(5)\n kembalikan 42\nselesai\ntampilkan tunggu tunggu_dulu()',['42']);
test('functions','ingat nilai sebagai jumlah([1,2,3])\ntampilkan nilai\ntampilkan urut([3,1,2])',['6','[1,2,3]']);
test('loops','ingat x sebagai 0\nselama x kurang dari 4 maka\n ubah x menjadi x + 1\n jika x sama dengan 2 maka\n  lanjut\n selesai\n tampilkan x\nselesai',['1','3','4']);
const files={'program.aks':'impor sapa, versi dari "lib"\ntampilkan sapa("Aksara")\ntampilkan versi','lib.aks':'ekspor ingat versi sebagai 14\nekspor fungsi sapa(x)\n kembalikan "Halo " + x\nselesai'};
const c=A.compileProject(files);assert.equal(c.diagnostics.length,0,JSON.stringify(c.diagnostics));const r=spawnSync(process.execPath,['-e',c.javascript],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.deepEqual(r.stdout.trim().split('\n'),['Halo Aksara','14']);pass++;console.log('✓ modules');
assert.ok(A.compile('jika benar maka\n tampilkan "x"').diagnostics.some(d=>/belum ditutup/.test(d.message)));pass++;console.log('✓ syntax diagnostics');
const c2=A.compile('kembalikan 5');assert.equal(c2.javascript,null);assert.ok(c2.diagnostics.some(x=>x.severity==='error'));pass++;console.log('✓ static diagnostics');
console.log(`${pass} tests passed`);
