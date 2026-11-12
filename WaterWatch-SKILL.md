---
name: waterwatch
description: Membangun dan mengembangkan WaterWatch berdasarkan PRD CCTV Analitik untuk Keamanan Kota serta referensi UI/UX yang disediakan. Gunakan untuk implementasi, debugging, pengujian, dan penyempurnaan MVP di Antigravity.
---

# WaterWatch — Antigravity Full-Stack Development Skill

## 1. Peran dan cara kerja

Bertindak sebagai **Senior Full Stack Developer, Software Architect, UI Engineer, dan QA Engineer**.

Tugas utama:
- Membaca PRD dan seluruh referensi desain UI/UX yang tersedia di workspace sebelum mengubah kode.
- Mengimplementasikan aplikasi yang benar-benar berjalan, bukan hanya memberi contoh atau penjelasan.
- Menjaga ruang lingkup MVP, menyelesaikan alur end-to-end, dan mengutamakan implementasi yang sederhana.
- Menggunakan desain yang diberikan sebagai acuan visual utama.
- Menjaga konsistensi antara frontend, backend, database, otorisasi, dan audit trail.
- Menguji setiap alur penting setelah implementasi.

### Catatan konsistensi nama produk

Nama aplikasi yang diminta pengguna adalah **WaterWatch**. Namun, PRD dan seluruh desain UI/UX yang dilampirkan membahas **CCTV Analitik untuk Keamanan Kota** (kamera CCTV, event keamanan, insiden, petugas lapangan, dashboard pimpinan). Karena itu, untuk skill ini:
- Gunakan **WaterWatch** sebagai nama/branding aplikasi sesuai permintaan.
- Pertahankan domain dan fungsi CCTV Analitik Keamanan Kota sesuai PRD.
- Jangan mengubah produk menjadi aplikasi pemantauan air, kualitas air, bendungan, atau sensor hidrologi tanpa PRD baru yang secara eksplisit meminta perubahan domain.
- Jika pemilik proyek mengonfirmasi bahwa WaterWatch seharusnya merupakan aplikasi pemantauan air, hentikan asumsi domain CCTV dan minta PRD serta desain UI/UX WaterWatch yang benar.

## 2. Sumber kebenaran dan urutan prioritas

Gunakan sumber dalam urutan berikut:
1. PRD `PRD CCTV Analitik untuk Keamanan Kota.pdf` sebagai sumber kebutuhan fungsional, aturan bisnis, data model, edge cases, dan batasan MVP.
2. File HTML desain UI/UX yang diberikan sebagai sumber tampilan dan interaksi visual.
3. Skill ini sebagai panduan implementasi teknis.
4. Jika ada konflik, ikuti PRD untuk perilaku dan aturan bisnis; ikuti desain untuk presentasi visual. Jangan mengarang keputusan bisnis yang belum ditetapkan.

Referensi desain yang tersedia mencakup:
- Login Operator Command Center.
- Masuk Sistem / login petugas.
- Dashboard Monitoring Command Center.
- Live CCTV Analitik / grid kamera.
- Detail Event dan pembuatan insiden.
- Daftar Insiden dan Tindak Lanjut.
- Kelola Kamera dan Form Kamera.
- Kelola Pengguna.
- Audit Log.
- Dashboard Pimpinan.
- Laporan Insiden dan Detail Insiden.
- Beranda Pemantauan petugas.
- Peringatan dan Log Insiden petugas.

Sebelum implementasi:
- Inventarisasi file project dan jangan menghapus atau menimpa pekerjaan yang sudah ada tanpa alasan.
- Petakan setiap desain ke route/halaman aplikasi.
- Catat requirement yang belum pasti sebagai asumsi/TODO.
- Jangan menganggap angka, label, nama lokasi, status koneksi, atau metrik yang muncul di mockup sebagai data produksi. Gunakan sebagai seed/demo data saja.

## 3. Tujuan produk

WaterWatch (branding) adalah sistem command center CCTV analitik keamanan kota sesuai PRD. Sistem mengubah event dari kamera/video sampel menjadi data terstruktur, membantu operator memvalidasi event, membuat dan menugaskan insiden, memantau respons petugas, serta menyediakan ringkasan bagi pimpinan.

Masalah yang ditangani:
- Operator kesulitan memantau banyak kamera secara manual.
- Event/kejadian dapat terlambat diketahui.
- Informasi penugasan lapangan tidak selalu terstruktur.
- Pimpinan membutuhkan data insiden yang dapat ditelusuri untuk evaluasi.

## 4. Ruang lingkup MVP — wajib

Implementasikan hanya kemampuan berikut:

1. Login dan autentikasi.
2. RBAC untuk empat role: `admin`, `operator`, `petugas`, `pimpinan`.
3. Dashboard operasional dan dashboard eksekutif.
4. Manajemen kamera: tambah, lihat, ubah, nonaktifkan; status kamera.
5. Event deteksi dari simulator atau video sampel, beserta snapshot placeholder.
6. Validasi event: `valid` atau `false_alarm`.
7. Konversi event valid menjadi satu insiden.
8. Manajemen insiden, penugasan petugas, pembaruan status dan catatan.
9. Riwayat/timeline pembaruan insiden.
10. Audit log untuk aksi penting, bersifat insert-only dari aplikasi.
11. Filter dan pencarian dasar untuk daftar kamera, event, insiden, serta audit log.
12. Footer global di semua halaman, termasuk login.

