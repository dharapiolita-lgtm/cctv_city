-- SEED DATA FOR WATERWATCH DEMO ENVIRONMENT

-- 1. USERS (password for all demo accounts: 'password123')
INSERT INTO users (id, nama, username, email, password_hash, role, aktif, created_at, updated_at)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Administrator Command Center', 'admin', 'admin@waterwatch.go.id', '$argon2id$v=19$m=65536,t=3,p=4$Gzor5FH8ToDTPyikzCUBwQ$8g0r2eMngtMNxe7Kca+JM3zjlFgnez6T/CsyfwMZZMw', 'admin', true, NOW() - INTERVAL '30 days', NOW()),
    ('a0000000-0000-0000-0000-000000000002', 'Rina Oktaviani', 'operator', 'rina.operator@waterwatch.go.id', '$argon2id$v=19$m=65536,t=3,p=4$Gzor5FH8ToDTPyikzCUBwQ$8g0r2eMngtMNxe7Kca+JM3zjlFgnez6T/CsyfwMZZMw', 'operator', true, NOW() - INTERVAL '30 days', NOW()),
    ('a0000000-0000-0000-0000-000000000003', 'Budi Santoso', 'petugas1', 'budi.petugas@waterwatch.go.id', '$argon2id$v=19$m=65536,t=3,p=4$Gzor5FH8ToDTPyikzCUBwQ$8g0r2eMngtMNxe7Kca+JM3zjlFgnez6T/CsyfwMZZMw', 'petugas', true, NOW() - INTERVAL '30 days', NOW()),
    ('a0000000-0000-0000-0000-000000000004', 'Agus Pratama', 'petugas2', 'agus.petugas@waterwatch.go.id', '$argon2id$v=19$m=65536,t=3,p=4$Gzor5FH8ToDTPyikzCUBwQ$8g0r2eMngtMNxe7Kca+JM3zjlFgnez6T/CsyfwMZZMw', 'petugas', true, NOW() - INTERVAL '30 days', NOW()),
    ('a0000000-0000-0000-0000-000000000005', 'Dr. Hendra Wijaya, M.Si', 'pimpinan', 'hendra.pimpinan@waterwatch.go.id', '$argon2id$v=19$m=65536,t=3,p=4$Gzor5FH8ToDTPyikzCUBwQ$8g0r2eMngtMNxe7Kca+JM3zjlFgnez6T/CsyfwMZZMw', 'pimpinan', true, NOW() - INTERVAL '30 days', NOW())
ON CONFLICT (username) DO NOTHING;

-- 2. CAMERAS
INSERT INTO cameras (id, nama, lokasi_lat, lokasi_lng, alamat, sumber_stream, sample_video_path, status, last_seen_at, created_at, updated_at)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'CCTV-01 Simpang Tugu Adipura', -5.4265, 105.2582, 'Jl. Raden Intan No. 1, Enggal, Bandar Lampung', 'rtsp://demo-stream/cctv01', '/demo/cctv1.mp4', 'online', NOW(), NOW() - INTERVAL '15 days', NOW()),
    ('c0000000-0000-0000-0000-000000000002', 'CCTV-02 Kawasan Pasar Bambu Kuning', -5.4128, 105.2536, 'Jl. Imam Bonjol No. 12, Tanjung Karang Pusat', 'rtsp://demo-stream/cctv02', '/demo/cctv2.mp4', 'online', NOW(), NOW() - INTERVAL '15 days', NOW()),
    ('c0000000-0000-0000-0000-000000000003', 'CCTV-03 Perempatan Way Halim Sultan Agung', -5.3905, 105.2711, 'Jl. Sultan Agung No. 45, Way Halim', 'rtsp://demo-stream/cctv03', '/demo/cctv3.mp4', 'online', NOW(), NOW() - INTERVAL '15 days', NOW()),
    ('c0000000-0000-0000-0000-000000000004', 'CCTV-04 Kawasan Wisata Teluk Lampung', -5.4521, 105.2743, 'Jl. Yos Sudarso No. 88, Teluk Betung Selatan', 'rtsp://demo-stream/cctv04', '/demo/cctv4.mp4', 'online', NOW(), NOW() - INTERVAL '15 days', NOW()),
    ('c0000000-0000-0000-0000-000000000005', 'CCTV-05 Simpang Unila / Rajabasa', -5.3619, 105.2447, 'Jl. Prof. Dr. Sumantri Brojonegoro No. 1, Rajabasa', 'rtsp://demo-stream/cctv05', '/demo/cctv5.mp4', 'online', NOW(), NOW() - INTERVAL '15 days', NOW()),
    ('c0000000-0000-0000-0000-000000000006', 'CCTV-06 Jembatan Kali Akar Teluk Betung', -5.4389, 105.2614, 'Jl. WR Supratman, Teluk Betung Utara', 'rtsp://demo-stream/cctv06', '/demo/cctv6.mp4', 'offline', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '15 days', NOW()),
    ('c0000000-0000-0000-0000-000000000007', 'CCTV-07 Koridor Kantor Gubernur Lampung', -5.4312, 105.2635, 'Jl. Wolter Monginsidi No. 69, Teluk Betung', 'rtsp://demo-stream/cctv07', '/demo/cctv7.mp4', 'nonaktif', NULL, NOW() - INTERVAL '15 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. DETECTION EVENTS (SIMULASI)
INSERT INTO detection_events (id, camera_id, jenis, skor, waktu_deteksi, snapshot_path, clip_path, validasi, divalidasi_oleh, divalidasi_pada, created_at)
VALUES
    -- Event 1: Valid & Converted to Incident
    ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'accident', 0.945, NOW() - INTERVAL '45 minutes', '/demo/snapshots/accident_1.jpg', '/demo/clips/accident_1.mp4', 'valid', 'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '45 minutes'),
    -- Event 2: Valid & Converted to Incident
    ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'crowd', 0.880, NOW() - INTERVAL '2 hours', '/demo/snapshots/crowd_1.jpg', '/demo/clips/crowd_1.mp4', 'valid', 'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '110 minutes', NOW() - INTERVAL '2 hours'),
    -- Event 3: False Alarm
    ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'suspicious_activity', 0.650, NOW() - INTERVAL '3 hours', '/demo/snapshots/suspicious_1.jpg', NULL, 'false_alarm', 'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '170 minutes', NOW() - INTERVAL '3 hours'),
    -- Event 4: Menunggu Validasi (Baru saja terjadi)
    ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'suspicious_activity', 0.825, NOW() - INTERVAL '12 minutes', '/demo/snapshots/suspicious_2.jpg', '/demo/clips/suspicious_2.mp4', NULL, NULL, NULL, NOW() - INTERVAL '12 minutes'),
    -- Event 5: Menunggu Validasi
    ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'fire', 0.910, NOW() - INTERVAL '5 minutes', '/demo/snapshots/fire_1.jpg', '/demo/clips/fire_1.mp4', NULL, NULL, NULL, NOW() - INTERVAL '5 minutes')
