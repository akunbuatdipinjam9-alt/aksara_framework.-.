@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
title Aksara Studio 6.3 - Jalankan Aplikasi
color 0B
cls

echo ========================================================
echo              AKSARA STUDIO 6.3 - DESKTOP
echo ========================================================
echo.
echo Lokasi: %CD%
echo.

if not exist "package.json" (
  echo [ERROR] package.json tidak ditemukan.
  echo Simpan JALANKAN-AKSARA.cmd di folder proyek Aksara Studio.
  goto :fail
)
if not exist "electron\main.cjs" (
  echo [ERROR] electron\main.cjs tidak ditemukan.
  echo Pastikan ZIP sudah diekstrak dengan lengkap.
  goto :fail
)
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js belum terpasang. Instal Node.js LTS.
  goto :fail
)
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm belum ditemukan di PATH.
  goto :fail
)

node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major > 22 || (major === 22 && minor >= 13) ? 0 : 1)"
if errorlevel 1 (
  echo [ERROR] Minimal Node.js versi 22.13 diperlukan.
  goto :fail
)

if not exist "node_modules\electron\dist\electron.exe" (
  echo [INFO] Electron belum siap. Menjalankan instalasi dependency...
  call npm install --no-audit --no-fund
  if errorlevel 1 goto :install_fail
  if not exist "node_modules\electron\dist\electron.exe" (
    echo [INFO] Memulihkan binary Electron yang terblokir npm 12...
    call npm install-scripts approve electron
    call npm rebuild electron
  )
)
if not exist "node_modules\electron\dist\electron.exe" (
  echo [ERROR] Binary Electron belum tersedia setelah instalasi.
  goto :fail
)

echo [OK] Menjalankan aplikasi Aksara Studio...
echo [INFO] Jangan jalankan node_modules\electron\dist\electron.exe langsung.
echo.
call npm run desktop
if errorlevel 1 (
  echo.
  echo [ERROR] Aplikasi gagal dibuka.
  echo Salin pesan error ini agar bisa diperiksa.
  goto :fail
)
exit /b 0

:install_fail
echo [ERROR] Instalasi npm gagal. Periksa koneksi internet dan pesan error.
:fail
echo.
pause
exit /b 1