### Di luar scope MVP — jangan implementasikan

- Pengenalan wajah / face recognition.
- ANPR / pembacaan plat nomor.
- Prediksi kriminalitas atau predictive policing.
- Pelatihan model AI sendiri.
- Inferensi AI video real-time yang kompleks.
- Streaming ribuan CCTV atau infrastruktur video berskala kota.
- Integrasi ke 112, kepolisian, atau sistem eksternal.
- Penindakan otomatis / tilang elektronik.
- Aplikasi mobile native.
- Push notification/WhatsApp.
- Peta interaktif penuh.
- Ekspor PDF/Excel jika belum diminta sebagai pengembangan lanjutan.
- RTSP/ONVIF produksi.

Tampilan CCTV pada MVP boleh menggunakan video sampel, gambar placeholder, atau visual simulasi. Jangan mengklaim bahwa sistem benar-benar menganalisis stream CCTV live jika implementasinya hanya simulator.

## 5. Tech stack

### Backend
- Rust stable.
- Tokio runtime.
- Axum untuk HTTP API.
- SQLx untuk PostgreSQL.
- Argon2 untuk password hashing.
- JWT untuk autentikasi.
- Serde untuk serialisasi/deserialisasi.
- Validasi input menggunakan validator atau validasi eksplisit.
- Tower middleware untuk CORS, tracing, dan rate limiting.

### Database
- PostgreSQL.
- SQLx migrations.
- UUID sebagai primary key.
- `timestamptz` untuk seluruh timestamp.
- JSONB untuk metadata audit/event bila sesuai.
- Foreign key, unique constraint, check constraint, dan index yang relevan.

### Frontend
- React dengan Next.js (App Router) dan TypeScript.
- Tailwind CSS.
- Komponen reusable.
- Inter sebagai font utama.
- Material Symbols Outlined untuk ikon, mengikuti desain.
- Library chart ringan bila diperlukan; chart harus memakai data API, bukan angka hardcoded.

### Deployment
- Frontend dapat disiapkan untuk Vercel.
- Backend Rust dan PostgreSQL dijalankan/deploy secara terpisah bila diperlukan.
- URL API harus berasal dari environment variable.
- Jangan menjalankan pemrosesan video berat di Vercel.
- Untuk demo, gunakan polling sederhana jika SSE/WebSocket tidak cocok dengan target deployment.

Jika repository sudah memiliki stack yang berjalan, jangan migrasi teknologi tanpa kebutuhan nyata. Pertahankan stack wajib di atas untuk project baru.

## 6. Arsitektur dan struktur project

Gunakan arsitektur sederhana dan mudah dipahami. Untuk project baru, struktur yang disarankan:

```text
waterwatch/
├── frontend/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (admin)/
│   │   ├── (operator)/
│   │   ├── (officer)/
│   │   └── (executive)/
│   ├── components/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── cameras/
│   │   ├── events/
│   │   ├── incidents/
│   │   └── ui/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   └── public/
│       ├── logos/
│       └── demo/
├── backend/
│   ├── src/
│   │   ├── main.rs
│   │   ├── config/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── auth/
│   │   ├── routes/
│   │   ├── handlers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── dto/
│   │   ├── simulator/
│   │   └── errors/
│   └── migrations/
├── .env.example
├── docker-compose.yml
└── README.md
```

Jangan memaksakan struktur ini bila repository sudah mempunyai konvensi yang baik. Hindari microservices, message broker, dan abstraksi berlebihan untuk MVP.

## 7. Role dan hak akses (RBAC)

Role harus disimpan di database dan diverifikasi di backend untuk setiap endpoint terlindungi. Frontend hanya menyembunyikan/mengatur navigasi; frontend bukan sumber otorisasi.

| Fitur | Admin | Operator | Petugas | Pimpinan |
|---|---:|---:|---:|---:|
| Login / lihat profil sendiri | Ya | Ya | Ya | Ya |
| Dashboard operasional | Ya | Ya | Terbatas | Read-only |
| Lihat kamera | Ya | Ya | Sesuai kebutuhan | Ringkasan |
| CRUD kamera | Ya | Tidak | Tidak | Tidak |
| Kelola pengguna dan role | Ya | Tidak | Tidak | Tidak |
| Lihat event | Ya | Ya | Event terkait penugasan saja bila diperlukan | Ringkasan |
| Validasi event | Ya bila bertindak sebagai admin operasional | Ya | Tidak | Tidak |
| Membuat insiden dari event valid | Ya | Ya | Tidak | Tidak |
| Menugaskan insiden | Ya | Ya | Tidak | Tidak |
| Melihat insiden | Semua | Semua | Yang ditugaskan kepadanya | Semua (read-only) |
| Mengubah status insiden | Admin berwenang | Tidak, kecuali kebutuhan operasional disetujui | Yang ditugaskan kepadanya | Tidak |
| Audit log | Ya | Tidak | Tidak | Tidak |
| Laporan/dashboard eksekutif | Ya | Sesuai izin | Tidak | Ya, read-only |

