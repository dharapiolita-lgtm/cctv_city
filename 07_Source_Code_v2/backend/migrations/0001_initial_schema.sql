-- Extension for UUID generation if needed
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

-- 5. INCIDENT UPDATES TABLE
CREATE TABLE IF NOT EXISTS incident_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    status_lama VARCHAR(50),
    status_baru VARCHAR(50) NOT NULL,
    catatan TEXT NOT NULL,
    oleh UUID NOT NULL REFERENCES users(id),
    waktu TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    aksi VARCHAR(100) NOT NULL,
    objek_tipe VARCHAR(100) NOT NULL,
    objek_id UUID,
    ip VARCHAR(100),
    waktu TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detail JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_cameras_status ON cameras(status);
CREATE INDEX IF NOT EXISTS idx_detection_events_camera_id ON detection_events(camera_id);
CREATE INDEX IF NOT EXISTS idx_detection_events_waktu_deteksi ON detection_events(waktu_deteksi DESC);
CREATE INDEX IF NOT EXISTS idx_detection_events_validasi ON detection_events(validasi);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_ditugaskan_ke ON incidents(ditugaskan_ke);
CREATE INDEX IF NOT EXISTS idx_incidents_dibuat_pada ON incidents(dibuat_pada DESC);
CREATE INDEX IF NOT EXISTS idx_incident_updates_incident_id ON incident_updates(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_updates_waktu ON incident_updates(waktu ASC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_waktu ON audit_logs(waktu DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_aksi ON audit_logs(aksi);

