import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, requireRole } from '@/lib/server-auth';

export async function POST(req: Request) {
  const authUser = await getAuthUser(req);
  const roleCheck = requireRole(authUser, ['admin', 'operator']);
  if (roleCheck.error) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: roleCheck.error } }, { status: roleCheck.status });
  }

  // 1. Ambil kamera online saja
  const cameraResult = await pool.query(
    "SELECT id, nama, alamat FROM cameras WHERE status = 'online' ORDER BY RANDOM() LIMIT 1"
  );

  if (cameraResult.rows.length === 0) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Tidak ada kamera yang berstatus ONLINE untuk simulasi event.' } },
      { status: 400 }
    );
  }

  const camera = cameraResult.rows[0];
  const eventTypes = ['suspicious_activity', 'crowd', 'accident', 'fire'];
  const jenis = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const skor = (Math.floor(Math.random() * 350) + 630) / 1000.0; // 0.630 - 0.980

  const snapshot_path = `/demo/snapshots/${jenis}_1.jpg`;
  const clip_path = `/demo/clips/${jenis}_1.mp4`;

  const insertResult = await pool.query(
    `INSERT INTO detection_events (id, camera_id, jenis, skor, waktu_deteksi, snapshot_path, clip_path, validasi, divalidasi_oleh, divalidasi_pada, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, NOW(), $4, $5, NULL, NULL, NULL, NOW())
     RETURNING id, camera_id, jenis, skor, waktu_deteksi, snapshot_path, clip_path`,
    [camera.id, jenis, skor, snapshot_path, clip_path]
  );

  const newEvent = insertResult.rows[0];

  return NextResponse.json({
    message: 'Event deteksi simulasi baru berhasil dibuat.',
    event: {
      ...newEvent,
      camera_nama: camera.nama,
    },
  });
}

