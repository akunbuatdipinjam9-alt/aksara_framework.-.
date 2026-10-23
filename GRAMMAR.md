# Aksara 2.5 — Spesifikasi Grammar (eksperimental)

Aksara adalah bahasa dengan kata kunci Bahasa Indonesia **terstruktur**, bukan bahasa natural bebas. Ini ringkasan grammar implementasi v2.5; seluruh aturan parser masih dianggap eksperimental.

## Lexical rules

- Identifier: huruf Unicode atau `_`, diikuti huruf, angka atau `_`.
- Literal: angka desimal, string kutip tunggal/ganda, `benar`, `salah`, `kosong`.
- Komentar baris dimulai dari `#` di luar string.
- Token mencatat `line`, `column`, `start`, `end`. Lihat `node cli.js tokens ...`.
- Spasi antar-instruksi dan indentasi untuk keterbacaan; **blok berakhir dengan `selesai`**, bukan berdasarkan indentasi.
- List, objek, dan ekspresi berkumpulan dapat dibuat multiline; string multiline tidak didukung.

## Grammar ringkas (EBNF informal)

```text
program        ::= statement*
block          ::= statement* "selesai"
identifier     ::= unicode_letter (unicode_letter | digit | "_")*
type           ::= "angka" | "teks" | "logika" | "daftar" | "kamus" | "kosong" | "bebas"
declaration    ::= ("ingat" | "tetap") identifier [":" type] "sebagai" expression
assignment     ::= target "=" expression | "ubah" target "menjadi" expression
print          ::= "tampilkan" expression
condition      ::= "jika" expression "maka" statement*
                   ("atau jika" expression "maka" statement*)*
                   ["jika tidak" statement*] "selesai"
selection      ::= "pilih" expression ("kasus" expression statement*)+
                   ["lainnya" statement*] "selesai"
function       ::= ["asinkron"] "fungsi" identifier "(" arguments ")" statement* "selesai"
class          ::= "kelas" identifier ["mewarisi" identifier] method* "selesai"
foreach        ::= "untuk setiap" identifier "dalam" expression statement* "selesai"
range          ::= "untuk" identifier "dari" expression "sampai" expression
                   ["langkah" expression] statement* "selesai"
while          ::= "selama" expression "maka" statement* "selesai"
repeat         ::= "ulangi" expression "kali" statement* "selesai"
```

Operator ekspresi utama: `+ - * / // % **`, `== != > < >= <=`, `dan`, `atau`, `tidak`, `dalam`, `??`, serta alternatif natural `lebih dari`, `kurang dari`, `sama dengan`, `minimal`, `maksimal`.

## Tipe opsional (gradual)

```aks
ingat usia: angka sebagai 14
usia = 15                  # valid
usia = "lima belas"       # error statis (nilai bertipe teks)
ingat lain sebagai "bebas" # tanpa anotasi, tipe dapat berubah
```

Jenis `bebas` menonaktifkan constraint untuk variabel tersebut. Analisis hanya mengevaluasi tipe yang dapat diketahui secara statis; return type fungsi, properti objek dinamis, hasil API, dan banyak interaksi library masih dianggap `bebas`.

## Pemeriksaan ketat

`node cli.js check file.aks --ketat` atau centang **Ketat** di IDE. Mode ini melaporkan nama yang tidak dapat ditemukan pada cakupan variabel, termasuk nama yang belum dideklarasikan. Mode ketat **tidak** menggantikan pemeriksa tipe lengkap dan belum mendukung semua tipe generik.

## Kompilasi & runtime

`lexer.js → compiler.js (parser AST + validasi) → semantic.js (opsional) → JavaScript ES2020+ → runtime.js`.

Kompilasi biasa: `node cli.js build examples/typed.aks hasil.js`. Source map `.js.map` pada tahap ini adalah pemetaan parsial berbasis instruksi, bukan debugging multi-level yang akurat untuk setiap ekspresi.

## Tambahan v6.5

```aksara
gunakan python "random"                     # Alias default: random
gunakan python "statistics" sebagai statistik
gunakan javascript "node:os" sebagai os

angka = tunggu random.randint(1, 100)
isi = tunggu baca_file_json("data.json")
tunggu simpan_file_json("hasil.json", isi)
tunggu bersamaan([jeda(100), jeda(100)])
```

Smart Import hanya di tingkat modul. Python dan file JSON berjalan asinkron; gunakan `tunggu` di program utama atau fungsi asinkron. Sintaks `baca_json("{...}")` tetap mengurai teks JSON, tidak membaca file.
