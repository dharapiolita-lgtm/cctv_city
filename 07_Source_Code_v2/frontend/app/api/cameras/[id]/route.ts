import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, requireRole, logAudit } from '@/lib/server-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Otorisasi diperlukan.' } }, { status: 401 });
  }

  const result = await pool.query('SELECT * FROM cameras WHERE id = $1', [params.id]);
  if (result.rows.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Kamera tidak ditemukan.' } }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req);
  const roleCheck = requireRole(authUser, ['admin']);
  if (roleCheck.error) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: roleCheck.error } }, { status: roleCheck.status });
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const body = await req.json();

  const existingResult = await pool.query('SELECT * FROM cameras WHERE id = $1', [params.id]);
  if (existingResult.rows.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Kamera tidak ditemukan.' } }, { status: 404 });
  }
  const existing = existingResult.rows[0];

  const nama = body.nama ?? existing.nama;
  const lokasi_lat = body.lokasi_lat ?? existing.lokasi_lat;
  const lokasi_lng = body.lokasi_lng ?? existing.lokasi_lng;
  const alamat = body.alamat ?? existing.alamat;
  const sumber_stream = body.sumber_stream ?? existing.sumber_stream;
  const sample_video_path = body.sample_video_path ?? existing.sample_video_path;
  const status = body.status ?? existing.status;

  if (!['online', 'offline', 'nonaktif'].includes(status)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Status kamera tidak valid.' } },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `UPDATE cameras
     SET nama = $1, lokasi_lat = $2, lokasi_lng = $3, alamat = $4, sumber_stream = $5, sample_video_path = $6, status = $7, updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [nama, lokasi_lat, lokasi_lng, alamat, sumber_stream, sample_video_path, status, params.id]
  );

  const updated = result.rows[0];
  await logAudit(authUser!.sub, 'UPDATE_CAMERA', 'camera', params.id, ip, {
    nama: updated.nama,
    status: updated.status,
  });

  return NextResponse.json(updated);
}

