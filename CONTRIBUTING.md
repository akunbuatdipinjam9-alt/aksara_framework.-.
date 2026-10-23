# 🚀 Berkontribusi ke Aksara

Punya ide bikin Aksara lebih simpel? Nemu bug? Mau bantu dokumentasi? **Gas, kontribusi lu diterima!** 🇮🇩

Aksara adalah proyek bahasa pemrograman berbahasa Indonesia dengan compiler, runtime, CLI, dan Aksara Studio. Kontribusi kecil seperti memperjelas pesan error juga berharga.

## Sebelum mulai

1. Cek **Issues** dan **Pull Requests** supaya pekerjaan tidak dobel.
2. Untuk perubahan besar pada sintaks, compiler, atau runtime, diskusikan rancangan lebih dulu melalui Issue.
3. Baca [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) dan [SECURITY.md](SECURITY.md).
4. Jika menemukan kerentanan, **jangan** buat Issue publik berisi detail eksploitasi. Ikuti `SECURITY.md`.

## Menyiapkan proyek

Gunakan **Node.js 22.13.0 atau lebih baru**. Python diperlukan hanya untuk fitur yang memakai Python bridge. Perintah berikut dijalankan dari direktori proyek yang berisi `package.json` dan `cli.js`.

```bash
npm ci
node cli.js doctor
npm test
```

Jalankan contoh sintaks sederhana:

```bash
node cli.js run examples/simplicity-v64.aks
```

Untuk mencoba Aksara Studio (lingkungan desktop dengan dependensi yang sesuai):

```bash
npm run desktop
```

Tes UI tambahan tersedia melalui script seperti `npm run test:browser` dan `npm run test:desktop-ui`; beberapa membutuhkan lingkungan browser/desktop yang mendukung.

## Alur kontribusi

1. **Fork** repository, lalu clone fork milikmu.
2. Buat branch dengan nama jelas, misalnya `fix/error-typo` atau `feat/string-interpolation`.
3. Buat perubahan yang terfokus; hindari mencampur fitur besar dengan perapian tak terkait.
4. Tambahkan atau perbarui tes dan contoh bila perilaku program berubah.
5. Jalankan tes yang relevan, lalu buat **Pull Request** dengan penjelasan singkat.

Contoh:

```bash
git checkout -b fix/error-typo
# Ubah kode dan tambahkan tes
git add .
git commit -m "fix: improve unknown-command diagnostics"
git push -u origin fix/error-typo
```

## Panduan perubahan kode

- **Utamakan kemudahan pemula.** Sintaks baru harus mudah dibaca dan tidak ambigu.
- **Jaga kompatibilitas.** Jangan merusak program Aksara lama tanpa alasan kuat dan rencana migrasi.
- **Error harus membantu.** Jelaskan lokasi, penyebab, dan saran perbaikan yang relevan bila memungkinkan.
- **Tes itu penting.** Untuk perubahan lexer/compiler/semantic/runtime, tambahkan tes regresi agar bug lama tidak muncul lagi.
- **Perhatikan keamanan.** Jangan memperluas akses file, proses, jaringan, atau Python bridge tanpa memikirkan izin dan validasi input.
- **Dokumentasikan fitur.** Tambahkan contoh `.aks` yang benar-benar bisa dijalankan.
- Jangan menyertakan password, API key, file pribadi, `node_modules`, atau hasil build besar yang tidak diperlukan.

## Format Pull Request

Sertakan:

- **Apa yang berubah?** Ringkasan singkat.
- **Kenapa perlu?** Masalah atau tujuan perubahan.
- **Cara menguji?** Perintah dan hasil tes yang dijalankan.
- **Kompatibilitas:** Apakah sintaks lama tetap bekerja?
- **Screenshot:** Bila ada perubahan tampilan Aksara Studio.

Contoh judul PR: `fix: suggest tampilkan when user types tampikan`.

## Kontribusi non-kode juga boleh

Bantu memperbaiki typo dokumentasi, menambah contoh pembelajaran, melaporkan bug yang bisa direproduksi, atau menyarankan pesan error yang lebih mudah dipahami.

**Aksara dibuat supaya coding nggak ribet. Kontribusinya juga nggak harus ribet.** 🔥
