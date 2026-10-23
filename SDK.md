# Aksara SDK 3.2

Aksara 3.2 merupakan rilis developer experience yang membangun di atas compiler v2.5. Membutuhkan Node.js 18+.

## Instalasi CLI global

Dari folder proyek hasil ekstraksi:

```sh
npm install -g .
aksara versi
aksara doctor
aksara buat demo
cd demo
aksara jalankan program.aks
aksara periksa program.aks --ketat
aksara bangun program.aks hasil.js
node hasil.js
```

Alternatif tanpa instalasi global: `node cli.js <perintah>` dari folder SDK.

## Perintah

- `versi`, `doctor`
- `buat` (alias `init`), membuat folder berisi `program.aks`, `aksara.json`, README
- `jalankan` (alias `run`)
- `bangun` (alias `build`), menghasilkan JavaScript dan source map awal
- `periksa` (alias `check`), mendukung `--ketat`
- `rapikan` (alias `fmt`), mendukung `--write`
- `uji` (alias `test`)
- `serve`, `tokens`, `ast`

## Batasan

SDK menggunakan transpiler JavaScript dan runtime Node.js, belum native compiler. `aksara.json` saat ini hanya metadata proyek, bukan package manager atau dependency resolver. Akses npm membutuhkan instalasi dependency melalui npm sendiri. Python bridge belum tersedia.