Ketentuan:
- `admin`: administrasi sistem, kamera, pengguna, audit log, serta akses pengawasan.
- `operator`: memantau kamera/event, memvalidasi event, membuat insiden, menugaskan petugas.
- `petugas`: hanya melihat insiden yang ditugaskan kepadanya, menerima penugasan, memperbarui status sesuai workflow, dan menambahkan catatan.
- `pimpinan`: akses baca saja pada dashboard, laporan, ringkasan, dan detail yang diizinkan.
- Jangan mempercayai role dari request body, query string, local storage, atau pilihan tab login.
- Role diambil dari identitas user terautentikasi pada backend.
- Akses yang tidak sah mengembalikan HTTP 403 dan dicatat sesuai kebijakan audit.

### Login dan pemilihan role di desain

Beberapa desain login menampilkan tab/pilihan role. Jika elemen tersebut dipertahankan:
- Perlakukan sebagai pilihan konteks tampilan saja, bukan penentu role atau pemberi hak akses.
- Setelah login, role aktual tetap berasal dari database/JWT yang tervalidasi.
- Jika pilihan role tidak cocok dengan role akun, tolak login dengan pesan aman atau abaikan pilihan UI dan tampilkan role aktual; pilih satu perilaku konsisten dan dokumentasikan.
- Jangan pernah membuat akun dapat menjadi admin hanya dengan memilih tab Admin.

## 8. Autentikasi dan keamanan

Implementasikan:
- Login menggunakan username/email dan password; dukung NIP/ID petugas sebagai username bila dipakai di desain.
- Password di-hash dengan Argon2id (jangan simpan plaintext).
- JWT dengan expiration yang dikonfigurasi melalui environment variable.
- Endpoint `me` untuk mengambil profil dan role aktif.
- Logout dengan strategi token yang sesuai implementasi; jangan mengklaim JWT stateless sudah dicabut jika tidak ada mekanisme revocation.
- Middleware autentikasi dan RBAC.
- Rate limiting untuk endpoint login.
- Setelah 5 kali login gagal berturut-turut, kunci akun sementara. Durasi belum ditentukan di PRD: jadikan konfigurasi, dokumentasikan nilai default demo sebagai asumsi, dan jangan mengklaim sebagai kebijakan final.
- Validasi seluruh input di backend.
- Gunakan query SQLx terparameterisasi.
- CORS hanya mengizinkan origin frontend yang dikonfigurasi.
- Jangan expose `password_hash`, secret, token internal, atau stack trace ke client.
- Simpan secret hanya di environment variable.
- Terapkan transaksi database pada operasi multi-tabel yang harus atomik.
- Jangan menyimpan data pribadi yang tidak diperlukan.
- Jangan menampilkan wajah/plat nomor asli pada aset demo. Gunakan snapshot sintetis atau blur/placeholder.

## 9. Model data dan aturan database

Buat migration SQL yang lengkap dan dapat dijalankan dari database kosong.

### `users`
Field minimal:
- `id UUID PRIMARY KEY`
- `nama`
- `username` (unique)
- `email` (nullable bila tidak dipakai, unique bila terisi)
- `password_hash`
- `role` (`admin`, `operator`, `petugas`, `pimpinan`)
- `aktif BOOLEAN`
- `failed_login_attempts`
- `locked_until TIMESTAMPTZ NULL`
- `last_login_at TIMESTAMPTZ NULL`
- `created_at`, `updated_at`

### `cameras`
- `id UUID PRIMARY KEY`
- `nama`
- `lokasi_lat`, `lokasi_lng`
- `alamat`
- `sumber_stream` atau `sample_video_path`
- `status` (`online`, `offline`, `nonaktif`)
- `last_seen_at TIMESTAMPTZ NULL`
- `created_at`, `updated_at`

### `detection_events`
- `id UUID PRIMARY KEY`
- `camera_id` FK ke cameras
- `jenis`
- `skor` / confidence numeric dengan validasi rentang 0–1
- `waktu_deteksi TIMESTAMPTZ`
- `snapshot_path` nullable
- `clip_path` nullable bila dipakai
- `validasi` nullable atau (`valid`, `false_alarm`)
- `divalidasi_oleh` FK users nullable
- `divalidasi_pada TIMESTAMPTZ NULL`
- `created_at`

### `incidents`
- `id UUID PRIMARY KEY`
- `event_id` FK detection_events dengan UNIQUE constraint (satu event maksimal satu insiden)
- `jenis`
- `keparahan` (`rendah`, `sedang`, `tinggi`)
- `status` (`baru`, `ditugaskan`, `diterima`, `di_lokasi`, `selesai`, `ditutup`)
- `lokasi`
- `deskripsi`
- `dibuat_oleh` FK users
- `ditugaskan_ke` FK users nullable
- `dibuat_pada`
- `selesai_pada TIMESTAMPTZ NULL`
- `updated_at`

### `incident_updates`
- `id UUID PRIMARY KEY`
- `incident_id` FK incidents
- `status_lama` nullable
- `status_baru`
- `catatan`
- `oleh` FK users
- `waktu TIMESTAMPTZ`

### `audit_logs`
- `id UUID PRIMARY KEY`
- `user_id` FK users nullable untuk aksi sistem/anonymous
- `aksi`
- `objek_tipe`
- `objek_id` nullable
- `ip`
- `waktu TIMESTAMPTZ`
- `detail JSONB`

Relasi:
- camera 1:N detection_events.
- detection_event 1:0..1 incident.
- incident 1:N incident_updates.
- user 1:N audit_logs.

Tambahkan index pada foreign key dan kolom filter yang sering digunakan, terutama waktu event, status insiden, status kamera, role, dan waktu audit.

### Integritas data

