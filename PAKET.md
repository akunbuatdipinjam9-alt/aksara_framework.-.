# Aksara 4.0 — Package Ecosystem

Aksara sekarang mendukung manajemen dependency proyek lewat `aksara paket`. Perintah ini memakai **npm**, bukan registry Aksara mandiri.

## Mulai

```powershell
npm install -g .
aksara buat aplikasi-saya
cd aplikasi-saya
aksara paket tambah lodash
aksara paket daftar
aksara jalankan program.aks
```

`program.aks`:

```aks
 gunakan javascript
 ingat lodash sebagai tunggu modul_js("lodash")
 tampilkan lodash.sum([10, 20, 30])
```

Hilangkan indentasi di awal baris saat menyalin ke editor.

## Perintah

- `aksara paket tambah lodash` — instal dan catat paket npm.
- `aksara paket tambah file:./vendor/nama-paket` — instal paket lokal di dalam proyek.
- `aksara paket daftar` — lihat paket dan status pemasangan.
- `aksara paket hapus lodash` — hapus dependency.
- `aksara paket pasang` — pasang semua dependency sesuai `package.json`.

Semua perintah harus dijalankan di folder dengan `aksara.json` (dibuat oleh `aksara buat`). Dependency dicatat di `package.json` dan disalin ke `aksara.json` pada bagian `paket`.

## Keamanan dan kompatibilitas

- Pemasangan paket menggunakan `--ignore-scripts`, jadi *install scripts* pihak ketiga tidak otomatis dijalankan. Sebagian paket native tidak akan berfungsi tanpa setup tambahan.
- Perintah CLI tidak menggunakan shell untuk memasukkan argumen paket.
- `modul_js` hanya tersedia di runtime Node.js CLI; tidak di preview browser.
- `modul_js` mengembalikan ekspor `default` bila tersedia, jika tidak mengembalikan namespace modul. Paket CommonJS dan ESM dapat memiliki bentuk ekspor berbeda.
- **Kode paket pihak ketiga tetap dieksekusi dengan hak akses Node.js.** Hanya gunakan dependency yang tepercaya.
- Proyek belum punya lockfile khusus Aksara. npm dapat menghasilkan `package-lock.json`.
- Python bridge dan registry independen belum ada.
