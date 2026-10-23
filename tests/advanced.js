'use strict';
const assert = require('node:assert/strict');
const {spawnSync} = require('./process.cjs');
const A = require('../compiler.js');
global.AksaraRuntime = require('../runtime.js');
let passed=0;
function run(name,code,expected){const c=A.compile(code);assert.equal(c.diagnostics.filter(d=>d.severity==='error').length,0,`${name} diagnostics: ${JSON.stringify(c.diagnostics)}`);assert.ok(c.javascript,`${name} compiler output`);const proc=spawnSync(process.execPath,['-e',c.javascript],{encoding:'utf8',timeout:5000});assert.equal(proc.status,0,`${name}: ${proc.stdout} ${proc.stderr}`);assert.deepEqual(proc.stdout.trim().split('\n').filter(Boolean),expected,`${name} output`);console.log('✓',name);passed++}
function check(name,fn){fn();console.log('✓',name);passed++}
run('else-if chained',`ingat nilai sebagai 78
jika nilai >= 90 maka
 tampilkan "A"
atau jika nilai >= 75 maka
 tampilkan "B"
atau jika nilai >= 60 maka
 tampilkan "C"
jika tidak
 tampilkan "D"
selesai`,['B']);
run('else-if fallthrough',`ingat nilai sebagai 40
jika nilai >= 90 maka
 tampilkan "A"
atau jika nilai >= 75 maka
 tampilkan "B"
jika tidak
 tampilkan "D"
selesai`,['D']);
run('range increasing',`untuk i dari 1 sampai 5 langkah 2
 tampilkan i
selesai`,['1','3','5']);
run('range descending',`untuk i dari 5 sampai 1 langkah -2
 tampilkan i
selesai`,['5','3','1']);
run('range default',`untuk i dari 2 sampai 4
 tampilkan i
selesai`,['2','3','4']);
run('array indexed assignment',`ingat d sebagai [1,2,3]
d[1] = 42
tampilkan d`,['[1,42,3]']);
run('dict indexed assignment',`ingat d sebagai {"nama":"Tono"}
d["nama"] = "Akhtar"
tampilkan d["nama"]`,['Akhtar']);
run('map and filter',`fungsi kali2(x)
 kembalikan x * 2
selesai
fungsi besar(x)
 kembalikan x > 4
selesai
ingat a sebagai petakan([1,2,3,4], kali2)
tampilkan saring(a, besar)`,['[6,8]']);
run('reduce and unique',`fungsi tambah_semua(a,b)
 kembalikan a + b
selesai
tampilkan reduksi([1,2,3,4], tambah_semua, 0)
tampilkan unik([1,1,2,3,3])`,['10','[1,2,3]']);
run('every, some, find',`fungsi lebih_besar(x)
 kembalikan x > 3
selesai
tampilkan semua([5,6], lebih_besar)
tampilkan ada([1,4], lebih_besar)
tampilkan temukan([1,4,7], lebih_besar)`,['benar','benar','4']);
run('array and text helpers',`tampilkan rata_rata([4,6,8])
tampilkan potong([1,2,3,4],1,3)
tampilkan format("Halo {0}, kelas {1}","Akhtar",9)`,['6','[2,3]','Halo Akhtar, kelas 9']);
run('async alias and concurrent',`asinkron fungsi dua()
 tunggu jeda(2)
 kembalikan 2
selesai
asinkron fungsi empat()
 kembalikan 4
selesai
tampilkan tunggu serentak([dua(),empat()])`,['[2,4]']);
run('nested conditions',`ingat a sebagai 2
jika a >= 1 maka
 jika a == 1 maka
  tampilkan "satu"
 atau jika a == 2 maka
  tampilkan "dua"
 jika tidak
  tampilkan "lain"
 selesai
selesai`,['dua']);
run('try catch error from invalid range',`coba tangkap e
 untuk i dari 1 sampai 10 langkah 0
  tampilkan i
 selesai
tangkap
 tampilkan "Ditangkap"
selesai`,['Ditangkap']);
check('missing import diagnosed',()=>{const c=A.compile('impor x dari "hilang"');assert.ok(c.diagnostics.some(d=>/tidak ditemukan/.test(d.message)))});
check('cyclic import diagnosed',()=>{const c=A.compileProject({'program.aks':'impor x dari "b"\nekspor ingat y sebagai 1','b.aks':'impor y dari "program"\nekspor ingat x sebagai 2'});assert.equal(c.javascript,null);assert.ok(c.diagnostics.some(d=>/melingkar/.test(d.message)),JSON.stringify(c.diagnostics))});
check('invalid assignment rejected',()=>assert.ok(A.compile('1 = 2').diagnostics.some(d=>/Target perubahan/.test(d.message))));
check('syntax missing end rejected',()=>assert.ok(A.compile('untuk i dari 1 sampai 3\n tampilkan i').diagnostics.some(d=>/belum ditutup/.test(d.message))));
check('forbidden property blocked',()=>assert.ok(A.compile('tampilkan x.constructor').diagnostics.some(d=>/Properti dilarang/.test(d.message))));
console.log(`${passed} advanced tests passed`);
