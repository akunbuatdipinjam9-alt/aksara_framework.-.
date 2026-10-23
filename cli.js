#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const http = require('node:http');

global.AksaraRuntime = require('./runtime.js');
global.AksaraLexer = require('./lexer.js');
global.AksaraSemantic = require('./semantic.js');

const A = require('./compiler.js');
const Formatter = require('./formatter.js');
const Paket = require('./paket.js');
const PythonPaket = require('./python-paket.cjs');

function usage() {
  console.log(`Aksara CLI v${A.version}

  aksara versi
  aksara doctor

  aksara paket py:siapkan
  aksara paket tambah py:numpy
  aksara paket tambah js:lodash
  aksara paket daftar
  aksara paket hapus <nama>
  aksara paket pasang
  aksara paket kunci
  aksara paket ci

  aksara buat [folder] --template dasar|api|data|uji
  aksara jalankan <berkas.aks>
  aksara bangun <berkas.aks> [js]
  aksara periksa <berkas.aks> [--ketat]

  node cli.js run <berkas.aks>
  node cli.js check <berkas.aks> [--ketat]
  node cli.js ast <berkas.aks>
  node cli.js tokens <berkas.aks>
  node cli.js build <berkas.aks> [js]
  node cli.js test <berkas.aks|folder-tes>
  node cli.js fmt <berkas.aks> [--write]
  node cli.js init [folder]
  node cli.js serve [port]

Catatan:
Python Bridge membutuhkan Python yang tersedia
di komputer dan environment proyek.
`);
}

function init(folder) {
  const dir = path.resolve(folder || 'aksara-baru');

  if (fs.existsSync(dir) && fs.readdirSync(dir).length) {
    throw new Error('Folder target sudah berisi file');
  }

  const templateIndex=process.argv.indexOf('--template');
  if(templateIndex>=0&&!['dasar','api','data','uji'].includes(process.argv[templateIndex+1]))throw Error('Template tidak dikenal; gunakan dasar, api, data, atau uji');

  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(
    path.join(dir, 'program.aks'),
    '# Program Aksara\n' +
    'tetap nama sebagai "Dunia"\n' +
    'tampilkan "Halo, " + nama\n' +
    'pastikan(2 + 2 == 4, "Matematika gagal")\n'
  );

  fs.writeFileSync(
    path.join(dir, 'aksara.json'),
    JSON.stringify({
      nama: path.basename(dir),
      versi: '0.1.0',
      utama: 'program.aks'
    }, null, 2) + '\n'
  );

  fs.writeFileSync(
    path.join(dir, 'README.txt'),
    'Jalankan: node /lokasi/aksara/cli.js run program.aks\n'
  );

  const templateArgIndex=process.argv.indexOf('--template');
  const template=templateArgIndex>=0?process.argv[templateArgIndex+1]:'dasar';
  const templates={
    dasar:null,
    api:'gunakan server\n\nfungsi halo(req, res)\n    res.json({pesan: "Halo dari Aksara v7"})\nselesai\n\napp = server_buat(3000)\napp.get("/api/halo", halo)\nalamat = tunggu app.jalankan()\ntampilkan "API aktif: {alamat}"\n',
    data:'data = {nama: "Aksara", versi: 7}\ntunggu simpan_file_json("data.json", data)\nhasil = tunggu baca_file_json("data.json")\ntampilkan "Halo, {hasil}"\n',
    uji:'uji "penjumlahan"\n    pastikan(2 + 2 == 4, "Hasil salah")\nselesai\n\nuji "teks"\n    nama = "Aksara"\n    pastikan(nama == "Aksara", "Nama salah")\nselesai\n'
  };
  if(!Object.hasOwn(templates,template))throw Error('Template tidak dikenal: '+template+' (dasar, api, data, uji)');
  if(templates[template]!==null)fs.writeFileSync(path.join(dir,'program.aks'),templates[template],'utf8');
  console.log('Template:',template);
  console.log('✓ Project Aksara baru:', dir);
  return 0;
}

