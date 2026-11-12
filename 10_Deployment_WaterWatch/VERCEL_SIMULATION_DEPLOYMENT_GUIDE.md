# Panduan Lengkap Deployment Vercel Versi Simulasi (Zero Database)
**WaterWatch V3 — CCTV Analitik untuk Keamanan Kota**

Versi ini dirancang khusus untuk deployment instan di platform **Vercel** **tanpa memerlukan database eksternal (zero-database requirement)**. Seluruh data pengguna, kamera, deteksi event, tiket insiden, riwayat SOP, dan audit log berjalan secara mandiri (*in-memory persistent simulation store*) di Vercel Serverless Function.

---

## 1. Keunggulan Versi Simulasi Vercel
1. **100% Gratis & Bebas Biaya:** Tidak memerlukan langganan PostgreSQL cloud (Neon/Supabase/AWS RDS).
2. **Nol Konfigurasi Database:** Tidak perlu setup skema migrasi SQL manual.
3. **Kinerja Instan:** Bebas dari latensi jaringan basis data eksternal (*zero cold-start database connection timeouts*).
4. **Sesuai PRD & Siklus SOP Penuh:** Seluruh alur (Login 4 Role, Live CCTV Grid, Simulator Event, Validasi, Eskalasi Insiden 6 Tahap, Portal Petugas Lapangan, Dashboard Pimpinan, dan Audit Log) berfungsi penuh dan interaktif.

---

## 2. Kredensial Akun Bawaan (Pre-Seeded Accounts)

Semua akun terdaftar menggunakan kata sandi default: **`password123`**

| Peran | Username | Nama Personel | Tugas & Akses |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | Hendra Setiawan, S.T. | Kontrol penuh sistem, manajemen user & kamera, inspeksi audit |
| **Operator** | `operator` | Rian Pratama | Monitoring CCTV, validasi event, buat insiden, tutup tiket |
| **Petugas 1** | `petugas1` | Bripka Ahmad Fauzi | Portal mobile petugas lapangan (Wilayah Barat) |
| **Petugas 2** | `petugas2` | Bripda Dimas Permana | Portal mobile petugas lapangan (Wilayah Tengah) |
| **Pimpinan** | `pimpinan` | Dr. Ir. Gunawan, M.T. | Dashboard eksekutif daerah & evaluasi (Read-Only) |

---

## 3. Langkah-Langkah Deployment ke Vercel (3 Menit)

### Langkah A: Unggah Proyek ke GitHub / GitLab
1. Pastikan folder `frontend` diunggah ke repository Git pribadi Anda (misal: `github.com/username/waterwatch`).

### Langkah B: Import Proyek di Vercel Dashboard
1. Buka [https://vercel.com/new](https://vercel.com/new) dan login dengan akun GitHub Anda.
2. Cari repository `waterwatch`, lalu klik **Import**.
3. Pada pengaturan proyek Vercel:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Pilih `frontend` (jika dalam struktur monorepo) atau `./` (jika folder frontend adalah root repo).

### Langkah C: Tambahkan Environment Variables (Hanya 3 Baris!)
Di menu **Environment Variables**, tambahkan:

| Key | Value | Keterangan |
| :--- | :--- | :--- |
| **`SIMULATION_MODE`** | `true` | Mengaktifkan mode simulasi in-memory Vercel mandiri |
| **`JWT_SECRET`** | `waterwatch-super-secret-jwt-key-2026-cctv-secure-dev` | Kunci penandatanganan token JWT sesi |
| **`NEXT_PUBLIC_APP_NAME`** | `WaterWatch — CCTV Analitik Keamanan Kota` | Identitas nama aplikasi |

*(Catatan: Anda **TIDAK PERLU** memasukkan `DATABASE_URL`!)*

### Langkah D: Klik Deploy!
1. Klik tombol **Deploy**.
2. Vercel akan mengompilasi aplikasi dalam ~60 detik.
3. Domain resmi Vercel (misal: `https://waterwatch-demo.vercel.app`) akan langsung aktif dan siap digunakan untuk demonstrasi atau penilaian!

---

## 4. Panduan Uji Coba Alur Penuh di Vercel

1. **Uji Login & Proteksi:**
   - Buka URL Vercel Anda, masuk sebagai `operator` dengan sandi `password123`.
   - Coba tombol pintas di bawah card login untuk login cepat antar peran.
2. **Uji Simulasi Deteksi Event:**
   - Di Topbar kanan atas, klik tombol **Simulasikan Event Baru**.
   - Notifikasi sukses akan muncul, dan event baru akan otomatis tercatat pada kamera online.
3. **Uji Validasi Event:**
   - Buka menu **Deteksi Event**, pilih event yang baru dibuat.
   - Klik **Validasi VALID**.
4. **Uji Eskalasi & Alur Insiden 6 Tahap (SOP Lifecycle):**
   - Klik tombol **Eskalasi ke Insiden**, pilih Petugas (`Bripka Ahmad Fauzi`), klik buat insiden.
   - Tiket insiden resmi terbit dengan status awal `DITUGASKAN`.
5. **Uji Portal Mobile Petugas:**
   - Logout, login kembali sebagai `petugas1`.
   - Masuk ke menu **Portal Petugas Lapangan** (`/officer/dashboard`).
   - Klik **Terima Penugasan** (status menjadi `DITERIMA`).
   - Klik **Tiba di Lokasi** (status menjadi `DI LOKASI`).
   - Isi form laporan penanganan dan klik **Selesaikan Insiden** (status menjadi `SELESAI`).
6. **Uji Penutupan Tiket Insiden:**
   - Login kembali sebagai `operator`, buka detail insiden tersebut, klik **Tutup Tiket Insiden** (status menjadi `DITUTUP`).
7. **Uji Dashboard Pimpinan:**
   - Login sebagai `pimpinan`.
   - Seluruh statistik KPI, durasi penanganan rata-rata, grafik tren kejadian 7 hari, dan rekap lokasi tampil dinamis tanpa hak mutasi (Read-Only).
8. **Uji Integritas Audit Log:**
   - Login sebagai `admin`, buka menu **Audit Log**.
   - Seluruh aktivitas login, validasi, eskalasi tiket, dan perubahan status tercatat secara permanen.

---

## 5. Lembar Pengesahan

Hak Cipta Terdaftar:
```text
Copyright©2026 by Dhara Piolita dan Dr. Erliyan Redy Susanto, M.Kom.
```
Lembaga Afiliasi:
- **Pemerintah Daerah (Pemda)** — Smart City Command Center
- **Universitas Teknokrat Indonesia** — Kampus Sang Juara

