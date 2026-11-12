import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser } from '@/lib/server-auth';

export async function GET(req: Request) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Otorisasi diperlukan.' } }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const validasi = searchParams.get('validasi');
  const jenis = searchParams.get('jenis');
  const camera_id = searchParams.get('camera_id');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const per_page = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));
  const offset = (page - 1) * per_page;

  let query = `
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
    WHERE 1=1
  `;

  let countQuery = `
    SELECT COUNT(*) FROM detection_events e WHERE 1=1
  `;

  const params: any[] = [];

  if (validasi) {
    if (validasi === 'pending' || validasi === 'menunggu') {
      query += ' AND e.validasi IS NULL';
      countQuery += ' AND e.validasi IS NULL';
    } else if (validasi === 'valid' || validasi === 'false_alarm') {
      params.push(validasi);
      query += ` AND e.validasi = $${params.length}`;
      countQuery += ` AND e.validasi = $${params.length}`;
    }
  }

  if (jenis && jenis !== 'all') {
    params.push(jenis);
    query += ` AND e.jenis = $${params.length}`;
    countQuery += ` AND e.jenis = $${params.length}`;
  }

  if (camera_id) {
    params.push(camera_id);
    query += ` AND e.camera_id = $${params.length}`;
    countQuery += ` AND e.camera_id = $${params.length}`;
  }

  query += ` ORDER BY e.waktu_deteksi DESC LIMIT ${per_page} OFFSET ${offset}`;

  const [dataResult, countResult] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, params),
  ]);

  return NextResponse.json({
    data: dataResult.rows,
    meta: {
      page,
      per_page,
      total: parseInt(countResult.rows[0].count, 10),
    },
  });
}

