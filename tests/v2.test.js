'use strict';
const assert=require('node:assert/strict');const {spawnSync}=require('./process.cjs');
global.AksaraRuntime=require('../runtime.js');const A=require('../compiler.js');let ok=0;
function run(name,code,expected){const out=A.compile(code);assert.equal(out.diagnostics.filter(d=>d.severity==='error').length,0,JSON.stringify(out.diagnostics));assert.ok(out.javascript, name);const p=spawnSync(process.execPath,['-e',out.javascript],{encoding:'utf8',timeout:8000,cwd:__dirname});assert.equal(p.status,0,`${name}: ${p.stderr} ${p.stdout}`);assert.deepEqual(p.stdout.trim().split('\n').filter(Boolean),expected,name);console.log('✓ '+name);ok++}
function fail(name,code,pattern){const p=A.compile(code);assert.ok(p.diagnostics.length || !p.javascript);assert.match(JSON.stringify(p.diagnostics),pattern);console.log('✓ '+name);ok++}
run('tetap konstanta','tetap phi sebagai 3.14\ntampilkan phi',['3.14']);
run('operator dalam array','tampilkan 2 dalam [1,2,3]',['benar']);
run('operator dalam teks','tampilkan "sa" dalam "Aksara"',['benar']);
run('operator dalam kamus','tampilkan "x" dalam {"x":1}',['benar']);
run('operator dalam kosong','tampilkan 2 dalam kosong',['salah']);
run('null coalescing','ingat n sebagai kosong\ntampilkan n ?? 15\ntampilkan 0 ?? 99',['15','0']);
run('operator precedence','tampilkan 1 + 2 * 4\ntampilkan salah atau benar dan benar',['9','benar']);
run('multiline dictionary','ingat obj sebagai {\n "nama": "Aksara",\n "nilai": [\n  10, 20\n ]\n}\ntampilkan obj["nilai"][1]',['20']);
run('multiline nested array','ingat a sebagai [\n [1,2],\n [3,4]\n]\ntampilkan a[1][0]',['3']);
run('assert pass','pastikan(3 == 3, "harus sama")\ntampilkan "OK"',['OK']);
run('storage in process','gunakan penyimpanan\ntunggu simpan_data("nama", {"nama":"Akhtar"})\ntampilkan (tunggu baca_data("nama"))["nama"]\ntunggu hapus_data("nama")\ntampilkan tunggu baca_data("nama")',['Akhtar','kosong']);
run('storage keys','gunakan penyimpanan\ntunggu simpan_data("warna", "biru")\ntampilkan tunggu daftar_data()',['[\"warna\"]']);
run('web not in CLI fails guarded','tampilkan "Node tersedia"',['Node tersedia']);
run('node javascript interop','gunakan javascript\ningat crypto sebagai tunggu modul_js("node:crypto")\ntampilkan panjang(crypto.randomUUID())',['36']);
run('full OOP regression','kelas Ortu\n fungsi mulai(nama)\n  diri.nama=nama\n selesai\nselesai\nkelas Anak mewarisi Ortu\n fungsi tampil()\n  tampilkan diri.nama\n selesai\nselesai\ningat a sebagai baru Anak("Alice")\na.tampil()',['Alice']);
run('internal assertion helper','ingat a sebagai [4,5]\npastikan(panjang(a)==2)\ntampilkan a',['[4,5]']);
fail('duplicate variable','tetap x sebagai 1\ningat x sebagai 2',/sudah dideklarasikan/);
fail('illegal constant mutation','tetap x sebagai 1\nx = 2',/tidak bisa diubah/);
fail('unknown bracket','ingat data sebagai [1,2',/belum ditutup/);
fail('unknown property','ingat a sebagai {"x":1}\ntampilkan a.__proto__',/Properti dilarang/);
console.log('NEW V2 TESTS',ok);
