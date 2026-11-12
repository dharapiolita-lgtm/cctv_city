@echo off
chcp 65001 > nul
title WaterWatch - Setup GitHub & Push ke Vercel (dharapiolita-lgtm)

echo ==============================================================================
echo    WATERWATCH V3 — PERSIAPAN GITHUB REPOSITORY UNTUK VERCEL
echo    Akun GitHub  : https://github.com/dharapiolita-lgtm
echo    Pengembang   : Dhara Piolita & Dr. Erliyan Redy Susanto, M.Kom.
echo    Afiliasi     : Pemda & Universitas Teknokrat Indonesia
echo ==============================================================================
echo.

REM 1. Periksa ketersediaan Git CLI
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [PERHATIAN] Git CLI belum terdeteksi di lingkungan PATH Windows Anda.
    echo.
    echo Pilihan:
    echo [1] Instal Git otomatis menggunakan Windows Winget (Ketik Y lalu Enter)
    echo [2] Gunakan VS Code (Ketik V lalu Enter untuk buka VS Code)
    echo [3] Keluar (Ketik N)
    echo.
    set /p CHOICE="Pilihan Anda (Y/V/N): "
    if /i "%CHOICE%"=="Y" (
        echo.
        echo [INFO] Mengunduh dan menginstal Git resmi dari winget...
        winget install --id Git.Git -e --source winget
        echo.
        echo [SELESAI] Git telah berhasil dipasang!
        echo Silakan tutup jendela ini dan jalankan kembali setup_github_and_push.bat.
        pause
        exit /b 0
    ) else if /i "%CHOICE%"=="V" (
        echo [INFO] Membuka VS Code...
        start code .
        echo Di VS Code: Tekan Ctrl+Shift+G lalu klik "Publish to GitHub".
        pause
        exit /b 0
    ) else (
        exit /b 0
    )
)

echo [1/4] Git CLI terdeteksi:
git --version
echo.

REM 2. Konfigurasi identitas Git lokal jika belum ada
git config user.name >nul 2>nul
if %errorlevel% neq 0 (
    git config --global user.name "Dhara Piolita"
    git config --global user.email "dharapiolita@gmail.com"
)

REM 3. Inisialisasi Git Repository lokal jika belum ada
if not exist ".git" (
    echo [2/4] Menginisialisasi Git Repository lokal...
    git init
    git branch -M main
) else (
    echo [2/4] Git repository lokal sudah aktif.
)

REM 4. Tambahkan file dan buat commit awal
echo [3/4] Menambahkan seluruh file proyek WaterWatch V3...
git add .
echo.
git commit -m "feat: WaterWatch V3 Full-Stack CCTV Analitik Keamanan Kota (Vercel Ready)"

echo.
echo ==============================================================================
echo [4/4] MENGHUBUNGKAN KE REPOSITORY GITHUB: dharapiolita-lgtm/waterwatch
echo ==============================================================================
echo.
echo Pastikan Anda telah membuat repository kosong di GitHub:
echo 1. Buka browser: https://github.com/new
echo 2. Repository name: waterwatch
echo 3. Pilih Public atau Private (bebas)
echo 4. JANGAN centang "Add a README file"
echo 5. Klik tombol hijau "Create repository"
echo.
echo Target Default URL: https://github.com/dharapiolita-lgtm/waterwatch.git
set "DEFAULT_URL=https://github.com/dharapiolita-lgtm/waterwatch.git"
set /p REPO_URL="Tekan Enter untuk menggunakan default [%DEFAULT_URL%] atau masukkan URL lain: "

if "%REPO_URL%"=="" set "REPO_URL=%DEFAULT_URL%"

echo.
echo Menghubungkan remote origin ke: %REPO_URL%
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo Mengunggah source code ke branch 'main' di GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ==============================================================================
    echo [BERHASIL!] KODE BERHASIL DIUNGGAH KE GITHUB!
    echo URL: https://github.com/dharapiolita-lgtm/waterwatch
    echo ==============================================================================
    echo.
    echo LANGKAH TERAKHIR — DEPLOY KE VERCEL (1 MENIT):
    echo 1. Buka https://vercel.com/new dan login dengan akun GitHub Anda.
    echo 2. Cari repository "waterwatch" dan klik tombol "Import".
    echo 3. Pada kolom "Root Directory", klik tombol "Edit", lalu ketik/pilih: frontend
    echo 4. Klik tombol "Deploy"!
    echo.
    echo Aplikasi Anda akan langsung aktif di https://waterwatch-xxxx.vercel.app!
    echo ==============================================================================
) else (
    echo.
    echo [CATATAN] Jika diminta login oleh GitHub, silakan lakukan otorisasi di browser.
    echo Atau gunakan tombol "Publish to GitHub" langsung dari VS Code.
)

echo.
pause
