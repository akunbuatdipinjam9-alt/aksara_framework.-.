# 🇮🇩 Aksara — Ngoding Nggak Harus Ribet.

**Bahasa pemrograman berbahasa Indonesia. Sintaks simpel, kemampuan serius.**

Pernah nggak sih lu pengen bikin program sederhana, tapi malah pusing sama kurung kurawal, titik koma, dan aturan sintaks yang seabrek?

Nah, kenalin **Aksara**. 🚀

Aksara adalah proyek bahasa pemrograman yang dirancang supaya orang bisa fokus ke **logika program**, bukan sibuk menghafal simbol.

Mau belajar coding dari nol? Boleh.

Mau eksperimen bikin aplikasi? Gas.

Mau ngoding pakai bahasa Indonesia? **Nah, ini tempatnya.** 🇮🇩

## 🚀 Aksara 7.0 Beta — Update Besar!

**Aksara bukan cuma bahasa yang lebih pendek; sekarang punya workflow testing, file API, HTTP client, dan paralel terkontrol.**

```aksara
uji "matematika"
    pastikan(2 + 2 == 4, "Salah hitung")
selesai
```

```aksara
fungsi asinkron kuadrat(n)
    kembalikan n * n
selesai
hasil = tunggu kerjakan_paralel([1,2,3,4], kuadrat, 2)
tampilkan hasil
```

```aksara
tunggu simpan_file("catatan.txt", "Halo dari Aksara 7")
tampilkan tunggu baca_file("catatan.txt")
```

Buat proyek dengan template: `node cli.js init proyek-baru --template api`. Jalankan satu file tes: `node cli.js test contoh.test.aks`, atau satu folder: `node cli.js test tests-aksara`.

**Dokumentasi lengkap:** [`AKSARA-v7.md`](AKSARA-v7.md). Versi ini **beta**, bukan rilis stabil Windows.

## ⚡ Fitur v6.5 yang tetap ada: Smart Import, JSON, dan Async

```aksara
gunakan python "random"
angka = tunggu random.randint(1, 100)
tampilkan "Angka acak: {angka}"
```

```aksara
pengguna = tunggu baca_file_json("data.json")
tampilkan pengguna.nama
```

```aksara
hasil = tunggu bersamaan([jeda(100), jeda(100)])
tampilkan hasil
```

**Penting:** `baca_json("{\"nama\":1}")` tetap untuk *parse teks JSON*; untuk **file** pakai `tunggu baca_file_json("data.json")`. Fungsi file JSON dan Python memerlukan Node.js (bukan browser). Smart Import Python perlu menjalankan `node cli.js paket py:siapkan` di folder proyek.

Detail lengkap ada di [`AKSARA-v6.5.md`](AKSARA-v6.5.md).

## ✨ Kenapa Aksara?

- 🇮🇩 **Bahasa Indonesia** — Perintah seperti `tampilkan` gampang dipahami.
- ⚡ **Sintaks simpel** — Nggak perlu deklarasi panjang untuk variabel biasa.
- 🧠 **Error yang manusiawi** — Salah ketik? Aksara berusaha kasih saran, bukan cuma marah.
- 🐍 **Python Interop** — Bisa terhubung dengan ekosistem Python.
- 🟨 **JavaScript Interop** — Memanfaatkan kemampuan JavaScript dan Node.js.
- 🌐 **Web & HTTP** — Ada dukungan pengembangan aplikasi web.
- 🗄️ **SQLite** — Ada kemampuan database.
- 💻 **Aksara Studio** — IDE desktop berbasis Electron.

> Filosofinya simpel: **Sedikit sintaks, banyak kemampuan.**

---

## 🚀 Halo Dunia!

Biasanya belajar bahasa pemrograman dimulai dari *Hello World*.

Di Aksara:

```aksara
tampilkan "Halo Dunia!"
```

Udah. Serius. 😭

## 📦 Variabel? Santai Aja.

```aksara
nama = "Akhtar"
umur = 14

tampilkan "Halo, {nama}!"
tampilkan "Umur gue {umur} tahun"
```

Output:

```text
Halo, Akhtar!
Umur gue 14 tahun
```

Nggak perlu `const`, `let`, atau `var` buat contoh dasar.

Mau mengubah nilai variabel?

```aksara
level = 1

level = level + 1

tampilkan "Sekarang level {level}"
```

Output:

```text
Sekarang level 2
```

**Catatan:** Gaya deklarasi lama juga masih didukung.

```aksara
ingat nama sebagai "Dunia"
tampilkan "Halo, " + nama
```

Jadi kode lama lu nggak harus langsung ditulis ulang.

---

## 🐍 Integrasi Python

Aksara nggak harus mengerjakan semuanya sendirian.

Contohnya, memanggil fungsi dari modul Python:

```aksara
gunakan python

ingat angka sebagai python_panggil("random", "randint", [1, 100])

tampilkan angka
```

Program ini menggunakan Python untuk menghasilkan angka acak.

Artinya, Aksara bisa jadi bahasa yang mudah dipelajari, sambil tetap memanfaatkan ekosistem yang lebih besar.

## 🧯 Salah Ketik? Nggak Usah Panik.

Misalnya lu nulis:

```aksara
nama = "Akhtar"
tampikan nama
```

Ups. Kurang huruf `l`.

Di Aksara v6.4, sistem diagnostik dirancang untuk membantu mengenali kesalahan seperti ini dan menyarankan `tampilkan`.

Tujuannya bukan cuma kasih tahu bahwa kode lu salah, tapi juga membantu lu memahami **cara memperbaikinya**.

Karena orang belajar coding itu butuh penjelasan, bukan trauma sama terminal. 😭

---

## 🛠️ Cara Menjalankan Aksara

Pastikan **Node.js** sudah terpasang. Untuk fitur Python, lu juga perlu instalasi Python yang sesuai.

Clone repository:

```bash
git clone <URL-REPOSITORY-AKSARA>
cd <FOLDER-AKSARA>
```

Ganti placeholder di atas dengan URL repository dan nama folder proyek yang sebenarnya.

Instal dependensi:

```bash
npm install
```

Cek lingkungan:

```bash
node cli.js doctor
```

Jalankan program Aksara:

```bash
node cli.js run contoh.aks
```

Contoh `contoh.aks`:

```aksara
nama = "Dunia"
tampilkan "Halo, {nama}!"
```

Mau coba contoh bawaan v6.4?

```bash
node cli.js run examples/simplicity-v64.aks
```

Jalankan pengujian:

```bash
npm test
```

---

## 🧩 Aksara Itu Sebenarnya Apa?

Aksara bukan cuma JavaScript yang kata-katanya diterjemahkan ke bahasa Indonesia.

Proyek ini memiliki beberapa komponen pengembangan bahasa:

| Komponen | Tugas |
|---|---|
| Lexer | Membaca dan memecah kode |
| Compiler | Mengubah kode Aksara menjadi program yang bisa dijalankan |
| Semantic Analyzer | Memeriksa aturan dan makna kode |
| Runtime | Menyediakan kemampuan saat program berjalan |
| CLI | Menjalankan perintah lewat terminal |
| Aksara Studio | Tempat menulis dan menguji kode |
| Diagnostics | Membantu menjelaskan kesalahan |

Di balik sintaks yang sederhana, tetap ada sistem yang bekerja.

**Lu nulis sedikit. Compiler yang kerja keras.** 🗿

## 🆕 Apa yang Baru di v6.4?

### Simplicity Update

Fokus update ini cuma dua, tapi dampaknya lumayan besar.

**1. Sintaks makin ringkas**

```aksara
nama = "Akhtar"
tampilkan "Halo, {nama}!"
```

**2. Error makin ramah**

Kesalahan yang bisa dikenali diberi penjelasan dan saran perbaikan yang lebih berguna.

Update ini juga mempertahankan kompatibilitas dengan sintaks lama yang didukung.

## 🗺️ Rencana ke Depan

Aksara masih dalam pengembangan. Beberapa hal yang ingin terus ditingkatkan:

- Penyederhanaan sintaks tanpa bikin bahasa jadi ambigu.
- Pesan error yang makin jelas.
- Autocomplete dan bantuan editor yang lebih pintar.
- Performa runtime dan integrasi Python.
- Stabilitas aplikasi desktop dan installer.
- Dokumentasi dan contoh proyek untuk pemula.

**Fitur yang direncanakan belum tentu tersedia pada versi sekarang.**

## ⚠️ Status Proyek

Aksara masih aktif dikembangkan.

Beberapa bagian sudah memiliki pengujian otomatis, tetapi itu bukan jaminan seluruh fitur bebas bug. Kompatibilitas sistem operasi, installer, dan integrasi eksternal tetap perlu diuji pada lingkungan pengguna.

Kalau menemukan bug, laporkan dengan menyertakan kode contoh, pesan error, dan langkah untuk mengulanginya.

---

## ❤️ Dibuat untuk Siapa?

Buat pelajar yang baru kenal coding.

Buat orang yang pengen belajar pemrograman pakai bahasa Indonesia.

Buat developer yang suka bereksperimen dengan desain bahasa.

Dan buat siapa pun yang pernah mikir:

**"Kenapa bikin program sederhana harus seribet ini, sih?"**

---

### 🇮🇩 Aksara

**Ngoding pakai logika, bukan hafalan.**

*Made in Indonesia. Built with curiosity. Powered by code.*

**Selamat datang di era Aksara yang lebih simpel.** 🚀
