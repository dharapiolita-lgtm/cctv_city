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
  const keparahan = searchParams.get('keparahan');
  const petugas_id = searchParams.get('petugas_id');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const per_page = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));
  const offset = (page - 1) * per_page;

  let query = `
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
    WHERE 1=1
  `;

  let countQuery = 'SELECT COUNT(*) FROM incidents i WHERE 1=1';
  const params: any[] = [];

  // PRD RULE: Petugas hanya dapat melihat insiden yang ditugaskan kepadanya
  if (authUser.role === 'petugas') {
    params.push(authUser.sub);
    query += ` AND i.ditugaskan_ke = $${params.length}`;
    countQuery += ` AND i.ditugaskan_ke = $${params.length}`;
  } else if (petugas_id) {
    params.push(petugas_id);
    query += ` AND i.ditugaskan_ke = $${params.length}`;
    countQuery += ` AND i.ditugaskan_ke = $${params.length}`;
  }

  if (status && status !== 'all') {
    params.push(status);
    query += ` AND i.status = $${params.length}`;
    countQuery += ` AND i.status = $${params.length}`;
  }

  if (keparahan && keparahan !== 'all') {
    params.push(keparahan);
    query += ` AND i.keparahan = $${params.length}`;
    countQuery += ` AND i.keparahan = $${params.length}`;
  }

  query += ` ORDER BY i.dibuat_pada DESC LIMIT ${per_page} OFFSET ${offset}`;

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
  const roleCheck = requireRole(authUser, ['admin', 'operator']);
  if (roleCheck.error) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: roleCheck.error } }, { status: roleCheck.status });
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const body = await req.json();

  if (!body.event_id || !body.jenis || !body.lokasi || !body.deskripsi) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Event ID, jenis insiden, lokasi, dan deskripsi wajib diisi.' } },
      { status: 400 }
    );
  }

  const keparahan = (body.keparahan || 'sedang').toLowerCase();
  if (!['rendah', 'sedang', 'tinggi'].includes(keparahan)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: "Tingkat keparahan harus 'rendah', 'sedang', atau 'tinggi'." } },
      { status: 400 }
    );
  }

  // 1. Validasi Event
  const eventResult = await pool.query('SELECT id, validasi FROM detection_events WHERE id = $1', [body.event_id]);
  if (eventResult.rows.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event deteksi sumber tidak ditemukan.' } }, { status: 404 });
  }

  const event = eventResult.rows[0];
  if (event.validasi !== 'valid') {
    return NextResponse.json(
      {
        error: {
          code: 'BAD_REQUEST',
          message: event.validasi === 'false_alarm'
            ? 'Event false alarm tidak dapat dikonversi menjadi insiden.'
            : 'Event harus divalidasi terlebih dahulu sebagai VALID sebelum dibuatkan insiden.',
        },
      },
      { status: 400 }
    );
  }

  // 2. PRD RULE: Satu event hanya dapat menghasilkan satu insiden
  const existingIncident = await pool.query('SELECT id FROM incidents WHERE event_id = $1', [body.event_id]);
  if (existingIncident.rows.length > 0) {
    return NextResponse.json(
      { error: { code: 'CONFLICT', message: 'Event ini sudah memiliki insiden yang terdaftar.' } },
      { status: 409 }
    );
  }

  const initialStatus = body.ditugaskan_ke ? 'ditugaskan' : 'baru';

  // 3. ATOMIC TRANSACTION
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const incidentResult = await client.query(
      `INSERT INTO incidents (id, event_id, jenis, keparahan, status, lokasi, deskripsi, dibuat_oleh, ditugaskan_ke, dibuat_pada, selesai_pada, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NULL, NOW())
       RETURNING *`,
      [
        body.event_id,
        body.jenis.trim(),
        keparahan,
        initialStatus,
        body.lokasi.trim(),
        body.deskripsi.trim(),
        authUser!.sub,
        body.ditugaskan_ke || null,
      ]
    );

    const incident = incidentResult.rows[0];

    const note = body.ditugaskan_ke
      ? 'Insiden dibuat dari Event terverifikasi dan langsung ditugaskan ke petugas lapangan.'
      : 'Insiden baru dibuat dari Event deteksi terverifikasi.';

    await client.query(
      `INSERT INTO incident_updates (id, incident_id, status_lama, status_baru, catatan, oleh, waktu)
       VALUES (gen_random_uuid(), $1, NULL, $2, $3, $4, NOW())`,
      [incident.id, initialStatus, note, authUser!.sub]
    );

    await client.query('COMMIT');

    await logAudit(authUser!.sub, 'CREATE_INCIDENT', 'incident', incident.id, ip, {
      jenis: incident.jenis,
      keparahan: incident.keparahan,
      status: incident.status,
      event_id: incident.event_id,
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error create incident:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Gagal membuat insiden.' } }, { status: 500 });
  } finally {
    client.release();
  }
}