- Satu event hanya dapat divalidasi sekali. Gunakan update bersyarat/optimistic concurrency atau transaksi agar dua operator tidak saling menimpa.
- Satu event hanya dapat memiliki satu insiden. Tegakkan dengan UNIQUE constraint di database, bukan hanya pengecekan frontend.
- Audit log tidak menyediakan endpoint update/delete. Pertimbangkan privilege database atau trigger untuk mencegah perubahan dari aplikasi.
- Operasi pembuatan insiden harus atomik: insert incident, insert initial incident_update, dan insert audit log dalam satu transaksi.
- Operasi status insiden harus atomik: validasi transisi, update status, insert incident_update, dan insert audit log.

## 10. Event simulator dan event lifecycle

MVP menggunakan simulator event atau video sampel. Jangan implementasikan inferensi AI sungguhan.

Jenis event demo yang dapat digunakan:
- `suspicious_activity`
- `crowd`
- `accident`
- `fire`

Jenis tersebut merupakan pilihan data simulasi untuk demonstrasi, bukan klaim bahwa model AI telah mendeteksinya.

Simulator harus:
- Menghasilkan event untuk kamera yang berstatus `online` saja.
- Menyimpan `camera_id`, jenis, confidence, waktu deteksi, dan snapshot placeholder.
- Menyimpan event ke PostgreSQL.
- Menghasilkan data yang konsisten dan dapat diulang untuk demo.
- Menyediakan konfigurasi interval/aktif-nonaktif simulator.
- Tidak membuat event baru dari kamera offline atau nonaktif.
- Memiliki cara menjalankan manual untuk demo/testing; background loop hanya bila sesuai deployment.
- Tidak menghasilkan data palsu yang ditampilkan sebagai kejadian nyata tanpa label “SIMULASI”.

### Ambang confidence dan penggabungan event

PRD belum menentukan ambang confidence, jendela duplikasi, dan batas lonjakan event. Karena itu:
- Jadikan nilainya konfigurasi.
- Gunakan nilai default demo yang terdokumentasi, bukan keputusan bisnis final.
- Event di bawah ambang tidak ditampilkan sebagai alert aktif, tetapi perilaku penyimpanannya harus konsisten dan dijelaskan.
- Event duplikat dapat dikelompokkan pada UI; jangan menghapus data sumber.
- Jika simulator menghasilkan lonjakan, simpan event dan batasi/group tampilan agar operator tidak dibanjiri alert.

### Real-time

- Prioritas pertama: polling berkala yang stabil untuk demo dan deployment serverless.
- SSE boleh dipakai bila backend host mendukung koneksi persisten.
- WebSocket bukan syarat MVP.
- UI harus memperlihatkan waktu pembaruan data dan state loading/error.
- Jangan menyebut “real-time aktif” jika data hanya diperbarui dengan interval polling; gunakan label yang jujur seperti “Pembaruan otomatis”.

## 11. Validasi event

Operator (dan admin bila diizinkan) dapat:
- Melihat detail event.
- Melihat snapshot/klip jika tersedia.
- Menandai event `valid`.
- Menandai event `false_alarm`.

Aturan:
- Validasi wajib memilih salah satu nilai.
- Validasi pertama berhasil.
- Validasi kedua untuk event yang sama ditolak dengan HTTP 409 Conflict dan pesan yang jelas.
- Event `false_alarm` tidak dapat dikonversi menjadi insiden.
- Event `valid` dapat dikonversi menjadi insiden.
- Jika event sudah mempunyai insiden, tolak pembuatan kedua dengan HTTP 409 dan pesan: “Event ini sudah memiliki insiden.”
- Jika snapshot gagal dimuat, event tetap terlihat dengan placeholder “Bukti tidak tersedia”.
- UI tidak boleh menyembunyikan event hanya karena snapshot hilang.

## 12. Incident management

### Data insiden
Setiap insiden memuat:
- ID insiden.
- Event sumber dan kamera.
- Jenis insiden.
- Keparahan: `rendah`, `sedang`, `tinggi`.
- Lokasi.
- Deskripsi.
- Petugas yang ditugaskan.
- Status.
- Waktu dibuat dan waktu selesai.
- Timeline pembaruan, pelaku, dan catatan.

### Workflow status

Urutan yang ditentukan PRD:

```text
baru
  → ditugaskan
  → diterima
  → di_lokasi
  → selesai
  → ditutup
```

- Tolak transisi di luar urutan.
- Status `ditugaskan` harus memiliki petugas tujuan.
- Petugas hanya dapat memperbarui insiden yang ditugaskan kepadanya.
- Petugas dapat menerima penugasan dan memperbarui status sampai `selesai`.
- Penutupan akhir (`ditutup`) dilakukan oleh role operasional berwenang (admin/operator) setelah selesai.
- Setiap transisi wajib menyimpan status lama, status baru, user, waktu, dan catatan.
- Jika petugas belum merespons, insiden tetap `ditugaskan`; operator dapat menugaskan ulang. Batas eskalasi belum ditetapkan PRD, jangan mengarang otomatisasi eskalasi.
- Jika koneksi gagal, tampilkan pesan dan izinkan retry; jangan mengklaim perubahan berhasil sebelum API mengonfirmasi.

## 13. Dashboard dan halaman

Semua statistik harus berasal dari PostgreSQL/API. Seed data hanya untuk demo.

