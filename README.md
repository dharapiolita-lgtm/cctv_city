# WaterWatch — CCTV Analitik Keamanan Kota
**Sistem Command Center Monitoring & Tanggap Insiden Keamanan Kota Cerdas (Smart City)**

> **PENTING — IDENTITAS PRODUK:**  
> Nama aplikasi adalah **WaterWatch**, dengan domain fungsional **CCTV Analitik untuk Keamanan Kota** sesuai dengan PRD resmi. Aplikasi ini bukan aplikasi pemantauan ketinggian air, melainkan sistem pemantauan keamanan kota berbasis deteksi kamera analitik cerdas.

---

## 1. Ringkasan Eksekutif & Arsitektur Sistem

WaterWatch dibangun untuk memfasilitasi komando terpadu pemantauan keamanan kota bagi pemerintah daerah (Pemda), dinas komunikasi dan informatika (Diskominfo), aparat keamanan kota, dan pimpinan daerah.

### Tech Stack
| Lapisan | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14 (App Router)** | React 18, TypeScript, Tailwind CSS, Lucide Icons, responsive layout mobile & desktop |
| **Backend API** | **Rust (Tokio + Axum)** & **Next.js Route Handlers** | High-concurrency async handlers, JWT auth, pure WebAssembly & native Argon2id, Role-Based Access Control (RBAC) |
| **Database** | **PostgreSQL** | Relasional ACID, UUID primary keys, JSONB metadata, foreign keys, cascade constraints, B-Tree indexes |
| **Keamanan** | **Argon2id + JWT + Audit Log** | Hashing password standar OWASP, penguncian akun (account lockout) setelah 5 kegagalan, log audit insert-only |
| **Simulasi** | **Event Simulator Engine** | Simulator event berkala (30s) atau on-demand trigger untuk kamera online dengan ambang batas konfidensi $\ge 0.60$ |

---

## 2. Struktur Modul & Fitur Utama

### A. Autentikasi & Otorisasi Berjenjang (RBAC)
Sistem memiliki 4 peran (Role) dengan pembagian tugas ketat yang divalidasi langsung di backend:
1. **Admin (`admin`)**: Manajemen kamera penuh (CRUD & deaktifasi), manajemen pengguna, reset kata sandi, inspeksi Audit Log lengkap (insert-only).
2. **Operator (`operator`)**: Monitoring live grid CCTV, validasi event deteksi (`VALID` atau `FALSE ALARM`), eskalasi event valid menjadi tiket insiden, penugasan petugas patroli, penutupan insiden purna tugas (`DITUTUP`).
3. **Petugas Patroli / Lapangan (`petugas`)**: Dashboard mobile-first, notifikasi tiket penugasan, progres alur penanganan TKP (`DITERIMA` $\rightarrow$ `DI LOKASI` $\rightarrow$ `SELESAI`) disertai form laporan tindakan & unggah bukti catatan. Petugas hanya berhak mengupdate insiden miliknya.
4. **Pimpinan / Eksekutif (`pimpinan`)**: Dashboard ringkasan eksekutif read-only, metrik waktu tanggap rata-rata, grafik tren kejadian 7 hari, sebaran jenis insiden, dan laporan evaluasi purna tugas. Tanpa hak mutasi data.

### B. Alur Kerja (Workflow) Insiden Wajib (Strict SOP Lifecycle)
Transisi status insiden divalidasi secara ketat di tingkat basis data dan backend handler:
$$\mathbf{BARU} \longrightarrow \mathbf{DITUGASKAN} \longrightarrow \mathbf{DITERIMA} \longrightarrow \mathbf{DI\ LOKASI} \longrightarrow \mathbf{SELESAI} \longrightarrow \mathbf{DITUTUP}$$
- Satu event deteksi hanya dapat divalidasi **1 kali**.
- Satu event valid hanya dapat dieskalasi menjadi **1 insiden** (mencegah duplikasi penanganan).
- Event berstatus `FALSE ALARM` secara otomatis ditolak dari pembuatan insiden.
- Lompatan status ilegal (misal: langsung dari `BARU` ke `SELESAI`) secara tegas ditolak dengan kode respon HTTP 400 Bad Request.

### C. Live CCTV & Simulator Deteksi
- Grid kamera responsif 16:9 dengan simulasi feed video lalu lintas dan indikator online/offline/nonaktif.
- Engine generator event simulasi menghasilkan event secara acak pada kamera bertatus `online`:
  - *Suspicious Activity* (Aktivitas Mencurigakan)
  - *Crowd Gathering* (Kerumunan Massa)
  - *Traffic Accident* (Kecelakaan Lalu Lintas)
  - *Fire / Smoke Hazard* (Indikasi Kebakaran / Asap)
- Setiap data deteksi demo secara eksplisit diberi label `[SIMULASI]` untuk menjaga integritas dokumentasi ilmiah.

### D. Audit Trail (Log Audit Sistem)
- Bersifat **insert-only** langsung dari aplikasi.
- Mencatat: login pengguna (berhasil/gagal), perubahan status kamera, validasi event, eskalasi tiket insiden, delegasi petugas, pembaharuan status TKP, dan upaya pelanggaran hak akses.
- Hanya dapat diakses dan diperiksa oleh akun Administrator.

---

