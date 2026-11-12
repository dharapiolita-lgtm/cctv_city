# ==============================================================================
# WATERWATCH V3 SECURE — PERSIAPAN GITHUB REPOSITORY UNTUK VERCEL
# Akun GitHub  : https://github.com/dharapiolita-lgtm
# Pengembang   : Dhara Piolita & Dr. Erliyan Redy Susanto, M.Kom.
# Afiliasi     : Pemda & Universitas Teknokrat Indonesia
# ==============================================================================

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "   WATERWATCH V3 — PERSIAPAN GITHUB REPOSITORY UNTUK DEPLOYMENT VERCEL        " -ForegroundColor Yellow
Write-Host "   Target Akun GitHub: dharapiolita-lgtm                                      " -ForegroundColor Green
Write-Host "   Hak Cipta: Dhara Piolita & Dr. Erliyan Redy Susanto, M.Kom.                " -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Periksa ketersediaan Git
$gitCmd = Get-Command git -ErrorAction SilentlyContinue

if (-not $gitCmd) {
    Write-Host "[PERHATIAN] Git CLI belum terdeteksi di lingkungan PATH komputer Anda." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pilihan solusi tercepat:" -ForegroundColor White
    Write-Host "1. Instal Git resmi otomatis via Winget (Ketik Y)" -ForegroundColor Cyan
    Write-Host "2. Buka proyek di VS Code dan gunakan tombol 'Publish to GitHub' (Ketik V)" -ForegroundColor Cyan
    Write-Host "3. Buka panduan manual di PANDUAN_DEPLOY_GITHUB_VERCEL.md (Ketik N)" -ForegroundColor Cyan
    Write-Host ""
    
    $pilihan = Read-Host "Pilihan Anda (Y/V/N)"
    
    if ($pilihan -eq 'Y' -or $pilihan -eq 'y') {
        Write-Host "[INFO] Menjalankan instalasi Git resmi via winget..." -ForegroundColor Green
        winget install --id Git.Git -e --source winget
        Write-Host ""
        Write-Host "[SELESAI] Silakan tutup dan buka kembali jendela PowerShell ini, lalu jalankan kembali skrip ini." -ForegroundColor Yellow
        exit
    } elseif ($pilihan -eq 'V' -or $pilihan -eq 'v') {
        Write-Host "[INFO] Membuka VS Code..." -ForegroundColor Green
        code .
        Write-Host "Di VS Code: Klik tab Source Control (Ctrl+Shift+G) -> Klik 'Publish to GitHub'." -ForegroundColor Cyan
        exit
    } else {
        exit
    }
}

Write-Host "[1/4] Git CLI terdeteksi: $(git --version)" -ForegroundColor Green
Write-Host ""

# 2. Inisialisasi Git
if (-not (Test-Path ".git")) {
    Write-Host "[2/4] Menginisialisasi Git Repository..." -ForegroundColor Cyan
    git init
    git branch -M main
} else {
    Write-Host "[2/4] Git Repository lokal sudah siap." -ForegroundColor Green
}

# 3. Add & Commit
Write-Host "[3/4] Menambahkan seluruh file proyek WaterWatch V3..." -ForegroundColor Cyan
git add .
git commit -m "feat: WaterWatch V3 Full-Stack CCTV Analitik Keamanan Kota (Vercel Ready)"

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " [4/4] MENGHUBUNGKAN KE REPOSITORY GITHUB: dharapiolita-lgtm/waterwatch       " -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Langkah membuat repo di GitHub:" -ForegroundColor White
Write-Host "1. Buka https://github.com/new di browser" -ForegroundColor White
Write-Host "2. Masukkan Repository name: waterwatch" -ForegroundColor White
Write-Host "3. Pilih Public atau Private (bebas)" -ForegroundColor White
Write-Host "4. JANGAN centang 'Add a README file' (biarkan kosong)" -ForegroundColor White
Write-Host "5. Klik tombol hijau 'Create repository'" -ForegroundColor White
Write-Host ""

$defaultUrl = "https://github.com/dharapiolita-lgtm/waterwatch.git"
Write-Host "Target URL Default: $defaultUrl" -ForegroundColor Green
$repoUrl = Read-Host "Tekan Enter untuk menggunakan default [$defaultUrl] atau masukkan URL lain"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    $repoUrl = $defaultUrl
}

git remote remove origin 2>$null
git remote add origin $repoUrl
Write-Host "[INFO] Mengunggah source code ke branch 'main' di $repoUrl..." -ForegroundColor Cyan
git push -u origin main

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " LANGKAH DEPLOYMENT KE VERCEL (HANYA 1 MENIT)                                 " -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "1. Buka browser: https://vercel.com/new dan login dengan akun GitHub Anda." -ForegroundColor White
Write-Host "2. Cari repository 'waterwatch' milik akun 'dharapiolita-lgtm', lalu klik 'Import'." -ForegroundColor White
Write-Host "3. Di bagian 'Root Directory':" -ForegroundColor White
Write-Host "   - Klik tombol 'Edit'" -ForegroundColor Yellow
Write-Host "   - Ketik atau pilih: frontend" -ForegroundColor Yellow
Write-Host "4. Di bagian 'Environment Variables' (Opsional - app sudah punya default aman):" -ForegroundColor White
Write-Host "   - SIMULATION_MODE = true" -ForegroundColor Gray
Write-Host "   - JWT_SECRET = waterwatch-super-secret-jwt-key-2026-cctv-secure-dev" -ForegroundColor Gray
Write-Host "5. Klik tombol 'Deploy'!" -ForegroundColor Green
Write-Host ""
Write-Host "Tunggu ~60 detik. Vercel akan memberikan domain aktif seperti:" -ForegroundColor White
Write-Host "   https://waterwatch-xxxx.vercel.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "Akun Demo Default (Password: password123):" -ForegroundColor White
Write-Host "  - Admin    : admin" -ForegroundColor Gray
Write-Host "  - Operator : operator" -ForegroundColor Gray
Write-Host "  - Petugas  : petugas1 / petugas2" -ForegroundColor Gray
Write-Host "  - Pimpinan : pimpinan" -ForegroundColor Gray
Write-Host "==============================================================================" -ForegroundColor Cyan