### 13.1 Login
Ikuti referensi login:
- Layout institusional yang bersih.
- Header/brand command center.
- Kartu login dengan username/NIP dan password.
- Toggle tampil/sembunyikan password.
- Pilihan sektor/stasiun kerja hanya jika dibutuhkan oleh desain; simpan sebagai konteks UI, bukan hak akses.
- Pesan keamanan akses terbatas.
- State loading, gagal login, akun terkunci, dan token/session error.
- Footer wajib.

### 13.2 Dashboard operator/admin
Tampilkan:
- Total kamera.
- Kamera online.
- Kamera offline.
- Event hari ini.
- Insiden terbuka.
- Rata-rata waktu respons.
- Grafik insiden berdasarkan jenis.
- Grafik tren insiden per hari untuk rentang terpilih.
- Grid CCTV 3x3 atau grid responsif berdasarkan lebar layar.
- Feed event/alert terbaru.
- Status stream dan placeholder kamera offline.
- Navigasi cepat ke detail event dan insiden.

Angka seperti “akurasi 96.4%”, “respons 4.2 menit”, atau “false alarm 2.8%” yang terlihat pada mockup tidak boleh dijadikan angka produksi statis. Tampilkan hanya jika benar-benar dihitung dari data yang tersedia; jika tidak, hilangkan atau beri label “data demo”.

### 13.3 Kelola Kamera
Admin dapat:
- Melihat daftar kamera.
- Mencari berdasarkan nama/alamat.
- Filter status dan sektor/lokasi.
- Menambah dan mengubah kamera.
- Menonaktifkan kamera dengan konfirmasi.
- Melihat detail kamera dan ringkasan konfigurasi.

Form kamera:
- Nama kamera.
- Alamat/lokasi.
- Latitude dan longitude.
- Sumber video / sample video.
- Status.

Untuk MVP, field RTSP dapat disimpan sebagai konfigurasi placeholder bila desain menampilkannya, tetapi jangan mencoba melakukan ingest RTSP produksi. Jangan menyimpan credential stream dalam teks biasa; jika belum ada pengelolaan secret, gunakan sumber video sampel.

### 13.4 Live CCTV Analitik
- Tampilkan grid kamera dengan aspect ratio 16:9.
- Gunakan video sampel lokal/statik atau placeholder visual.
- Overlay bounding box/reticle hanya dekorasi simulasi dan harus diberi label demo bila relevan.
- Status online/offline terlihat jelas.
- Kamera offline menampilkan diagnostic state, bukan video palsu.
- Stream error menampilkan “Bukti tidak tersedia” atau state error.
- Sediakan filter pencarian/lokasi/status.
- Jangan menampilkan wajah atau plat nomor asli pada sample asset.

### 13.5 Detection Events
Tampilkan:
- Waktu deteksi.
- Kamera.
- Jenis event.
- Confidence.
- Status validasi.
- Snapshot/klip.
- Tombol detail.
- Tombol valid / false alarm sesuai role dan status.
- Filter jenis, kamera, validasi, dan tanggal.

### 13.6 Detail Event dan Buat Insiden
- Panel kiri: snapshot/video sampel, metadata kamera, waktu, lokasi, confidence, dan status validasi.
- Panel kanan: formulir pembuatan insiden/penugasan.
- Pilih jenis, severity, petugas, dan instruksi.
- Checklist SOP pada desain boleh menjadi elemen UI, tetapi jangan membuat checklist menjadi persyaratan bisnis baru kecuali ada di PRD.
- Tombol submit harus disabled saat request berlangsung.
- Tampilkan konfirmasi sukses hanya setelah transaksi API berhasil.

### 13.7 Daftar Insiden dan Tindak Lanjut
Tampilkan:
- ID.
- Jenis.
- Severity.
- Lokasi/sektor.
- Status.
- Kamera/event sumber.
- Petugas.
- Waktu dibuat dan update terakhir.
- Filter status/severity/lokasi/tanggal.
- Pencarian.
- Timeline detail insiden.
- State kosong/loading/error.

### 13.8 Beranda Petugas
- Profil dan konteks tugas.
- Daftar insiden yang ditugaskan kepada user tersebut.
- Severity dan status.
- Lokasi, bukti, dan instruksi.
- Tombol terima, di lokasi, dan selesai sesuai transisi yang sah.
- Form catatan untuk setiap pembaruan.
- Tampilan mobile-responsive karena petugas dapat menggunakan ponsel/browser.
- Jika sinyal/API gagal, tampilkan error dan tombol coba lagi. Jangan menyimpan perubahan seolah-olah berhasil.

### 13.9 Kelola Pengguna
Admin dapat:
- Melihat pengguna.
- Membuat pengguna.
- Mengubah nama, username/email, role, status aktif.
- Reset password melalui alur admin yang aman.
- Tidak dapat melihat password asli.
- Tidak boleh ada privilege escalation melalui update profile biasa.

### 13.10 Audit Log
Admin dapat melihat:
- Pelaku/user.
- Aksi.
- Objek/tipe objek.
- ID objek.
- Waktu.
- IP.
- Detail JSON yang aman ditampilkan.

Tambahkan filter waktu, tipe aksi, pengguna, dan IP jika tersedia. Tidak ada tombol edit/delete. Tampilkan penanda read-only/integrity. Jangan mengklaim WORM, hash-chain, atau immutable storage bila hanya insert-only di aplikasi.

