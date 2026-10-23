'use strict';
const assert=require('node:assert/strict');
const {spawnSync}=require('./process.cjs');
const vm=require('node:vm');
global.AksaraRuntime=require('../runtime.js');
const A=require('../compiler.js');
const L=require('../language-tools.js');
let passed=0;
function run(source,want,options={strict:true}){
 const result=A.compile(source,options);
 assert.deepEqual(result.diagnostics.filter(d=>d.severity==='error'),[],JSON.stringify(result.diagnostics));
 new vm.Script(result.javascript);
 const finished=spawnSync(process.execPath,['-e',result.javascript],{encoding:'utf8',timeout:5000});
 assert.equal(finished.status,0,finished.stderr);
 assert.equal(finished.stdout.trim(),want);
 passed++;
}
function invalid(source,code,fragment,options={strict:true}){
 const result=A.compile(source,options);
 assert.equal(result.javascript,null);
 assert(result.diagnostics.some(d=>d.code===code&&d.suggestion?.includes(fragment)),JSON.stringify(result.diagnostics));
 passed++;
}
run('nama = "Akhtar"\ntampilkan "Halo, {nama}!"','Halo, Akhtar!');
run('umur = 14\numur = umur + 1\ntampilkan "Umur {umur}"','Umur 15');
run('ingat nama sebagai "Aksara"\nnama = "Studio"\ntampilkan "{nama}"','Studio');
run('tetap nilai sebagai 1\ntampilkan "{nilai}"','1');
run('untuk setiap angka dalam [1,2]\n angka = angka + 2\n tampilkan "{angka}"\nselesai','3\n4');
run('fungsi sapa(nama)\n  tampilkan "Halo {nama}"\nselesai\nsapa("Dunia")','Halo Dunia');
run('jika benar maka\n pesan = "oke"\n tampilkan pesan\nselesai','oke');
run('tampilkan "JSON: {\\"nama\\": 1}"','JSON: {"nama": 1}');
run('tampilkan "{{nama}}"','{nama}');
run('jumlah = 7\ntampilkan jumlah','7');
run('jika benar maka\n a = 2\n jika benar maka\n  a = a + 1\n  tampilkan a\n selesai\nselesai','3');
invalid('tampikan "Halo"','AKS-E101','tampilkan');
invalid('tampilkan "{naama}"\nnama = "Aksara"','AKS-E102','nama');
invalid('tampilkan "{belum_ada}"','AKS-E102','Pastikan variabel', {strict:false});
invalid('ingat nilai: angka sebagai "sepuluh"','AKS-E103','tipe angka');
invalid('jika benar maka\n tampilkan 1','AKS-E104','selesai');
invalid('tampilkan 1 +','AKS-E105','ekspresi');
assert.deepEqual(L.findDefinition('nama = "Akhtar"\ntampilkan nama','nama'),{line:1,column:1});passed++;
assert(L.suggest('Halo').some(x=>x.label.includes('Halo')));passed++;
console.log('✓ '+passed+' tes v6.4 simplicity dan diagnostik');
