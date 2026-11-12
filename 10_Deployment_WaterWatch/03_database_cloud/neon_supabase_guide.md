# Panduan Penyediaan Basis Data Cloud: Neon & Supabase

Dokumen ini memandu pembuatan dan konfigurasi PostgreSQL terkelola (*managed database*) untuk WaterWatch V3 Secure.

---

## Opsi A: Neon Serverless PostgreSQL (Direkomendasikan untuk Vercel)

Neon menyediakan arsitektur Serverless PostgreSQL yang secara otomatis melakukan autoscaling dan sangat cocok dipasangkan dengan Vercel Functions.

### Langkah-langkah:
1. Buka [https://neon.tech](https://neon.tech) dan login / sign up (dapat menggunakan akun GitHub).
2. Buat Project Baru:
   - **Project Name:** `waterwatch-production`
   - **Postgres Version:** `15` atau `16`
   - **Region:** `AWS Singapore (ap-southeast-1)` atau `AWS US-East` (pilih yang terdekat).
3. Salin Connection String dari dashboard Neon:
   - Pilih mode **Pooled connection** (direkomendasikan untuk arsitektur serverless).
   - Format URL:
     ```text
     postgresql://waterwatch_owner:[PASSWORD]@ep-xyz-pooler.ap-southeast-1.aws.neon.tech/waterwatch?sslmode=require
     ```
4. Buka menu **SQL Editor** di dashboard Neon.
5. Buka berkas `neon_supabase_schema.sql`, salin seluruh kueri SQL, tempelkan ke SQL Editor Neon, lalu klik tombol **Run**.
6. Seluruh tabel (`users`, `cameras`, `detection_events`, `incidents`, `incident_updates`, `audit_logs`) dan data seed awal akan langsung terinjeksi.

---

## Opsi B: Supabase PostgreSQL

Supabase menyediakan database PostgreSQL lengkap dengan UI dashboard yang intuitif.

### Langkah-langkah:
1. Buka [https://supabase.com](https://supabase.com) dan login / register.
2. Klik **New Project**:
   - **Name:** `waterwatch-db`
   - **Database Password:** Buat password yang kuat (misal 16+ karakter acak).
   - **Region:** `Singapore (ap-southeast-1)`
   - **Pricing Plan:** Free
3. Setelah database siap (1-2 menit), buka menu **Project Settings -> Database**.
4. Scroll ke bagian **Connection String**:
   - Pilih tab **URI**.
   - Pilih mode **Transaction** (Port `6543`) untuk serverless pooling Vercel.
   - Format URL:
     ```text
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
     ```
5. Buka menu **SQL Editor** pada sidebar Supabase.
6. Buat query baru, tempelkan isi `neon_supabase_schema.sql`, lalu klik **Run**.
7. Verifikasi melalui menu **Table Editor** bahwa 6 tabel telah berhasil dibuat.