### 13.11 Dashboard Pimpinan
Mode **Read-Only Eksekutif**:
- Banner status data dan waktu pembaruan.
- Filter tanggal/periode, jenis insiden, lokasi/sektor.
- KPI: insiden terbuka, event hari ini, rata-rata waktu respons, false alarm rate bila terhitung.
- Grafik distribusi insiden berdasarkan jenis.
- Grafik tren insiden per hari/minggu.
- Tabel ringkasan insiden terbaru.
- Modal detail read-only.
- Tidak boleh menampilkan aksi mutasi.
- Jika data kosong, tampilkan empty state, bukan angka palsu.

### 13.12 Laporan dan Rekapitulasi
Sajikan ringkasan dan tabel read-only berdasarkan data yang ada. Ekspor file merupakan fitur v2 kecuali pengguna secara eksplisit meminta implementasinya.

## 14. Design system dan UI/UX

Ikuti desain HTML/Google Stitch yang diberikan sedekat mungkin. Jangan membuat desain baru tanpa alasan.

### Identitas visual
- Sidebar dark navy.
- Aksen teal untuk aksi utama, status aktif, dan highlight.
- Background sangat terang kebiruan.
- Card putih dengan border/shadow halus.
- Font Inter.
- Material Symbols Outlined.
- Radius sudut kecil/menengah, konsisten.
- Dashboard command-center yang padat tetapi terstruktur.

### Palet warna dari referensi
Gunakan token CSS/Tailwind terpusat, jangan menyebar hardcoded warna di seluruh komponen:
- Primary dark: `#000615`
- Primary container/navy: `#0B1F3A`
- Secondary/teal: `#006A63`
- Secondary container: `#99EFE5`
- Surface/background: `#F8F9FF`
- Surface low: `#EFF4FF`
- Surface container: `#E5EEFF`
- Text utama: `#0B1C30`
- Text sekunder: `#44474D`
- Outline: `#75777E`
- Error: `#BA1A1A`

### Tipografi
Gunakan Inter. Skala acuan:
- Headline XL: 32px / 40px, bold.
- Headline LG: 24px / 32px, bold.
- Headline MD: 20px / 28px, semibold.
- Headline SM: 18px / 26px, semibold.
- Body LG: 16px / 24px.
- Body MD: 14px / 20px.
- Label: 14px.
- Metadata kecil: 11–12px.

### Layout
- Desktop-first untuk dashboard command center.
- Sidebar desktop sekitar 288px, fixed/collapsible.
- Header fixed/sticky sesuai referensi.
- Konten utama memiliki gutter dan spacing konsisten.
- Pada layar kecil sidebar menjadi drawer/collapsible.
- Tabel dapat horizontal-scroll pada layar kecil.
- Kartu kamera menjadi grid responsif; jangan memaksakan 3 kolom di ponsel.
- Target area klik minimal 44px untuk kontrol utama.
- Jaga kontras teks dan state fokus keyboard.
- Semua halaman memakai shared AppShell dan shared footer.

### Komponen reusable
Minimal:
- `AppShell`
- `Sidebar`
- `Topbar`
- `GlobalFooter`
- `RoleGuard`
- `StatCard`
- `StatusBadge`
- `CameraCard`
- `CameraGrid`
- `EventCard`
- `EventFeed`
- `IncidentCard`
- `IncidentTimeline`
- `FilterToolbar`
- `DataTable`
- `ConfirmDialog`
- `Toast`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `Pagination`

### Status badge
- Kamera: `ONLINE`, `OFFLINE`, `NONAKTIF`.
- Event: `MENUNGGU VALIDASI`, `VALID`, `FALSE ALARM`.
- Severity: `RENDAH`, `SEDANG`, `TINGGI`.
- Insiden: `BARU`, `DITUGASKAN`, `DITERIMA`, `DI LOKASI`, `SELESAI`, `DITUTUP`.

Gunakan warna konsisten dan jangan hanya mengandalkan warna; sertakan teks/ikon.

## 15. Footer wajib

Footer tampil pada semua halaman termasuk login, desktop dan mobile.

Isi:
- Logo Pemda.
- Logo Universitas Teknokrat Indonesia.
- Teks persis:

`Copyright©2026 by Dhara Piolita dan Dr. Erliyan Redy Susanto, M.Kom.`

Aturan:
- Gunakan file logo resmi bila tersedia.
- Jangan menganggap URL gambar sementara di HTML mockup sebagai aset resmi yang stabil.
- Jika logo belum tersedia, tampilkan placeholder rapi dengan alt text “Logo Pemda” dan “Logo Universitas Teknokrat Indonesia”.
- Jika gambar gagal dimuat, teks copyright tetap harus terlihat.
- Implementasikan satu komponen global agar konsisten dan mudah diperbarui.

## 16. API REST minimum

Gunakan prefix `/api`.

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Cameras
- `GET /api/cameras`
- `GET /api/cameras/:id`
- `POST /api/cameras`
- `PUT /api/cameras/:id`
- `PATCH /api/cameras/:id/deactivate`

### Events
- `GET /api/events`
- `GET /api/events/:id`
- `POST /api/events/:id/validate`

### Incidents
- `GET /api/incidents`
- `GET /api/incidents/:id`
- `POST /api/incidents`
- `PATCH /api/incidents/:id/assign`
- `PATCH /api/incidents/:id/status`
- `POST /api/incidents/:id/updates`

### Users
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `PATCH /api/users/:id/active`
- Endpoint reset password admin bila diperlukan.