function serve(portArg) {
  const port = Number(portArg || 4173);

  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error('Port harus 1024–65535');
  }

  const base = path.resolve(__dirname);

  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.aks': 'text/plain; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, 'http://localhost').pathname
      );

      let target = path.resolve(base, '.' + pathname);

      if (pathname === '/' || pathname.endsWith('/')) {
        target = path.join(target, 'index.html');
      }

      if (!target.startsWith(base + path.sep)) {
        res.writeHead(403).end('Forbidden');
        return;
      }

      const ext = path.extname(target);

      if (
        !Object.hasOwn(mime, ext) ||
        !fs.existsSync(target) ||
        !fs.statSync(target).isFile()
      ) {
        res.writeHead(404).end('Not Found');
        return;
      }

      res.setHeader('Content-Type', mime[ext]);
      res.setHeader('Cache-Control', 'no-store');

      fs.createReadStream(target).pipe(res);
    } catch {
      res.writeHead(400).end('Bad Request');
    }
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(
      `✓ Aksara Studio: http://127.0.0.1:${port}`
    );
  });

  return 0;
}

function doctor() {
  const version = process.versions.node.split('.').map(Number);

  const nodeOK =
    version[0] > 22 ||
    (version[0] === 22 && version[1] >= 13);

  const checks = [
    ['Node.js >=22.13 (SQLite)', nodeOK],
    ['Compiler', typeof A.compileProject === 'function'],
    ['Lexer', typeof A.lex === 'function'],
    ['Runtime', typeof global.AksaraRuntime === 'function'],
    ['Semantic checker', typeof global.AksaraSemantic === 'object'],
    ['IDE', fs.existsSync(path.join(__dirname, 'index.html'))]
  ];

  for (const [name, ok] of checks) {
    console.log((ok ? '✓' : '✗') + ' ' + name);
  }

  console.log(
    'Aksara SDK ' + A.version +
    ' | Node ' + process.version +
    ' | ' + process.platform
  );

  return checks.every(item => item[1]) ? 0 : 1;
}

function findNodeExecutable() {
  if (process.env.AKSARA_NODE_PATH) {
    const custom = path.resolve(process.env.AKSARA_NODE_PATH);

    if (!fs.existsSync(custom)) {
      throw new Error(
        'AKSARA_NODE_PATH tidak ditemukan: ' + custom
      );
    }

    return custom;
  }

  const executableName =
    process.platform === 'win32' ? 'node.exe' : 'node';

  const paths = (process.env.PATH || '')
    .split(path.delimiter)
    .filter(Boolean);

  for (const directory of paths) {
    const candidate = path.join(
      directory.replace(/^"|"$/g, ''),
      executableName
    );

    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  if (
    path.basename(process.execPath).toLowerCase() ===
    executableName.toLowerCase()
  ) {
    return process.execPath;
  }

  throw new Error(
    'Node.js tidak ditemukan. Instal Node.js atau ' +
    'atur AKSARA_NODE_PATH ke lokasi node.exe.'
  );
}

function runCompiledJavaScript(javascript, base) {
  const nodeExecutable = findNodeExecutable();
  const timeout=Number(process.env.AKSARA_RUN_TIMEOUT_MS||0);
  if(!Number.isInteger(timeout)||timeout<0||timeout>2147483647)throw Error('AKSARA_RUN_TIMEOUT_MS harus bilangan bulat 0–2147483647');

  // File sementara dibuat di folder proyek agar
  // require() dapat menemukan node_modules proyek.
  const tempDirectory = fs.mkdtempSync(
    path.join(base, '.aksara-run-')
  );

  const tempFile = path.join(
    tempDirectory,
    'program.cjs'
  );

  try {
    fs.writeFileSync(
      tempFile,
      javascript,
      'utf8'
    );

    const child = spawnSync(
      nodeExecutable,
      [tempFile],
      {
        cwd: base,
        stdio: 'inherit',
        timeout,
        windowsHide: true,
        shell: false,
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1'
        }
      }
    );

    if (child.error) {
      if (child.error.code === 'ETIMEDOUT') {
        throw new Error(
          'Program melewati batas waktu '+timeout+' ms.'
        );
      }

      throw child.error;
    }

    if (child.signal) {
      console.error(
        'Program dihentikan oleh sinyal:',
        child.signal
      );
      return 1;
    }

    return child.status ?? 1;
  } finally {
    fs.rmSync(tempDirectory, {
      recursive: true,
      force: true
    });
  }
}

