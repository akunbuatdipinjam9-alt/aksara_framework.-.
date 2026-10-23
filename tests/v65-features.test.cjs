'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const vm=require('node:vm');
const Runtime=require('../runtime.js');
global.AksaraRuntime=Runtime;
const Compiler=require('../compiler.js');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'aksara-v65-'));
const cli=path.resolve(__dirname,'../cli.js');
let tests=0;
function compile(source,strict=true){const r=Compiler.compile(source,{strict});assert.deepEqual(r.diagnostics.filter(d=>d.severity==='error'),[],JSON.stringify(r.diagnostics));new vm.Script(r.javascript);tests++;return r}
function run(source,expected){const file=path.join(temp,'test.aks');fs.writeFileSync(file,source);const r=cp.spawnSync(process.execPath,[cli,'run',file],{cwd:temp,encoding:'utf8',timeout:15000});assert.equal(r.status,0,r.stderr);if(expected)assert.match(r.stdout,expected);tests++;return r}
(async()=>{
 try{
  assert.match(Compiler.version,/^(?:6\.5\.0|7\.0\.0)/);tests++;
  compile('gunakan python "random"\nangka = tunggu random.randint(1, 100)\ntampilkan angka');
  compile('gunakan python "statistics" sebagai statistik\ntampilkan tunggu statistik.mean([10,20,30])');
  run('gunakan javascript "node:os" sebagai os\ntampilkan os.platform()',new RegExp(process.platform));
  run('gunakan javascript "node:path"\ntampilkan path.basename("folder/test.txt")',/test\.txt/);
  run('hasil = tunggu bersamaan([jeda(10), jeda(20)])\ntampilkan panjang(hasil)',/2/);
  run('tampilkan baca_json("{\\"nama\\":\\"Aksara\\"}").nama',/Aksara/);
  fs.writeFileSync(path.join(temp,'data.json'),JSON.stringify({nama:'Aksara',versi:65}));
  run('data = tunggu baca_file_json("data.json")\ntampilkan "{data}"',/"nama":"Aksara"/);
  run('data = tunggu baca_file_json("data.json")\ntampilkan data.nama',/Aksara/);
  run('hasil = tunggu simpan_file_json("output.json", {nama:"Aksara", versi:65})\ntampilkan hasil',/benar/);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(temp,'output.json'),'utf8')),{nama:'Aksara',versi:65});tests++;
  for(const src of ['gunakan python "../os"','gunakan javascript "../../evil"','gunakan python "random" sebagai __rt']){
   const r=Compiler.compile(src,{strict:true});assert.equal(r.javascript,null);assert(r.diagnostics.some(d=>d.severity==='error'));tests++;
  }
  const rt=Runtime();
  await assert.rejects(rt.readJSONFile('../outside.json'),/di dalam folder proyek/);tests++;
  await assert.rejects(rt.writeJSONFile('../outside.json',{x:1}),/di dalam folder proyek/);tests++;
  await assert.rejects(rt.readJSONFile('missing.json'),/ENOENT/);tests++;
  await assert.rejects(rt.writeJSONFile('bad.txt',{x:1}),/\.json/);tests++;
  const py=cp.spawnSync('python3',['--version'],{encoding:'utf8'});
  if(py.status===0){
   const env=cp.spawnSync('python3',['-m','venv',path.join(temp,'.aksara-venv')],{timeout:30000,encoding:'utf8'});
   assert.equal(env.status,0,env.stderr);
   run('gunakan python "statistics" sebagai stats\nhasil = tunggu stats.mean([10,20,30])\ntampilkan hasil',/20/);
   run('gunakan python "random"\nhasil = tunggu random.randint(10,10)\ntampilkan hasil',/10/);
   run('gunakan python\nhasil = tunggu python_panggil_async("statistics", "mean", [[1,2,3]])\ntampilkan hasil',/2/);
   const prev=process.cwd();process.chdir(temp);
   try{
    const rtp=Runtime();rtp.enable('python');
    let timerFired=false;
    const pending=rtp.pythonCallAsync('time','sleep',[0.2]);
    setTimeout(()=>{timerFired=true},10);
    assert.equal(await pending,null);assert.equal(timerFired,true);tests++;
    await assert.rejects(rtp.pythonCallAsync('time','sleep',[0.5],30),/batas waktu/);tests++;
   }finally{process.chdir(prev)}
  }else console.log('Python tidak tersedia: tes Python async dilewati');
  console.log('✓ '+tests+' tes v6.5: Smart Import, JSON, Async Engine 2.0');
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