## 3. Akun Demo untuk Pengujian (Seed Data)

Semua akun terdaftar memiliki kata sandi default: **`password123`**

| No | Username | Peran | Nama Pengguna | Tugas & Hak Akses |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `admin` | **Admin** | Hendra Setiawan, S.T. | Kontrol penuh sistem, manajemen user & kamera, inspeksi audit |
| 2 | `operator` | **Operator** | Rian Pratama | Monitoring cctv, validasi event, buat insiden, tutup tiket |
| 3 | `petugas1` | **Petugas** | Bripka Ahmad Fauzi | Tim Patroli Reaksi Cepat Wilayah Barat (Mobile Dashboard) |
| 4 | `petugas2` | **Petugas** | Bripda Dimas Permana | Tim Patroli Reaksi Cepat Wilayah Tengah (Mobile Dashboard) |
| 5 | `pimpinan` | **Pimpinan** | Dr. Ir. Gunawan, M.T. | Walikota / Kepala Bappeda / Eksekutif Daerah (Read-Only) |

---

## 4. Panduan Menjalankan Aplikasi

### Prasyarat
- **Node.js** v18+ atau v20+ LTS
- **PostgreSQL** 12+ (Lokal, Supabase, atau Neon)
- **Rust Toolchain** (opsional, jika menjalankan backend standalone tanpa Next.js route API)

### Langkah 1: Konfigurasi Basis Data PostgreSQL
Pastikan database `waterwatch` telah dibuat di PostgreSQL:
```sql
CREATE DATABASE waterwatch;
```

Jalankan script migrasi dan seed data yang tersedia:
```bash
# Migrasi skema tabel
psql -U openpg -d waterwatch -f backend/migrations/0001_initial_schema.sql

# Injeksi data demo & pengguna awal
psql -U openpg -d waterwatch -f backend/migrations/0002_seed_data.sql
```

### Langkah 2: Konfigurasi Environment Variable
Salin template konfigurasi:
```bash
cp .env.example frontend/.env.local
```
Sesuaikan parameter `DATABASE_URL` jika menggunakan kredensial PostgreSQL non-default.

### Langkah 3: Menjalankan Frontend & API Server
```bash
cd frontend
npm install
npm run dev
```
Aplikasi akan aktif dan dapat diakses melalui peramban web di:  
👉 **`http://localhost:3000`**

Untuk menjalankan mode produksi teroptimasi:
```bash
cd frontend
npm run build
npm start
```

---

## 5. Menjalankan Menggunakan Docker Compose (Multi-Container)

Seluruh ekosistem WaterWatch dapat dijalankan dalam 1 perintah menggunakan Docker:
```bash
docker-compose up -d --build
```
Layanan yang akan berjalan:
- `waterwatch-postgres` di port `5432` (otomatis memigrasikan skema dan seed)
- `waterwatch-backend` di port `8080` (layanan Rust Axum API & background simulator)
- `waterwatch-frontend` di port `3000` (aplikasi web Next.js 14)

---

## 6. Skenario Pengujian Alur Terpadu (Integration Checklist)

1. **Skenario Login & Keamanan:**
   - Akses `/login`, masuk sebagai `admin` dengan password salah 5 kali untuk menguji penguncian akun sementara.
   - Masuk menggunakan tombol preset demo untuk masing-masing peran.
2. **Skenario Validasi & Pembuatan Tiket Insiden:**
   - Buka menu **Live CCTV** atau **Deteksi Event**.
   - Klik tombol **Simulasikan Event Baru** di pojok kanan atas topbar.
   - Pilih event, lakukan validasi sebagai `VALID`.
   - Klik **Eskalasi ke Insiden**, pilih Petugas (`Bripka Ahmad Fauzi`) dan tingkat keparahan.
3. **Skenario Progres Lapangan (Mobile Portal Petugas):**
   - Logout, login sebagai `petugas1`.
   - Pada halaman **Portal Petugas Lapangan**, klik **Terima Tugas**.
   - Perbarui status ke **Tiba di TKP** dan catat situasi awal.
   - Selesaikan penanganan dengan mengisi form catatan penanganan dan klik **Selesaikan Penanganan**.
4. **Skenario Penutupan Tiket:**
   - Login kembali sebagai `operator` atau `admin`.
   - Buka detail tiket insiden tersebut, klik **Tutup Tiket Insiden (DITUTUP)**.
   - Periksa tab timeline pelacakan untuk memverifikasi seluruh riwayat status tersimpan akurat.
5. **Skenario Dashboard Pimpinan:**
   - Login sebagai `pimpinan`.
   - Buka **Ringkasan Eksekutif** dan **Laporan Insiden**.
   - Seluruh metrik KPI, rata-rata durasi respons penanganan, dan tren 7 hari terisi otomatis dari basis data.

---

## 7. Hak Cipta & Pengesahan

Sistem ini dikembangkan dan diselesaikan untuk memenuhi standar tugas rekayasa perangkat lunak sistem informasi:

```text
Copyright©2026 by Dhara Piolita dan Dr. Erliyan Redy Susanto, M.Kom.
```

Didukung oleh kolaborasi institusi:
- **Pemerintah Daerah (Pemda)** — Inisiatif Smart City & Keamanan Terpadu
- **Universitas Teknokrat Indonesia** — Kampus Sang Juara