function main() {
  let [mode, input, out] = process.argv.slice(2).filter(arg=>!['--ketat','--write'].includes(arg));

  const aliases = {
    buat: 'init',
    jalankan: 'run',
    bangun: 'build',
    periksa: 'check',
    rapikan: 'fmt',
    layani: 'serve',
    uji: 'test'
  };

  mode = aliases[mode] || mode;

  if (
    mode === 'versi' ||
    mode === 'version' ||
    mode === '--version'
  ) {
    console.log('Aksara SDK ' + A.version);
    return 0;
  }

  if (mode === 'doctor' || mode === 'dokter') {
    return doctor();
  }

  if (mode === 'paket') {
    const isPython =
      input?.startsWith('py:') ||
      String(out || '').startsWith('py:');

    if (isPython) {
      return PythonPaket.manage(input, out);
    }

    return Paket.manage(
      input?.startsWith('js:')
        ? input.slice(3)
        : input,
      String(out || '').startsWith('js:')
        ? out.slice(3)
        : out
    );
  }

  if (!mode || ['--help', '-h', 'help'].includes(mode)) {
    usage();
    return 0;
  }

  if (mode === 'init') {
    return init(input);
  }

  if (mode === 'serve' || mode === 'dev') {
    return serve(input);
  }

  const validModes = [
    'run',
    'check',
    'build',
    'ast',
    'tokens',
    'test',
    'fmt'
  ];

  if (!validModes.includes(mode) || !input) {
    usage();
    return 2;
  }

  if(mode==='test'&&fs.existsSync(path.resolve(input))&&fs.statSync(path.resolve(input)).isDirectory()){
    const dir=path.resolve(input);const files=fs.readdirSync(dir,{withFileTypes:true})
      .filter(item=>item.isFile()&&item.name.endsWith('.test.aks'))
      .map(item=>path.join(dir,item.name)).sort();
    if(!files.length)throw Error('Tidak ada file *.test.aks di folder '+dir);
    if(files.length>100)throw Error('Maksimal 100 file tes');
    const node=findNodeExecutable();let failed=0;
    for(const file of files){
      console.log('\n▶ '+path.basename(file));
      const result=spawnSync(node,[__filename,'test',file],{cwd:dir,encoding:'utf8',timeout:30000,windowsHide:true,shell:false,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'}});
      if(result.stdout)process.stdout.write(result.stdout);
      if(result.stderr)process.stderr.write(result.stderr);
      if(result.error||result.status!==0){failed++;if(result.error)console.error(result.error.message)}
    }
    console.log(`\n${files.length-failed}/${files.length} file tes berhasil`);
    return failed?1:0;
  }

  const entry = path.resolve(input);
  const base = path.dirname(entry);
  const entryName = path.basename(entry);

  if (!entryName.endsWith('.aks')) {
    throw new Error(
      'File masukan harus berekstensi .aks'
    );
  }

  if (!fs.existsSync(entry)) {
    throw new Error(
      'File tidak ditemukan: ' + entry
    );
  }

  if (mode === 'tokens') {
    const source = fs.readFileSync(entry, 'utf8');

    console.log(
      JSON.stringify(A.lex(source), null, 2)
    );

    return 0;
  }

  if (mode === 'fmt') {
    const original = fs.readFileSync(entry, 'utf8');

    A.parse(original);

    const formatted = Formatter.format(original);

    if (process.argv.includes('--write')) {
      fs.writeFileSync(entry, formatted);

      console.log(
        '✓ Format tersimpan:',
        entry
      );
    } else {
      process.stdout.write(formatted);
    }

    return 0;
  }

  const files = Object.create(null);
  const visiting = new Set();

  function load(name) {
    if (Object.hasOwn(files, name)) {
      return;
    }

    if (visiting.has(name)) {
      return;
    }

    visiting.add(name);

    const abs = path.resolve(base, name);

    if (
      !abs.startsWith(base + path.sep) &&
      abs !== base
    ) {
      throw new Error(
        'Lokasi modul di luar folder proyek'
      );
    }

    if (!fs.existsSync(abs)) {
      throw new Error(
        'Modul tidak ditemukan: ' + name
      );
    }

    const data = fs.readFileSync(abs, 'utf8');

    if (data.length > 100000) {
      throw new Error(
        'Ukuran modul melebihi 100 KB: ' + name
      );
    }

    files[name] = data;

    // Let compileProject report parser failures as structured, helpful diagnostics.
    // Dependency discovery can safely stop for a malformed source file.
    let ast = [];
    try { ast = A.parse(data); } catch (_parseError) { /* reported during compilation */ }

    for (const node of ast) {
      if (node.type === 'import') {
        load(node.from + '.aks');
      }
    }

    visiting.delete(name);

    if (Object.keys(files).length > 40) {
      throw new Error(
        'Maksimum 40 berkas'
      );
    }
  }

  load(entryName);

  const result = A.compileProject(
    files,
    entryName,
    {
      strict: process.argv.includes('--ketat')
    }
  );

  if (result.diagnostics.length) {
    for (const diag of result.diagnostics) {
      const filename = diag.file || entryName;

      console.error(
        `${filename}:${diag.line} ` +
        `${diag.severity}${diag.code?` [${diag.code}]`:""}: ${diag.message}`
      );

      const sourceLine = files[filename]
        ?.split(/\r?\n/)
        [(diag.line || 1) - 1];

      if (diag.suggestion) console.error('  Saran: ' + diag.suggestion);
      if (sourceLine) {
        console.error(
          '  ' +
          String(diag.line || 1).padStart(3) +
          ' | ' +
          sourceLine.trimEnd()
        );
      }
    }
  }

  if (!result.javascript) {
    return 1;
  }

  if (mode === 'ast') {
    console.log(
      JSON.stringify(result.modules, null, 2)
    );

    return 0;
  }

  if (mode === 'check') {
    console.log(
      `✓ Aksara ${A.version}: ` +
      `${result.stats.modules} modul, ` +
      `${result.stats.statements} instruksi, ` +
      `${result.diagnostics.filter(
        d => d.severity === 'warning'
      ).length} peringatan, 0 kesalahan`
    );

    return 0;
  }

  if (mode === 'build') {
    const target = path.resolve(
      out || entry.replace(/\.aks$/i, '.js')
    );
    const resolved=file=>fs.existsSync(file)?fs.realpathSync(file):path.resolve(file);
    const sources=new Set(Object.keys(files).map(name=>resolved(path.join(base,name))));
    if(sources.has(resolved(target))||sources.has(resolved(target+'.map')))throw Error('Hasil build tidak boleh menimpa berkas sumber .aks');

    const javascript =
      result.javascript +
      '\n//# sourceMappingURL=' +
      path.basename(target) +
      '.map\n';

    fs.writeFileSync(
      target,
      javascript,
      'utf8'
    );

    const map = {
      ...result.sourceMap,
      file: path.basename(target)
    };

    fs.writeFileSync(
      target + '.map',
      JSON.stringify(map, null, 2),
      'utf8'
    );

    console.log(
      '✓ JavaScript tersimpan:',
      target
    );

    console.log(
      '✓ Source map:',
      target + '.map'
    );

    return 0;
  }

  const status = runCompiledJavaScript(
    result.javascript,
    base
  );

  if (mode === 'test') {
    console.log(
      status === 0
        ? '✓ Semua pengujian lulus'
        : '✗ Pengujian gagal'
    );
  }

  return status;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(
    'Aksara CLI:',
    error.message
  );

  process.exitCode = 1;
}