### Dashboard
- `GET /api/dashboard/summary`
- `GET /api/dashboard/incidents`
- `GET /api/dashboard/trends`

### Audit
- `GET /api/audit-logs`

Gunakan pagination, filter, sorting yang tervalidasi. Bentuk response konsisten, misalnya:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 0
  }
}
```

Format error konsisten:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Periksa kembali data yang dikirim."
  }
}
```

Status HTTP:
- `200/201`: berhasil.
- `400`: request tidak valid.
- `401`: belum terautentikasi/token invalid atau expired.
- `403`: role tidak berwenang.
- `404`: resource tidak ditemukan.
- `409`: konflik validasi/duplikasi/transisi status.
- `422`: validasi field gagal bila dipakai konsisten.
- `500`: error internal dengan pesan aman.

## 17. Seed data demo

Buat seed yang jelas ditandai sebagai data simulasi.

Minimal:
- 1 admin.
- 1 operator.
- 2 petugas.
- 1 pimpinan.
- 5–9 kamera dengan status campuran online/offline/nonaktif.
- Beberapa event dengan status belum divalidasi, valid, dan false alarm.
- Beberapa insiden dengan status berbeda di workflow.
- Audit log yang menggambarkan aksi demo.

Gunakan lokasi contoh dari desain hanya sebagai data fiktif/demo. Jangan menyatakan bahwa kamera tersebut benar-benar terpasang.

Sediakan akun demo di README hanya untuk lingkungan development. Jangan menggunakan password demo di production.

## 18. Error states dan edge cases wajib

Tangani kondisi berikut sesuai PRD:

1. Kamera offline/stream putus:
   - Status menjadi offline.
   - Dashboard menandai kamera.
   - Simulator tidak membuat event dari kamera tersebut.
   - Status dapat pulih ketika heartbeat/sumber kembali.
2. Lonjakan event:
   - Event tetap disimpan.
   - UI dapat mengelompokkan/membatasi tampilan.
   - Jangan membuang data sumber diam-diam.
3. Event duplikat:
   - Dapat dikelompokkan pada UI berdasarkan kamera/jenis/jendela waktu konfigurasi.
   - Jangan menghapus event asli tanpa aturan eksplisit.
4. False alarm tinggi:
   - Hitung false alarm rate dari data validasi aktual.
5. Dua operator memvalidasi event sama:
   - Satu berhasil.
   - Permintaan kedua menerima 409.
6. Event sudah punya insiden:
   - Tolak pembuatan insiden kedua dengan 409.
7. Petugas tidak merespons:
   - Status tetap ditugaskan.
   - Operator dapat menugaskan ulang.
8. Petugas offline/sinyal lemah:
   - Tampilkan error dan opsi retry.
   - Jangan kehilangan catatan secara diam-diam.
9. Snapshot/klip gagal:
   - Tampilkan placeholder “Bukti tidak tersedia”.
10. JWT expired:
    - Arahkan ke login.
    - Jangan mengklaim perubahan yang belum tersimpan berhasil.
11. Akses di luar role:
    - Kembalikan 403.
    - Catat percobaan sesuai kebijakan.
12. Database tidak tersedia:
    - Tampilkan error state jelas.
    - Batalkan transaksi; jangan menampilkan sukses parsial.
13. Logo gagal dimuat:
    - Footer dan teks copyright tetap tampil.

## 19. Audit trail

Catat minimal:
- Login berhasil/gagal.
- Logout bila dapat dicatat.
- Pembuatan/perubahan/nonaktif kamera.
- Pembuatan/perubahan/nonaktif pengguna.
- Validasi event.
- Pembuatan insiden.
- Penugasan/perubahan penugasan.
- Perubahan status insiden.
- Akses yang ditolak karena role bila memungkinkan.

Setiap record mencatat actor, action, object type, object id, timestamp, IP, dan detail aman. Jangan pernah memasukkan password, JWT, atau secret ke detail audit.

Audit log bersifat insert-only dari aplikasi. Tidak boleh ada route edit/delete.

## 20. Testing dan quality gates

Buat dan jalankan:
- Unit test untuk validasi input, role permission, dan status transition.
- Integration test untuk auth, CRUD kamera, validasi event, pembuatan insiden, penugasan, update status, dan audit.
- Test konflik validasi event ganda.
- Test event hanya berasal dari kamera online.
- Test pimpinan tidak dapat melakukan mutasi.
- Test petugas tidak dapat mengubah insiden milik petugas lain.
- Test footer hadir di halaman login dan halaman aplikasi.
- Frontend lint/typecheck/build.
- Backend `cargo fmt`, `cargo clippy`, dan `cargo test`.
- Migration up dari database kosong dan seed berjalan.

### Definition of Done

MVP dianggap selesai jika:
- Aplikasi dapat dijalankan dari README.
- Migration dan seed berhasil.
- Login Argon2/JWT berjalan.
- Empat role bekerja sesuai RBAC backend.
- Admin dapat mengelola kamera dan pengguna.
- Operator dapat melihat event, memvalidasi, membuat, dan menugaskan insiden.
- Petugas dapat melihat penugasan sendiri dan memperbarui status sesuai workflow.
- Pimpinan hanya dapat melihat dashboard/laporan.
- Dashboard menggunakan data database.
- Audit log tercatat dan tidak dapat diedit/dihapus dari aplikasi.
- Seluruh halaman mengikuti referensi UI/UX secara konsisten.
- Footer wajib tampil di seluruh halaman.
- Error/empty/loading states tersedia.
- Build dan test utama lulus.
- Tidak ada fitur yang mengklaim AI/live CCTV bila hanya menggunakan simulasi.

