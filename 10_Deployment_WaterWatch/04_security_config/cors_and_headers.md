# Spesifikasi Keamanan: CORS, HTTPS & OWASP Security Headers
**WaterWatch V3 Secure Deployment Standard**

---

## 1. Kebijakan Cross-Origin Resource Sharing (CORS)

Pada arsitektur terdistribusi (Frontend Next.js di Vercel dan Backend Rust Axum di Railway/Render/Fly.io), komunikasi antar-domain harus dikontrol secara ketat:

### Matriks Kebijakan CORS Backend Axum:
| Atribut | Nilai yang Diterapkan | Justifikasi Keamanan |
| :--- | :--- | :--- |
| **`Access-Control-Allow-Origin`** | Menggunakan variabel `FRONTEND_ORIGIN` (misal: `https://waterwatch-v3.vercel.app`) | Mencegah situs pihak ketiga jahat melakukan *cross-site request forgery* menggunakan kredensial sesi operator. Jangan gunakan wildcard `*` saat *credentials* diizinkan. |
| **`Access-Control-Allow-Methods`** | `GET, POST, PUT, PATCH, DELETE, OPTIONS` | Membatasi jenis metode HTTP sesuai operasi REST API yang sah. |
| **`Access-Control-Allow-Headers`** | `Authorization, Content-Type, Accept` | Hanya mengizinkan header yang diperlukan untuk transmisi JSON dan Bearer JWT token. |
| **`Access-Control-Allow-Credentials`** | `true` | Memungkinkan pengiriman kredensial otentikasi aman. |

---

## 2. Penegakan HTTPS (Enforced TLS Encryption)

1. **Vercel Edge Network:**
   - Semua traffic HTTP (port 80) secara otomatis dialihkan secara permanen (HTTP 308) ke HTTPS (port 443).
   - Sertifikat SSL/TLS diterbitkan dan diperbarui otomatis via Let's Encrypt / DigiCert.
2. **HTTP Strict Transport Security (HSTS):**
   - Dikonfigurasikan melalui `vercel.json`:
     ```text
     Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
     ```
   - Memerintahkan peramban web pengguna untuk selalu menggunakan protokol HTTPS selama 2 tahun ke depan dan menolak sambungan HTTP yang tidak aman.

---

## 3. OWASP Security Response Headers

Header berikut disematkan pada setiap respon yang keluar dari Vercel:

| Header | Nilai | Fungsi Perlindungan |
| :--- | :--- | :--- |
| **`X-Content-Type-Options`** | `nosniff` | Mencegah browser melakukan *MIME-sniffing* yang dapat mengeksekusi payload jahat berkedok teks/gambar. |
| **`X-Frame-Options`** | `SAMEORIGIN` | Mencegah serangan *Clickjacking* dengan melarang embedding aplikasi di dalam iframe luar. |
| **`X-XSS-Protection`** | `1; mode=block` | Mengaktifkan filter XSS bawaan browser jika deteksi reflektif terjadi. |
| **`Referrer-Policy`** | `strict-origin-when-cross-origin` | Melindungi kebocoran path URL sensitif (seperti ID insiden/token) ke domain luar. |
| **`Permissions-Policy`** | `camera=(self), microphone=(), geolocation=(self)` | Membatasi API perangkat keras browser hanya untuk fitur geolokasi kamera dan pemetaan yang sah. |

