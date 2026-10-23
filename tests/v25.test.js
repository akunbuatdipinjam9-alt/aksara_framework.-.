'use strict';
const assert=require('node:assert/strict');
const {spawnSync}=require('./process.cjs');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
global.AksaraRuntime=require('../runtime.js');
const A=require('../compiler.js');
let passed=0;
function ok(label,fn){fn();console.log('✓ '+label);passed++}
function run(code){const c=A.compile(code);assert.equal(c.diagnostics.filter(d=>d.severity==='error').length,0,JSON.stringify(c.diagnostics));const r=spawnSync(process.execPath,['-e',c.javascript],{encoding:'utf8',timeout:8000});assert.equal(r.status,0,r.stderr);return r.stdout.trim()}
function checkError(label,code,pattern,strict=false){ok(label,()=>{const r=A.compile(code,{strict});assert.match(JSON.stringify(r.diagnostics),pattern);assert.equal(r.javascript,null)})}
ok('version 2.5',()=>assert.equal(A.version,require('../package.json').version));
ok('lexer provides token source positions',()=>{const toks=A.lex('# tes\ningat nama: teks sebagai "Aksara"\ntampilkan nama');assert.equal(toks[0].type,'comment');assert.deepEqual([toks[2].raw,toks[2].line,toks[2].column],['ingat',2,1]);assert.ok(toks.some(t=>t.raw==='"Aksara"'&&t.line===2&&t.column===26))});
ok('lexer UTF8 unicode identifier',()=>{const toks=A.lex('ingat siswa_ñ sebagai 1');assert.ok(toks.some(t=>t.raw==='siswa_ñ'))});
ok('lexer fails with column',()=>{assert.throws(()=>A.lex('tampilkan @'),e=>e.line===1&&e.column===11)});
ok('typed declarations work',()=>{assert.equal(run('ingat nama: teks sebagai "Akhtar"\ningat umur: angka sebagai 14\ningat aktif: logika sebagai benar\ningat daftar: daftar sebagai [1, 2]\ntampilkan nama + umur'),'Akhtar14')});
ok('typed declaration multiline works',()=>{assert.equal(run('ingat profil: kamus sebagai {\n"nama": "Akhtar"\n}\ntampilkan profil["nama"]'),'Akhtar')});
checkError('wrong typed initializer','ingat umur: angka sebagai "empat"',/bertipe angka/);
checkError('wrong typed assignment','ingat umur: angka sebagai 14\numur = "empat"',/harus bertipe angka/);
checkError('unknown annotation','ingat usia: umur sebagai 14',/tidak dikenal/);
checkError('strict unknown reference','tampilkan tidak_ada',/belum dideklarasikan/,true);
ok('non-strict allows dynamic lookup until runtime',()=>{const c=A.compile('tampilkan tidak_ada');assert.ok(c.javascript)});
checkError('strict wrong assignment using ubah','ubah angka_lain menjadi 3',/belum dideklarasikan/,true);
ok('strict knows builtins',()=>{const c=A.compile('ingat data sebagai [1, 2, 3]\ntampilkan panjang(data)',{strict:true});assert.equal(c.diagnostics.filter(d=>d.severity==='error').length,0,JSON.stringify(c.diagnostics))});
ok('strict can call function before its declaration',()=>{const c=A.compile('tampilkan dua()\nfungsi dua()\nkembalikan 2\nselesai',{strict:true});assert.equal(c.diagnostics.filter(d=>d.severity==='error').length,0)});
ok('strict knows iterator local',()=>{const c=A.compile('untuk setiap nama dalam ["a"]\ntampilkan nama\nselesai',{strict:true});assert.equal(c.diagnostics.filter(d=>d.severity==='error').length,0)});
ok('strict knows implicit indeks',()=>{const c=A.compile('ulangi 2 kali\ntampilkan indeks\nselesai',{strict:true});assert.equal(c.diagnostics.filter(d=>d.severity==='error').length,0)});
ok('strict knows catch variable',()=>{const c=A.compile('coba tangkap masalah\nlempar "x"\ntangkap\ntampilkan masalah\nselesai',{strict:true});assert.equal(c.diagnostics.filter(d=>d.severity==='error').length,0)});
checkError('self cannot be outside class','tampilkan diri.nama',/hanya boleh di dalam metode kelas/);
ok('data processing regression',()=>assert.equal(run('ingat nilai sebagai [80, 90, 100]\ntampilkan rata_rata(nilai)'),'90'));
ok('inheritance regression',()=>{const src='kelas Asal\n fungsi mulai(n)\n diri.n = n\n selesai\n fungsi ambil()\n kembalikan diri.n\n selesai\nselesai\nkelas Anak mewarisi Asal\n fungsi tambah()\n kembalikan diri.n + 1\n selesai\nselesai\ningat n sebagai baru Anak(4)\ntampilkan n.tambah()';assert.equal(run(src),'5')});
ok('strict module exports import',()=>{const src={'program.aks':'impor salam dari "bantu"\ntampilkan salam("A")','bantu.aks':'ekspor fungsi salam(n)\nkembalikan "Halo "+n\nselesai'};const c=A.compileProject(src,'program.aks',{strict:true});assert.equal(c.diagnostics.filter(d=>d.severity==='error').length,0,JSON.stringify(c.diagnostics))});
ok('CLI tokens output',()=>{const r=spawnSync(process.execPath,[path.join(__dirname,'../cli.js'),'tokens',path.join(__dirname,'../examples/data.aks')],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.ok(JSON.parse(r.stdout).some(t=>t.column===1))});
ok('CLI --ketat rejects missing variable',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aks25-'));try{const file=path.join(dir,'x.aks');fs.writeFileSync(file,'tampilkan tidak_ada\n');const r=spawnSync(process.execPath,[path.join(__dirname,'../cli.js'),'check',file,'--ketat'],{encoding:'utf8'});assert.equal(r.status,1,r.stderr);assert.match(r.stderr,/belum dideklarasikan/)}finally{fs.rmSync(dir,{recursive:true,force:true})}});
ok('CLI typed example executes',()=>{const r=spawnSync(process.execPath,[path.join(__dirname,'../cli.js'),'run',path.join(__dirname,'../examples/typed.aks')],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/Aksara 2.5/) });
console.log('v2.5: '+passed+' tests passed');
