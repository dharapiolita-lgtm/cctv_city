-- ==============================================================================
-- WATERWATCH V3 SECURE — CLOUD POSTGRESQL MIGRATION & SEED SCRIPT
-- Compatible with Neon Serverless PostgreSQL and Supabase Database
-- ==============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'operator', 'petugas', 'pimpinan')),
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CAMERAS TABLE
CREATE TABLE IF NOT EXISTS cameras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) NOT NULL,
    lokasi_lat DOUBLE PRECISION NOT NULL,
    lokasi_lng DOUBLE PRECISION NOT NULL,
    alamat TEXT NOT NULL,
    sumber_stream TEXT,
    sample_video_path TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'nonaktif')),
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DETECTION EVENTS TABLE
CREATE TABLE IF NOT EXISTS detection_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
    jenis VARCHAR(100) NOT NULL CHECK (jenis IN ('suspicious_activity', 'crowd', 'accident', 'fire')),
    skor NUMERIC(4,3) NOT NULL CHECK (skor >= 0 AND skor <= 1),
    waktu_deteksi TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    snapshot_path TEXT,
    clip_path TEXT,
    validasi VARCHAR(50) CHECK (validasi IN ('valid', 'false_alarm')),
    divalidasi_oleh UUID REFERENCES users(id),
    divalidasi_pada TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID UNIQUE NOT NULL REFERENCES detection_events(id) ON DELETE RESTRICT,
    jenis VARCHAR(100) NOT NULL,
    keparahan VARCHAR(50) NOT NULL CHECK (keparahan IN ('rendah', 'sedang', 'tinggi')),
    status VARCHAR(50) NOT NULL DEFAULT 'baru' CHECK (status IN ('baru', 'ditugaskan', 'diterima', 'di_lokasi', 'selesai', 'ditutup')),
    lokasi TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    dibuat_oleh UUID NOT NULL REFERENCES users(id),
    ditugaskan_ke UUID REFERENCES users(id),
    dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    selesai_pada TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. INCIDENT UPDATES (TIMELINE AUDIT) TABLE
CREATE TABLE IF NOT EXISTS incident_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    status_lama VARCHAR(50),
    status_baru VARCHAR(50) NOT NULL,
    catatan TEXT NOT NULL,
    oleh UUID NOT NULL REFERENCES users(id),
    waktu TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. AUDIT LOGS (IMMUTABLE INSERT-ONLY) TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    aksi VARCHAR(100) NOT NULL,
    objek_tipe VARCHAR(100) NOT NULL,
    objek_id UUID,
    ip VARCHAR(50),
    waktu TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detail JSONB DEFAULT '{}'::jsonb
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_cameras_status ON cameras(status);
CREATE INDEX IF NOT EXISTS idx_events_camera_waktu ON detection_events(camera_id, waktu_deteksi DESC);
CREATE INDEX IF NOT EXISTS idx_events_validasi ON detection_events(validasi);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_petugas ON incidents(ditugaskan_ke);
CREATE INDEX IF NOT EXISTS idx_incident_updates_inc ON incident_updates(incident_id, waktu ASC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_waktu ON audit_logs(waktu DESC);

-- ==============================================================================
-- INITIAL SEED DATA (Kredensial Default Semua Akun: password123)
-- Password Hash: Argon2id ($argon2id$v=19$m=65536,t=3,p=4$...)
-- ==============================================================================

INSERT INTO users (id, nama, username, email, password_hash, role, aktif, created_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Hendra Setiawan, S.T.', 'admin', 'admin@keamanankota.go.id', '$argon2id$v=19$m=65536,t=3,p=4$lUe8wZ31s+v1Z2vGzP8a9A$3Y+G9zX8bQ0yA5m+7wK6t1j8U5l2P0m9k8J7h6G5f4E', 'admin', TRUE, NOW()),
    ('22222222-2222-2222-2222-222222222222', 'Rian Pratama', 'operator', 'operator@keamanankota.go.id', '$argon2id$v=19$m=65536,t=3,p=4$lUe8wZ31s+v1Z2vGzP8a9A$3Y+G9zX8bQ0yA5m+7wK6t1j8U5l2P0m9k8J7h6G5f4E', 'operator', TRUE, NOW()),
    ('33333333-3333-3333-3333-333333333333', 'Bripka Ahmad Fauzi', 'petugas1', 'ahmad.fauzi@polres.go.id', '$argon2id$v=19$m=65536,t=3,p=4$lUe8wZ31s+v1Z2vGzP8a9A$3Y+G9zX8bQ0yA5m+7wK6t1j8U5l2P0m9k8J7h6G5f4E', 'petugas', TRUE, NOW()),
    ('44444444-4444-4444-4444-444444444444', 'Bripda Dimas Permana', 'petugas2', 'dimas.permana@polres.go.id', '$argon2id$v=19$m=65536,t=3,p=4$lUe8wZ31s+v1Z2vGzP8a9A$3Y+G9zX8bQ0yA5m+7wK6t1j8U5l2P0m9k8J7h6G5f4E', 'petugas', TRUE, NOW()),
    ('55555555-5555-5555-5555-555555555555', 'Dr. Ir. Gunawan, M.T.', 'pimpinan', 'pimpinan@kotacerdas.go.id', '$argon2id$v=19$m=65536,t=3,p=4$lUe8wZ31s+v1Z2vGzP8a9A$3Y+G9zX8bQ0yA5m+7wK6t1j8U5l2P0m9k8J7h6G5f4E', 'pimpinan', TRUE, NOW())
ON CONFLICT (username) DO NOTHING;

-- Seed Sample Cameras
INSERT INTO cameras (id, nama, lokasi_lat, lokasi_lng, alamat, sumber_stream, sample_video_path, status, last_seen_at)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CCTV 01 - Simpang Tugu Juang', -5.4168, 105.2585, 'Jl. Raden Intan No. 1, Simpang Tugu Juang', 'rtsp://demo.stream/cam01', '/demo/cctv1.mp4', 'online', NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CCTV 02 - Depan Pasar Bambu Kuning', -5.4215, 105.2530, 'Jl. Imam Bonjol, Kawasan Pasar Bambu Kuning', 'rtsp://demo.stream/cam02', '/demo/cctv2.mp4', 'online', NOW()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'CCTV 03 - Gerbang Pemda Kota', -5.4290, 105.2612, 'Jl. Dr. Susilo No. 2, Kompleks Kantor Walikota', 'rtsp://demo.stream/cam03', '/demo/cctv3.mp4', 'online', NOW()),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'CCTV 04 - Terminal Rajabasa', -5.3712, 105.2415, 'Jl. ZA. Pagar Alam, Terminal Tipe A Rajabasa', 'rtsp://demo.stream/cam04', '/demo/cctv4.mp4', 'online', NOW()),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'CCTV 05 - Bundaran Gajah Utama', -5.4245, 105.2570, 'Jl. Jenderal Sudirman, Bundaran Adipura Gajah', 'rtsp://demo.stream/cam05', '/demo/cctv5.mp4', 'online', NOW()),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'CCTV 06 - Flyover Mall Boemi Kedaton', -5.3812, 105.2601, 'Jl. Teuku Umar, Flyover MBK', 'rtsp://demo.stream/cam06', '/demo/cctv6.mp4', 'offline', NOW() - INTERVAL '3 hours'),
    ('99999999-9999-9999-9999-999999999999', 'CCTV 07 - Pos Pantau Pelabuhan Panjang', -5.4715, 105.3120, 'Kawasan Pelabuhan Panjang', NULL, NULL, 'nonaktif', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

