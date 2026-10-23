@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
title Aksara Studio - Build Windows
color 0B
cls

echo ========================================================
echo             AKSARA STUDIO 6.3 - BUILD WINDOWS .EXE
echo ========================================================
echo.
echo Lokasi proyek:
echo %CD%
echo.

if /I not "%OS%"=="Windows_NT" (
  echo [ERROR] Script ini hanya untuk Windows.
  goto :fail
)

if not exist "package.json" (
  echo [ERROR] package.json tidak ditemukan.
  echo Taruh BUILD-WINDOWS.cmd di folder utama Aksara Studio.
  goto :fail
)

if not exist "electron\main.cjs" (
  echo [ERROR] electron\main.cjs tidak ditemukan.
  echo Pastikan seluruh isi ZIP sudah diekstrak.
  goto :fail
)

if not exist "electron\preload.cjs" (
  echo [ERROR] electron\preload.cjs tidak ditemukan.
  goto :fail
)

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js tidak ditemukan di PATH.
  echo Pasang Node.js LTS dari https://nodejs.org/ lalu coba lagi.
  goto :fail
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm tidak ditemukan di PATH.
  echo Pastikan instalasi Node.js sudah lengkap.
  goto :fail
)

node -e "process.exit((() => { const [major, minor] = process.versions.node.split('.').map(Number); return major > 22 || (major === 22 && minor >= 13); })() ? 0 : 1)"
if errorlevel 1 (
  echo [ERROR] Minimal Node.js versi 22.13 diperlukan.
  node --version
  goto :fail
)

echo [OK] Node.js:
node --version
echo [OK] npm:
call npm --version
if errorlevel 1 goto :fail
echo.

echo [1/5] Menyiapkan dependency Electron...
if exist "node_modules\electron\dist\electron.exe" if exist "node_modules\.bin\electron-builder.cmd" goto :deps_ready

echo [INFO] Menjalankan npm install. Diperlukan koneksi internet.
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo.
  echo [ERROR] npm install gagal. Periksa koneksi internet atau pesan error.
  echo Coba jalankan npm install secara manual untuk melihat detailnya.
  goto :fail
)

:deps_ready
if not exist "node_modules\electron\dist\electron.exe" (
  echo [INFO] Binary Electron belum tersedia. Memeriksa izin install script...
  rem npm 12 memblokir postinstall yang belum disetujui.
  rem Setujui paket electron SAJA, bukan semua dependency.
  call npm install-scripts approve electron >nul 2>&1
  if errorlevel 1 (
    echo [INFO] Perintah approve tidak tersedia atau gagal.
    echo [INFO] Menggunakan izin dari package.json jika didukung npm.
  ) else (
    echo [OK] Izin postinstall Electron diperiksa.
  )
  echo [INFO] Menjalankan ulang postinstall Electron...
  call npm rebuild electron
  if errorlevel 1 (
    echo [ERROR] npm rebuild electron gagal.
    goto :electron_fail
  )
)
if not exist "node_modules\electron\dist\electron.exe" (
  echo [ERROR] Binary Electron belum tersedia setelah rebuild.
  goto :electron_fail
)
if not exist "node_modules\.bin\electron-builder.cmd" (
  echo [ERROR] electron-builder belum terpasang.
  goto :fail
)
echo [OK] Dependency lengkap.
echo.

echo [2/5] Memeriksa syntax JavaScript...
node --check "electron\main.cjs"
if errorlevel 1 goto :fail
node --check "electron\preload.cjs"
if errorlevel 1 goto :fail
node --check "electron\workspace.cjs"
if errorlevel 1 goto :fail
node --check "electron\task-runner.cjs"
if errorlevel 1 goto :fail
node --check "electron\desktop-ui.js"
if errorlevel 1 goto :fail
node --check "cli.js"
if errorlevel 1 goto :fail
echo [OK] Pemeriksaan syntax lolos.
echo.

echo [3/5] Menguji compiler Aksara...
call npm test
if errorlevel 1 (
  echo [ERROR] Test compiler gagal. Build dibatalkan.
  goto :fail
)
echo [OK] Test compiler berhasil.
echo.

echo [4/5] Menguji integrasi Electron...
call npm run test:desktop
if errorlevel 1 (
  echo [ERROR] Test integrasi Electron gagal. Build dibatalkan.
  goto :fail
)
echo [OK] Test integrasi berhasil.
echo.

echo [5/5] Membuat installer dan portable EXE...
call npm run pack:win
if errorlevel 1 (
  echo.
  echo [ERROR] Proses packaging gagal.
  echo Jika muncul error symbolic link, aktifkan Windows Developer Mode.
  echo Jika error download, periksa jaringan lalu coba lagi.
  goto :fail
)

if not exist "release" (
  echo [ERROR] Build selesai tetapi folder release belum ditemukan.
  goto :fail
)

echo.
echo ========================================================
echo                       BUILD BERHASIL
echo ========================================================
echo.
echo Installer dan versi portable Aksara Studio tersedia di:
echo   %CD%\release\
echo.
for %%F in ("release\*.exe") do if exist "%%~fF" echo   %%~nxF
echo.
echo [PENTING] Buka EXE Aksara Studio dari release, BUKAN:
echo   node_modules\electron\dist\electron.exe
echo.
start "" explorer "%CD%\release"
echo.
echo Tutup jendela ini setelah selesai.
pause
exit /b 0

:electron_fail
echo.
echo [PETUNJUK] Untuk npm 12, jalankan manual:
echo     npm install-scripts approve electron
echo     npm rebuild electron
echo.
echo Jika download Electron gagal, periksa koneksi, proxy, dan antivirus.
echo.
goto :fail

:fail
echo.
echo ========================================================
echo                       BUILD GAGAL
echo ========================================================
echo.
echo Salin pesan error terakhir jika perlu diperiksa.
echo Jangan jalankan npm audit fix --force untuk memperbaiki build.
echo.
pause
exit /b 1
