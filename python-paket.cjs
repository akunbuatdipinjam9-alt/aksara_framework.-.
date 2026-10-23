'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=process.cwd(),venv=path.join(root,'.aksara-venv');
const python=process.platform==='win32'?path.join(venv,'Scripts','python.exe'):path.join(venv,'bin','python');
function run(exe,args){const r=cp.spawnSync(exe,args,{cwd:root,stdio:'inherit',timeout:180000,shell:false});if(r.error)throw Error(r.error.message);if(r.status!==0)throw Error('Perintah gagal ('+r.status+')')}
function ensure(){if(!fs.existsSync(path.join(root,'aksara.json')))throw Error('Jalankan dari folder proyek yang memiliki aksara.json')}
function manage(command,spec){ensure();if(command==='py:siapkan'){if(fs.existsSync(python)){console.log('✓ Virtual environment sudah ada');return 0}
 const candidates=process.platform==='win32'?[['py',['-3']],['python',[]],['python3',[]]]:[['python3',[]],['python',[]]];
 const selected=candidates.find(([exe,args])=>cp.spawnSync(exe,[...args,'-c','import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)'],{stdio:'ignore',timeout:10000,windowsHide:true}).status===0);
 if(!selected)throw Error('Python 3.8+ tidak ditemukan. Pasang Python dengan modul venv dan tambahkan ke PATH.');
 run(selected[0],[...selected[1],'-m','venv',venv]);return 0}
 if(!fs.existsSync(python))throw Error('Jalankan dahulu: node cli.js paket py:siapkan');
 if(command==='daftar'&&spec==='py:' || command==='py:daftar'){run(python,['-m','pip','list']);return 0}
 if(!['tambah','hapus'].includes(command)||!String(spec).startsWith('py:'))throw Error('Gunakan: paket tambah py:numpy | paket hapus py:numpy | paket py:daftar');
 const name=spec.slice(3);if(!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*(?:==[0-9][a-zA-Z0-9_.-]*)?$/.test(name)||name.length>120)throw Error('Nama paket PyPI tidak valid');
 run(python,['-m','pip',command==='tambah'?'install':'uninstall',...(command==='hapus'?['-y']:[]),name]);return 0}
module.exports={manage};
