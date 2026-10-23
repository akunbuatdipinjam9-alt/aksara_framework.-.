'use strict';
// Aksara package workflow: npm-backed and deliberately project-local.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*|[a-z0-9][a-z0-9._-]*)(?:@(?:\d[^\s]*|latest|next|beta|alpha))?$/i;
const LOCAL = /^(?:file:)?\.\/[\w./-]+$/;
function projectDir(dir=process.cwd()) {
  const root = path.resolve(dir);
  if (!fs.existsSync(path.join(root,'aksara.json'))) throw Error('Tidak ada aksara.json. Jalankan di folder proyek yang dibuat dengan: aksara buat nama-proyek');
  return root;
}
function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8'))}
function ensureManifest(root){
  const file=path.join(root,'package.json');
  if(!fs.existsSync(file)) {
    const a=readJson(path.join(root,'aksara.json'));
    fs.writeFileSync(file,JSON.stringify({name:String(a.nama||'aksara-proyek').toLowerCase().replace(/[^a-z0-9._-]/g,'-'),version:'0.1.0',private:true,description:'Dependencies for an Aksara project',dependencies:{}},null,2)+'\n');
  }
  return file;
}
function validateSpec(spec,root){
  if(typeof spec!=='string'||spec.length>150||spec.startsWith('-'))throw Error('Nama paket tidak valid');
  if(NAME.test(spec))return spec;
  if(LOCAL.test(spec)) {
    const relative=spec.replace(/^file:/,'');
    const target=path.resolve(root,relative);
    if(!target.startsWith(root+path.sep))throw Error('Paket lokal harus berada di dalam proyek');
    if(!fs.existsSync(path.join(target,'package.json')))throw Error('Paket lokal harus memiliki package.json');
    return spec.startsWith('file:')?spec:'file:'+relative;
  }
  throw Error('Gunakan nama paket npm (contoh: lodash) atau file:./folder-lokal');
}
function npm(root,args){
  let executable='npm', commandArgs=args;
  if(process.platform==='win32') {
    // .cmd cannot be spawned with shell:false. Run npm's JS entrypoint directly.
    const directories=[path.dirname(process.execPath),...(process.env.PATH||'').split(path.delimiter).map(p=>p.replace(/^"|"$/g,''))];
    const candidates=[process.env.npm_execpath,...directories.map(dir=>path.join(dir,'node_modules','npm','bin','npm-cli.js'))];
    const cli=candidates.find(file=>file && path.basename(file)==='npm-cli.js' && fs.existsSync(file));
    if(!cli)throw Error('npm CLI tidak ditemukan. Pastikan Node.js dan npm terpasang lengkap.');
    executable=process.execPath;commandArgs=[cli,...args];
  }
  const result=spawnSync(executable,commandArgs,{cwd:root,stdio:'inherit',timeout:180000,shell:false,windowsHide:true,env:{...process.env,ELECTRON_RUN_AS_NODE:'1',npm_config_audit:'false',npm_config_fund:'false'}});
  if(result.error)throw Error('npm gagal: '+result.error.message);
  if(result.status!==0)throw Error('npm berhenti dengan kode '+result.status);
}
function sync(root){
  const aksFile=path.join(root,'aksara.json'),aks=readJson(aksFile),pkg=readJson(ensureManifest(root));
  aks.paket={...pkg.dependencies};
  fs.writeFileSync(aksFile,JSON.stringify(aks,null,2)+'\n');
  return aks.paket;
}
function verifyLock(root){
 const pkg=readJson(ensureManifest(root)),file=path.join(root,'package-lock.json');
 if(!fs.existsSync(file))throw Error('package-lock.json belum ada. Jalankan: aksara paket pasang');
 const lock=readJson(file),actual=lock.packages?.['']?.dependencies||{};
 for(const [name,wanted] of Object.entries(pkg.dependencies||{}))if(actual[name]!==wanted)throw Error(`Lockfile tidak cocok untuk '${name}': manifest ${wanted}, lock ${actual[name]||'-'}`);
 for(const name of Object.keys(actual))if(!Object.hasOwn(pkg.dependencies||{},name))throw Error(`Lockfile mencatat dependency '${name}' yang tidak ada di package.json`);
 if(!lock.lockfileVersion||!lock.packages)throw Error('Format package-lock tidak didukung. Perbarui dengan npm install');
 return {dependencies:Object.keys(actual).length,version:lock.lockfileVersion};
}
function manage(command,spec,dir){
  const root=projectDir(dir);
  if(command==='kunci'||command==='lock'){
    const result=verifyLock(root);console.log(`✓ Lockfile cocok · ${result.dependencies} dependency · format ${result.version}`);return 0;
  }
  if(command==='ci'||command==='pasang-terkunci'){
    ensureManifest(root);verifyLock(root);npm(root,['ci','--ignore-scripts','--no-audit','--no-fund']);sync(root);
    console.log('✓ Dependencies dipasang sesuai package-lock.json');return 0;
  }
  if(command==='daftar'||command==='list'){
    const deps=sync(root),items=Object.entries(deps);
    if(!items.length)console.log('Belum ada paket. Coba: aksara paket tambah <nama>');
    for(const [name,version] of items)console.log(name+'  '+version+(fs.existsSync(path.join(root,'node_modules',...name.split('/')))?'  ✓ terpasang':'  (belum terpasang)'));
    return 0;
  }
  if(command==='tambah'||command==='add'){
    if(!spec)throw Error('Pemakaian: aksara paket tambah <nama|file:./folder>');
    ensureManifest(root);
    npm(root,['install','--save','--ignore-scripts','--no-audit','--no-fund',validateSpec(spec,root)]);
    sync(root);console.log('✓ Paket terdaftar di aksara.json');return 0;
  }
  if(command==='hapus'||command==='remove'){
    if(!spec||!NAME.test(spec)||spec.includes('@',1)&&!spec.startsWith('@'))throw Error('Pemakaian: aksara paket hapus <nama>');
    ensureManifest(root);
    npm(root,['uninstall','--save','--ignore-scripts','--no-audit','--no-fund',spec]);
    sync(root);console.log('✓ Paket dihapus dari proyek');return 0;
  }
  if(command==='pasang'||command==='install'){
    ensureManifest(root);npm(root,['install','--ignore-scripts','--no-audit','--no-fund']);sync(root);
    console.log('✓ Dependency proyek selesai dipasang');return 0;
  }
  throw Error('Perintah paket: tambah <nama>, hapus <nama>, daftar, pasang, kunci, ci');
}
module.exports={manage,validateSpec,projectDir,verifyLock};
