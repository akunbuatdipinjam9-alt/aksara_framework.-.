## 7.0.0-beta.1 — Aksara 7: Language & Developer Platform Update

- **Sintaks `uji "nama" ... selesai`** untuk tes native, isolasi kegagalan per blok, laporan hasil, dan exit code gagal.
- **CLI `test <folder>`** menemukan file `*.test.aks`, menjalankan tiap file secara terpisah, dan melaporkan hasil agregat.
- **Project templates** `node cli.js init proyek --template dasar|api|data|uji`.
- **File API asinkron** `baca_file`, `simpan_file`, `daftar_file` dengan pembatasan lokasi folder proyek, symlink, dan ukuran file.
- **HTTP Client 3.0** `ambil_api`, `kirim_api` dengan metode, header, timeout, respons terstruktur, dan batas 1 MB.
- **Async task pool** `kerjakan_paralel(daftar, fungsi, batas)` untuk konkurensi terbatas (1–16), urutan hasil tetap.
- **Data toolkit** `kelompokkan` dan `frekuensi`, plus `baca_env` untuk konfigurasi.
- **Studio**: contoh v7, tombol Uji, autocomplete fitur baru; Electron runner menambah tombol Test.
- **Kompatibilitas**: sintaks dan API v6.4/v6.5 dipertahankan, `*.test.aks` diterima compiler.
- **Status**: beta. Pengujian CLI/runtime Node.js di Linux; GUI Electron/installer Windows belum diverifikasi.

## 6.5.0 — Smart Import, Built-in JSON & Async Engine 2.0

- `gunakan python "random"` dengan alias otomatis; pemanggilan fungsi melalui `tunggu random.randint(1,100)` memakai proses Python non-blocking.
- `gunakan javascript "node:os" sebagai os` memuat modul JS secara otomatis.
- `baca_file_json` dan `simpan_file_json`: operasi file JSON asinkron, path relatif ke proyek, batas ukuran 1 MB.
- `python_panggil_async`: proses Python asinkron, batas waktu, pembatasan output, dan pesan error.
- `bersamaan` alias dari `serentak` untuk menjalankan daftar Promise bersamaan.
- Sintaks v6.4 tetap didukung, dan `baca_json` lama tetap mem-parse string JSON (bukan membaca file).
- 23 tes fitur baru, serta seluruh rangkaian `npm test` berhasil di Node.js 22 Linux. GUI Electron Windows belum diuji.

## 6.1.0 — Database, Security & Web Framework 2.0

- SQLite native melalui node:sqlite dengan prepared statement, CRUD, transaksi, cek path/symlink, serta hasil query.
- HTTP Server dengan CORS allowlist, rate limit, request body limit, timeout dan security headers.
- Web Framework 2.0 dengan props komponen, reactive state, CSS media query, dan router hash dengan parameter.
- Contoh secure-api-v61, sqlite-v61, dan web-framework-v61; pengujian regresi dan fullstack end-to-end.

## v5.2.0 — Development Preview

- Numeric web inputs, validated numeric input access, programmatic field updates.
- Calculator sample and runtime/DOM regression test.
- Existing compiler, CLI, and Electron workspace preserved.
- Linux Node.js regression suite passes; Windows EXE not verified.

# Changelog Aksara

## 5.2.0 — Native Workspace & Desktop Tooling

- Electron IPC untuk membuka dan membuat proyek, membaca, menyimpan dan menghapus modul `.aks` pada disk.
- Explorer folder sederhana dan indikator file belum disimpan.
- Task runner Node.js dengan output streaming, pembatasan jenis perintah, penghentian proses, serta timeout.
- Fitur cari/ganti editor dan Ctrl+P untuk pindah modul.
- Menu shortcut desktop yang baru dan jendela dokumentasi terpisah.
- Pemeriksaan filesystem untuk mencegah path traversal dan akses symlink via API proyek.
- Mempertahankan interpreter/compiler, type checker, package manager v3.5, serta build script Windows.

## 3.5.0 — Package Ecosystem

- Pengelolaan paket berbasis npm dan dukungan `modul_js()` di runtime Node.js.

## 3.2.0 — SDK

- CLI global, diagnosis `doctor`, generator proyek, dan build JavaScript.

## 2.5.0 — Compiler Overhaul

- Token berposisi, pemeriksaan tipe dasar, mode ketat, dan tab lexer Tokens.
