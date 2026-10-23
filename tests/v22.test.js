'use strict';
const assert=require('node:assert/strict');const {spawnSync}=require('./process.cjs');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
global.AksaraRuntime=require('../runtime.js');const A=require('../compiler.js');const fmt=require('../formatter.js');let passed=0;
function test(label,code,expected){const c=A.compile(code);assert.equal(c.diagnostics.filter(d=>d.severity==='error').length,0,`${label} ${JSON.stringify(c.diagnostics)}`);const run=spawnSync(process.execPath,['-e',c.javascript],{encoding:'utf8',timeout:8000});assert.equal(run.status,0,`${label}\n${run.stderr}`);assert.deepEqual(run.stdout.trim().split('\n').filter(Boolean),expected,label);passed++;console.log('✓ '+label)}
function failed(label,code,pattern){const c=A.compile(code);assert.match(JSON.stringify(c.diagnostics),pattern);passed++;console.log('✓ '+label)}
test('pilih kasus pertama','ingat n sebagai 1\npilih n\nkasus 1\ntampilkan "satu"\nkasus 2\ntampilkan "dua"\nlainnya\ntampilkan "lain"\nselesai',['satu']);
test('pilih kasus tengah','ingat n sebagai 2\npilih n\nkasus 1\ntampilkan "satu"\nkasus 2\ntampilkan "dua"\nlainnya\ntampilkan "lain"\nselesai',['dua']);
test('pilih default','pilih 5\nkasus 1\ntampilkan "satu"\nlainnya\ntampilkan "default"\nselesai',['default']);
test('pilih no default','pilih 5\nkasus 2\ntampilkan "dua"\nselesai\ntampilkan "lanjut"',['lanjut']);
test('pilih nested','pilih 2\nkasus 2\npilih "ID"\nkasus "ID"\ntampilkan "Indonesia"\nselesai\nlainnya\ntampilkan "lain"\nselesai',['Indonesia']);
test('pilih once', 'ingat x sebagai 1\nfungsi naik()\n x = x + 1\n kembalikan x\nselesai\npilih naik()\nkasus 1\ntampilkan "salah"\nkasus 2\ntampilkan "sekali"\nselesai\ntampilkan x',['sekali','2']);
test('pilih expression','pilih 3 * 2\nkasus 4 + 2\ntampilkan "cocok"\nselesai',['cocok']);
test('komentar inline','ingat nilai sebagai 8 # angka\ntampilkan nilai # catatan',['8']);
test('hash dalam string','tampilkan "# bukan komentar"',['# bukan komentar']);
test('multiline with comment','ingat a sebagai [1, # one\n2, 3]\ntampilkan jumlah(a)',['6']);
failed('kasus without pilih','kasus 1\ntampilkan 1\nselesai',/Token berlebih|tidak dikenal/);
failed('pilih missing selesai','pilih 1\nkasus 1\ntampilkan 1',/belum ditutup/);
failed('pilih duplicate default','pilih 1\nlainnya\ntampilkan 1\nlainnya\ntampilkan 2\nselesai',/cabang terakhir/);

failed('nested constant protected', 'tetap x sebagai 1\njika benar maka\n x = 2\nselesai',/Konstanta/);
test('shadowing parameter','tetap x sebagai 5\nfungsi ganti(x)\n x = 4\n tampilkan x\nselesai\nganti(1)\ntampilkan x',['4','5']);
const duplicate=A.compile('pilih 1\nkasus 1\ntampilkan "satu"\nkasus 1\ntampilkan "duplikat"\nselesai');assert.ok(duplicate.javascript);assert.match(JSON.stringify(duplicate.diagnostics),/duplikat/);console.log('✓ duplicate case warning');passed++;
let code='jika benar maka\ntampilkan "ok"\njika tidak\ntampilkan "no"\nselesai';assert.equal(fmt.format(fmt.format(code)),fmt.format(code));assert.match(fmt.format(code),/^jika benar maka\n    tampilkan "ok"/);console.log('✓ formatter branching');passed++;
let nesting='pilih 1\nkasus 1\njika benar maka\ntampilkan 10\nselesai\nlainnya\ntampilkan 5\nselesai';const formatted=fmt.format(nesting);assert.equal(fmt.format(formatted),formatted);assert.equal(A.compile(formatted).diagnostics.length,0);assert.match(formatted,/    kasus 1\n        jika benar maka\n            tampilkan 10/);console.log('✓ formatter selection');passed++;
const sourcemap=A.compile('tampilkan 42').sourceMap;assert.equal(sourcemap.version,3);assert.deepEqual(sourcemap.sources,['program.aks']);assert.ok(sourcemap.mappings.includes('A'));assert.deepEqual(sourcemap.sourcesContent,['tampilkan 42']);console.log('✓ source map metadata');passed++;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aksara-22-'));try{const input=path.join(dir,'sample.aks');fs.writeFileSync(input,'tampilkan "jalan"\n');const built=spawnSync(process.execPath,[path.join(__dirname,'../cli.js'),'build',input,path.join(dir,'out.js')],{encoding:'utf8'});assert.equal(built.status,0,built.stderr);assert.ok(fs.existsSync(path.join(dir,'out.js.map')));const js=spawnSync(process.execPath,[path.join(dir,'out.js')],{encoding:'utf8'});assert.equal(js.stdout.trim(),'jalan');const parsed=JSON.parse(fs.readFileSync(path.join(dir,'out.js.map'),'utf8'));assert.equal(parsed.file,'out.js');console.log('✓ CLI build + source map');passed++;
const fmtcli=spawnSync(process.execPath,[path.join(__dirname,'../cli.js'),'fmt',input],{encoding:'utf8'});assert.equal(fmtcli.status,0,fmtcli.stderr);assert.equal(fmtcli.stdout,'tampilkan "jalan"\n');console.log('✓ CLI fmt');passed++;
}finally{fs.rmSync(dir,{recursive:true,force:true})}
console.log('v2.2: '+passed+' tests passed');
