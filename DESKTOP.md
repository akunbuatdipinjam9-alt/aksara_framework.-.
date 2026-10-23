# Aksara Studio Desktop 6.3

## Mulai di Windows

1. Ekstrak ZIP sampai terlihat `BUILD-WINDOWS.cmd` dan `package.json`.
2. Pasang **Node.js 22.13 atau lebih baru** dan pastikan `npm` tersedia.
3. Untuk langsung membuka aplikasi dari source, **klik dua kali `JALANKAN-AKSARA.cmd`** (menginstal dependency bila perlu).
4. Untuk membuat installer serta EXE portable, **klik dua kali `BUILD-WINDOWS.cmd`**. Build membutuhkan jaringan saat instalasi Electron dan electron-builder.
5. Temukan hasil build di folder `release/` jika berhasil. **Jalankan `Aksara Studio*.exe` dari hasil packaging, bukan `node_modules\electron\dist\electron.exe`**. File `electron.exe` tersebut adalah executable mesin Electron saja, sehingga tanpa argumen proyek menampilkan welcome screen.

Menjalankan langsung dari source:

```powershell
npm install
npm run desktop
```

Membangun secara manual:

```powershell
npm run pack:win
```

**ZIP ini berisi source code, tidak menyertakan installer EXE siap jalankan.**

## Menggunakan workspace

1. Klik **＋ Proyek Baru** lalu pilih folder **kosong**, atau klik **▣ Buka Folder** dan pilih proyek Aksara yang memiliki `program.aks`.
2. Pilih file pada explorer sebelah kiri. File baru bisa dibuat menggunakan **+ Berkas**.
3. Setelah edit, gunakan **Ctrl+S** untuk menyimpan berkas aktif atau **Ctrl+Shift+S** untuk menyimpan seluruh berkas.
4. Klik **▶ Run CLI** (F5), **✓ Check** (F7), atau **⚙ Build JS** (F8). Hasil ditampilkan di Terminal. Perintah task menyimpan semua berkas terlebih dahulu.
5. Keluaran Build JavaScript dibuat melalui CLI di folder proyek (misalnya `program.js` dan `program.js.map`).
6. Gunakan **Ctrl+P** untuk membuka modul dengan cepat dan **Ctrl+F** untuk mencari/mengganti teks.

Tombol **▶ Jalankan** pada toolbar atas tetap untuk *preview browser*; **▶ Run CLI** untuk menjalankan program Node.js dalam folder proyek.

Tombol **Debug** memasang breakpoint pada instruksi terdekat dari kursor dan membuka DevTools pada desktop. Run CLI terus berjalan sampai program selesai atau tombol Stop ditekan; server dan AI lokal tidak lagi terpotong timeout 15/25 detik. Batas instruksi per giliran event loop tetap berlaku. Lihat [hasil debugging dan pengujian](DEBUGGING-STABILITAS.md) untuk rincian.

## npm 12: Electron terpasang tetapi binary tidak ada

npm 12 dapat menahan script `postinstall` Electron. File `package.json` mengizinkan `electron@33.4.11` secara khusus. Script build mencoba mengizinkan dan mengulang pemasangannya. Jika masih tertahan:

```powershell
npm install-scripts approve electron
npm rebuild electron
```

Lalu ulangi `BUILD-WINDOWS.cmd`. Hindari `npm audit fix --force` karena bisa mengganti versi dependency secara tak terduga.

## Keamanan dan batasan

- Renderer Electron memakai `nodeIntegration:false`, `contextIsolation:true`, `sandbox:true`. IPC hanya mengekspos operasi yang dibutuhkan.
- Akses workspace dibatasi ke file `.aks` pada folder proyek terbuka; symlink ditolak.
- **Task Run mengeksekusi program dari folder proyek sebagai proses Node.js.** Jangan jalankan proyek dari sumber tidak dipercaya; compiler/CLI bukan sandbox untuk kode berbahaya.
- Belum ada terminal shell bebas, debug breakpoint step-by-step, recursive folder explorer, atau native machine-code compilation.
- Windows installer belum diuji secara end-to-end pada sistem Windows oleh lingkungan ini.
