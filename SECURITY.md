# 🔐 Kebijakan Keamanan Aksara

Terima kasih sudah membantu menjaga Aksara tetap aman. Aksara mencakup compiler, runtime, CLI, Aksara Studio (Electron), integrasi JavaScript/Python, serta fitur web dan database. Laporan keamanan yang jelas sangat membantu proyek ini berkembang.

## Versi yang didukung

Perbaikan keamanan diprioritaskan untuk **versi rilis terbaru** yang masih dipelihara. Versi lama dan build eksperimental mungkin tidak mendapatkan patch. Belum ada jaminan waktu respons atau jadwal patch tertentu.

## Cara melaporkan kerentanan

**Jangan publikasikan detail eksploitasi, kredensial, atau data sensitif melalui GitHub Issues/Discussions.**

1. Buka tab **Security** di repository Aksara.
2. Jika tersedia, pilih **Report a vulnerability** untuk mengirim laporan privat melalui GitHub Private Vulnerability Reporting.
3. Jika fitur tersebut belum diaktifkan, hubungi maintainer lewat kanal kontak privat yang dicantumkan pada profil/repository. Jika tidak ada kanal privat, buat issue **tanpa detail teknis sensitif** untuk meminta kanal pelaporan yang aman.

> **Untuk maintainer:** Aktifkan *Private Vulnerability Reporting* di pengaturan repository dan tambahkan metode kontak privat yang benar-benar dipantau. Jangan mencantumkan alamat email yang tidak aktif.

## Isi laporan yang membantu

- Ringkasan masalah dan dampak yang mungkin terjadi.
- Versi Aksara, OS, versi Node.js, dan (jika relevan) Python.
- Langkah reproduksi minimum yang aman.
- Perilaku yang diharapkan vs. perilaku sebenarnya.
- Bukti teknis seperlunya, tanpa menyertakan token, password, atau data orang lain.
- Saran perbaikan, jika ada.

## Ruang lingkup

Contoh area yang relevan: eksekusi kode tidak semestinya, pembatasan akses file/jaringan, keamanan HTTP server, pengelolaan proses, pemrosesan input, Python/JavaScript bridge, dan keamanan integrasi Electron.

Menjalankan **kode Aksara yang tidak dipercaya** dapat membawa risiko, terutama jika kode tersebut memiliki akses ke file, jaringan, atau paket eksternal. Jangan menjalankan proyek asing tanpa meninjau sumber dan izin yang dibutuhkan.

## Pengungkapan yang bertanggung jawab

Beri maintainer kesempatan untuk memeriksa dan memperbaiki masalah sebelum detail kerentanan dipublikasikan. Pengujian harus dilakukan hanya pada sistem dan data milik sendiri atau yang memang mengizinkan pengujian. Jangan mengakses data pengguna lain, mengganggu layanan, atau melakukan pengujian destruktif.

Terima kasih sudah bantu bikin Aksara lebih aman. 🇮🇩
