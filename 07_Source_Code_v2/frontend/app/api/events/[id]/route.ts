import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser } from '@/lib/server-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Otorisasi diperlukan.' } }, { status: 401 });
  }

  const query = `
    SELECT 
      e.id, e.camera_id, c.nama as camera_nama, c.alamat as camera_alamat,
      c.lokasi_lat as camera_lokasi_lat, c.lokasi_lng as camera_lokasi_lng,
      e.jenis, e.skor::float8 as skor, e.waktu_deteksi, e.snapshot_path, e.clip_path,
      e.validasi, e.divalidasi_oleh, u.nama as validator_nama, e.divalidasi_pada,
      (i.id IS NOT NULL) as has_incident, i.id as incident_id, e.created_at
    FROM detection_events e
    JOIN cameras c ON e.camera_id = c.id
    LEFT JOIN users u ON e.divalidasi_oleh = u.id
    LEFT JOIN incidents i ON e.id = i.event_id
    WHERE e.id = $1
  `;

  const result = await pool.query(query, [params.id]);
  if (result.rows.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event deteksi tidak ditemukan.' } }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