ON CONFLICT (id) DO NOTHING;

-- 4. INCIDENTS
INSERT INTO incidents (id, event_id, jenis, keparahan, status, lokasi, deskripsi, dibuat_oleh, ditugaskan_ke, dibuat_pada, selesai_pada, updated_at)
VALUES
    -- Insiden 1: Ditugaskan ke Petugas 1 (Budi)
    ('11111111-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Kecelakaan Lalu Lintas', 'tinggi', 'di_lokasi', 'Jl. Raden Intan No. 1, Simpang Tugu Adipura, Enggal', '[SIMULASI] Tabrakan dua kendaraan bermotor di lampu merah arah Rajabasa. Dibutuhkan evakuasi cepat dan penguraian kemacetan.', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '38 minutes', NULL, NOW() - INTERVAL '10 minutes'),
    -- Insiden 2: Ditutup / Selesai
    ('11111111-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'Kerumunan Tidak Berizin', 'sedang', 'ditutup', 'Jl. Imam Bonjol No. 12, Area Parkir Bambu Kuning', '[SIMULASI] Kerumunan massa di depan ruko berpotensi menghalangi jalan utama. Petugas berhasil mengimbau warga membubarkan diri secara tertib.', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '105 minutes', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '20 minutes')
ON CONFLICT (id) DO NOTHING;

-- 5. INCIDENT UPDATES (TIMELINE)
INSERT INTO incident_updates (id, incident_id, status_lama, status_baru, catatan, oleh, waktu)
VALUES
    -- Updates for Incident 1
    ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'baru', 'ditugaskan', 'Insiden dibuat dari Event deteksi kecelakaan dan ditugaskan ke Petugas Budi Santoso.', 'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '38 minutes'),
    ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'ditugaskan', 'diterima', 'Laporan penugasan diterima oleh petugas lapangan, bersiap meluncur ke lokasi.', 'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '30 minutes'),
    ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'diterima', 'di_lokasi', 'Petugas telah tiba di Tugu Adipura, mengamankan jalur dan berkoordinasi dengan tim medis.', 'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '10 minutes'),

    -- Updates for Incident 2
    ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002', 'baru', 'ditugaskan', 'Penugasan patroli ketertiban umum ke Petugas Agus Pratama.', 'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '105 minutes'),
    ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002', 'ditugaskan', 'diterima', 'Tugas diterima, segera merapat ke lokasi Bambu Kuning.', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '95 minutes'),
    ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000002', 'diterima', 'di_lokasi', 'Petugas di lokasi, melakukan pendekatan persuasif dengan koordinator.', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '60 minutes'),
    ('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000002', 'di_lokasi', 'selesai', 'Kawasan telah steril dan lalu lintas kembali lancar.', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '30 minutes'),
    ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000002', 'selesai', 'ditutup', 'Verifikasi penanganan selesai oleh Operator Command Center. Tiket resmi ditutup.', 'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '20 minutes')
ON CONFLICT (id) DO NOTHING;

-- 6. AUDIT LOGS
INSERT INTO audit_logs (id, user_id, aksi, objek_tipe, objek_id, ip, waktu, detail)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'LOGIN_SUCCESS', 'user', 'a0000000-0000-0000-0000-000000000001', '127.0.0.1', NOW() - INTERVAL '4 hours', '{"keterangan": "Login admin berhasil"}'::jsonb),
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'VALIDASI_EVENT', 'detection_event', 'e0000000-0000-0000-0000-000000000001', '127.0.0.1', NOW() - INTERVAL '40 minutes', '{"validasi": "valid", "jenis": "accident"}'::jsonb),
    ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'CREATE_INCIDENT', 'incident', '11111111-0000-0000-0000-000000000001', '127.0.0.1', NOW() - INTERVAL '38 minutes', '{"keparahan": "tinggi", "petugas": "petugas1"}'::jsonb),
    ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 'UPDATE_INCIDENT_STATUS', 'incident', '11111111-0000-0000-0000-000000000001', '127.0.0.1', NOW() - INTERVAL '10 minutes', '{"status_lama": "diterima", "status_baru": "di_lokasi"}'::jsonb),
    ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'CLOSE_INCIDENT', 'incident', '11111111-0000-0000-0000-000000000002', '127.0.0.1', NOW() - INTERVAL '20 minutes', '{"status": "ditutup"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
