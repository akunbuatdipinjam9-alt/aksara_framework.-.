'use strict';
const fs = require('node:fs');
const path = require('node:path');

const MAX_FILES = 40;
const MAX_SIZE = 100_000;
const FILE_RE = /^[A-Za-z0-9_-]+\.aks$/;

function ensureName(name) {
  if (typeof name !== 'string' || !FILE_RE.test(name)) throw Error('Nama berkas harus berupa nama sederhana dengan ekstensi .aks');
  return name;
}
function ensureRoot(root) {
  if (typeof root !== 'string' || !root) throw Error('Folder proyek belum dipilih');
  const resolved = path.resolve(root);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) throw Error('Folder proyek tidak ditemukan');
  return fs.realpathSync(resolved);
}
function targetFile(root, name) {
  name = ensureName(name);
  const parent = ensureRoot(root);
  const target = path.join(parent, name);
  // File .aks harus di root proyek; symlink tidak boleh dibaca, diubah atau dihapus.
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isSymbolicLink() || !fs.lstatSync(target).isFile()) throw Error('Berkas simbolik/non-reguler tidak diperbolehkan');
  }
  return target;
}
function listFiles(root) {
  const parent = ensureRoot(root);
  const names = fs.readdirSync(parent).filter(name => FILE_RE.test(name));
  if (names.length > MAX_FILES) throw Error('Proyek maksimum 40 berkas .aks');
  return names.sort((a,b) => a === 'program.aks' ? -1 : b === 'program.aks' ? 1 : a.localeCompare(b));
}
function readProject(root) {
  const parent = ensureRoot(root);
  const names = listFiles(parent);
  if (!names.includes('program.aks')) throw Error('Tidak ada program.aks. Pilih folder proyek Aksara atau buat proyek baru.');
  const files = Object.create(null);
  for (const name of names) {
    const target = targetFile(parent, name);
    const stats = fs.statSync(target);
    if (stats.size > MAX_SIZE) throw Error(name + ' melebihi 100 KB');
    files[name] = fs.readFileSync(target, 'utf8');
  }
  return {path:parent,name:path.basename(parent),entry:'program.aks',files};
}
function createProject(root) {
  const parent = ensureRoot(root);
  if (fs.readdirSync(parent).length) throw Error('Pilih folder kosong untuk proyek baru, agar tidak menimpa berkas lain.');
  const program = '# Aksara Studio 4.0\ntetap nama sebagai "Dunia"\ntampilkan "Halo, " + nama\n';
  fs.writeFileSync(path.join(parent,'program.aks'),program,{flag:'wx'});
  fs.writeFileSync(path.join(parent,'aksara.json'),JSON.stringify({nama:path.basename(parent),versi:'0.1.0',utama:'program.aks',paket:{}},null,2)+'\n',{flag:'wx'});
  return readProject(parent);
}
function checkContent(content) {
  if (typeof content !== 'string' || Buffer.byteLength(content,'utf8') > MAX_SIZE) throw Error('Isi berkas harus teks dan maksimum 100 KB');
}
function saveFile(root, name, content, createOnly = false) {
  checkContent(content);
  const parent=ensureRoot(root);
  const target=targetFile(parent,name);
  const exists=fs.existsSync(target);
  if(createOnly && exists) throw Error('Berkas sudah ada: '+name);
  if(!exists && listFiles(parent).length >= MAX_FILES) throw Error('Proyek maksimum 40 berkas .aks');
  // Atomic replace: avoid truncated files on write errors.
  const tmp=path.join(parent,'.aksara-'+process.pid+'-'+require('node:crypto').randomBytes(6).toString('hex')+'.tmp');
  try {
    fs.writeFileSync(tmp,content,{flag:'wx'});
    if(createOnly) {
      // Exclusive creation prevents replacement when the filename already exists.
      fs.copyFileSync(tmp,target,fs.constants.COPYFILE_EXCL);
    } else {
      // Reject newly-created symlinks immediately before replace.
      targetFile(parent,name);
      fs.renameSync(tmp,target);
      return name;
    }
    return name;
  } finally {try{fs.unlinkSync(tmp)}catch{}}
}
function saveAll(root, contents) {
  if(!contents || typeof contents!=='object'||Array.isArray(contents)) throw Error('Data proyek tidak valid');
  const names=Object.keys(contents);
  if(names.length>MAX_FILES || !Object.hasOwn(contents,'program.aks')) throw Error('Proyek tidak valid: harus ada program.aks dan maksimum 40 berkas');
  if(new Set([...listFiles(root),...names]).size>MAX_FILES)throw Error('Proyek maksimum 40 berkas .aks');
  for(const name of names) {targetFile(root,name);checkContent(contents[name])}
  for(const name of names) saveFile(root,name,contents[name]);
  return {saved:names.length};
}
function deleteFile(root,name) {
  if(name==='program.aks') throw Error('program.aks tidak boleh dihapus');
  const target=targetFile(root,name);
  if(!fs.existsSync(target)) throw Error('Berkas tidak ditemukan');
  fs.unlinkSync(target);
  return name;
}
module.exports={MAX_FILES,MAX_SIZE,ensureName,ensureRoot,readProject,createProject,saveFile,saveAll,deleteFile};
