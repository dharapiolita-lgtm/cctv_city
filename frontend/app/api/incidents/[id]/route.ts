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
      i.id, i.event_id, i.jenis, i.keparahan, i.status, i.lokasi, i.deskripsi,
      i.dibuat_oleh, u1.nama as pembuat_nama,
      i.ditugaskan_ke, u2.nama as petugas_nama,
      i.dibuat_pada, i.selesai_pada, i.updated_at,
      e.camera_id, c.nama as camera_nama, e.snapshot_path, e.clip_path, e.waktu_deteksi
    FROM incidents i
    JOIN users u1 ON i.dibuat_oleh = u1.id
    LEFT JOIN users u2 ON i.ditugaskan_ke = u2.id
    JOIN detection_events e ON i.event_id = e.id
    JOIN cameras c ON e.camera_id = c.id
    WHERE i.id = $1
  `;

  const incidentResult = await pool.query(query, [params.id]);
  if (incidentResult.rows.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Insiden tidak ditemukan.' } }, { status: 404 });
  }

  const incident = incidentResult.rows[0];

  // Petugas hanya boleh lihat yang ditugaskan ke dirinya
  if (authUser.role === 'petugas' && incident.ditugaskan_ke !== authUser.sub) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Anda tidak memiliki izin melihat insiden ini.' } }, { status: 403 });
  }

  const updatesQuery = `
    SELECT 
      u.id, u.incident_id, u.status_lama, u.status_baru, u.catatan,
      u.oleh, usr.nama as oleh_nama, usr.role as oleh_role, u.waktu
    FROM incident_updates u
    JOIN users usr ON u.oleh = usr.id
    WHERE u.incident_id = $1
    ORDER BY u.waktu ASC
  `;

  const updatesResult = await pool.query(updatesQuery, [params.id]);

  return NextResponse.json({
    incident,
    updates: updatesResult.rows,
  });
}

