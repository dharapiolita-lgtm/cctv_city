import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, requireRole, logAudit } from '@/lib/server-auth';

export async function GET(req: Request) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Otorisasi diperlukan.' } }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const q = searchParams.get('q');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const per_page = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));
  const offset = (page - 1) * per_page;

  let query = 'SELECT * FROM cameras WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) FROM cameras WHERE 1=1';
  const params: any[] = [];

  if (status && status !== 'all') {
    params.push(status);
    query += ` AND status = $${params.length}`;
    countQuery += ` AND status = $${params.length}`;
  }

  if (q && q.trim()) {
    params.push(`%${q.trim()}%`);
    query += ` AND (nama ILIKE $${params.length} OR alamat ILIKE $${params.length})`;
    countQuery += ` AND (nama ILIKE $${params.length} OR alamat ILIKE $${params.length})`;
  }

  query += ` ORDER BY nama ASC LIMIT ${per_page} OFFSET ${offset}`;

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

export async function POST(req: Request) {
  const authUser = await getAuthUser(req);
  const roleCheck = requireRole(authUser, ['admin']);
  if (roleCheck.error) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: roleCheck.error } }, { status: roleCheck.status });
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const body = await req.json();

  if (!body.nama || !body.alamat) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Nama kamera dan alamat lokasi wajib diisi.' } },
      { status: 400 }
    );
  }

  const status = body.status || 'online';
  if (!['online', 'offline', 'nonaktif'].includes(status)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Status kamera harus: online, offline, atau nonaktif.' } },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `INSERT INTO cameras (id, nama, lokasi_lat, lokasi_lng, alamat, sumber_stream, sample_video_path, status, last_seen_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())
     RETURNING *`,
    [
      body.nama.trim(),
      body.lokasi_lat || -5.4265,
      body.lokasi_lng || 105.2582,
      body.alamat.trim(),
      body.sumber_stream || null,
      body.sample_video_path || '/demo/cctv1.mp4',
      status,
    ]
  );

  const camera = result.rows[0];
  await logAudit(authUser!.sub, 'CREATE_CAMERA', 'camera', camera.id, ip, {
    nama: camera.nama,
    status: camera.status,
  });

  return NextResponse.json(camera, { status: 201 });
}