## 21. Environment variables

Sediakan `.env.example` tanpa secret asli. Minimal:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/waterwatch
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRATION_MINUTES=60
FRONTEND_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCK_MINUTES=15
EVENT_SIMULATOR_ENABLED=true
EVENT_SIMULATOR_INTERVAL_SECONDS=30
EVENT_CONFIDENCE_THRESHOLD=0.60
```

Nilai lock duration, simulator interval, dan confidence threshold di atas adalah default demo/asumsi teknis, bukan keputusan final PRD. Buat konfigurasi mudah diubah dan dokumentasikan.

## 22. README dan cara menjalankan

README wajib menjelaskan:
- Prasyarat.
- Struktur folder.
- Cara menjalankan PostgreSQL (termasuk Docker Compose jika disediakan).
- Cara mengatur `.env`.
- Cara menjalankan migration.
- Cara menjalankan seed.
- Cara menjalankan backend.
- Cara menjalankan frontend.
- Akun demo development.
- Cara mengaktifkan/menonaktifkan simulator.
- Cara menjalankan test.
- Batasan MVP: simulasi/video sampel, bukan AI real-time atau RTSP produksi.
- Panduan deployment frontend dan backend terpisah.

## 23. Workflow implementasi untuk Antigravity

Kerjakan bertahap dan verifikasi tiap tahap. Jangan membuat seluruh UI statis lalu menganggap aplikasi selesai.

### Tahap 1 — Audit repository
1. Periksa file/folder dan stack yang sudah ada.
2. Identifikasi desain HTML dan PRD.
3. Buat checklist requirement dan halaman.
4. Jangan menghapus kode existing tanpa memahami dampaknya.

### Tahap 2 — Fondasi
1. Setup backend Rust/Axum.
2. Setup frontend Next.js/TypeScript/Tailwind.
3. Setup PostgreSQL dan docker-compose.
4. Buat `.env.example`.
5. Buat migration dan seed.

### Tahap 3 — Backend inti
1. Models/DTO dan error response.
2. Auth Argon2/JWT.
3. Middleware RBAC.
4. CRUD kamera.
5. Simulator event.
6. Event listing dan validation.
7. Incident workflow dan assignment.
8. Dashboard queries.
9. Audit log.
10. Unit/integration tests.

### Tahap 4 — Frontend inti
1. Design tokens dan typography.
2. Shared AppShell, sidebar, topbar, footer.
3. Login dan session handling.
4. Dashboard admin/operator.
5. Kamera dan form kamera.
6. Event list dan detail.
7. Insiden list/detail/timeline.
8. Beranda petugas.
9. Kelola pengguna.
10. Audit log.
11. Dashboard pimpinan dan laporan.

### Tahap 5 — Integrasi dan hardening
1. Hubungkan semua halaman ke API nyata.
2. Hapus hardcoded KPI dan data statis kecuali seed/demo yang diberi label.
3. Uji seluruh role dan alur end-to-end.
4. Uji empty/loading/error/conflict states.
5. Cocokkan visual dengan desain referensi.
6. Jalankan lint, typecheck, test, build.
7. Perbaiki error sebelum menyatakan selesai.
8. Lengkapi README.

## 24. Aturan kerja saat menggunakan Antigravity

- Jangan hanya mengeluarkan potongan kode di chat; edit file project secara langsung.
- Jangan berhenti setelah membuat scaffold. Implementasikan alur end-to-end.
- Jangan menandai tugas selesai sebelum menjalankan build/test yang relevan.
- Jangan mengganti teknologi atau scope tanpa alasan dan konfirmasi.
- Jangan menghapus file desain, aset, atau data pengguna.
- Jangan hardcode kredensial, secret, statistik, atau data operasional.
- Jangan menyebut simulasi sebagai deteksi AI sungguhan.
- Jangan menampilkan tombol yang tidak berfungsi. Jika fitur belum tersedia, tampilkan disabled state atau TODO yang jelas.
- Gunakan Bahasa Indonesia untuk label antarmuka, pesan validasi, dan dokumentasi pengguna; kode, identifier, dan API boleh menggunakan Bahasa Inggris.
- Setelah setiap tahap, ringkas file yang dibuat/diubah, hasil test, dan blocker yang tersisa.
- Jika requirement PRD belum diputuskan, pilih default demo paling sederhana, beri label asumsi, dan jangan menyamarkannya sebagai keputusan final.

## 25. Instruksi awal saat skill dipanggil

Mulai dengan:
1. Baca PRD dan seluruh file desain UI/UX yang ada di workspace.
2. Periksa repository dan identifikasi apakah project sudah berjalan.
3. Buat checklist implementasi berdasarkan bagian “Definition of Done”.
4. Konfirmasi secara internal bahwa branding WaterWatch tetap menggunakan domain CCTV sesuai dokumen sumber; jangan mengubahnya menjadi water monitoring tanpa instruksi/PRD baru.
5. Mulai implementasi dari fondasi yang paling aman tanpa menunggu klarifikasi untuk hal-hal yang dapat diberi default demo.
6. Laporkan hanya pertanyaan yang benar-benar menghalangi implementasi.
