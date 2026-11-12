import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, requireRole, logAudit } from '@/lib/server-auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req);
  const roleCheck = requireRole(authUser, ['admin', 'operator']);
  if (roleCheck.error) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: roleCheck.error } }, { status: roleCheck.status });
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const body = await req.json();

  if (!body.ditugaskan_ke) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Petugas tujuan wajib dipilih.' } }, { status: 400 });
  }

  const targetUserResult = await pool.query('SELECT id, nama, role FROM users WHERE id = $1 AND aktif = true', [
    body.ditugaskan_ke,
  ]);
  if (targetUserResult.rows.length === 0) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Petugas yang dipilih tidak ditemukan atau nonaktif.' } },
      { status: 404 }
    );
  }
  const targetUser = targetUserResult.rows[0];

  const incidentResult = await pool.query('SELECT * FROM incidents WHERE id = $1', [params.id]);
  if (incidentResult.rows.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Insiden tidak ditemukan.' } }, { status: 404 });
  }
  const incident = incidentResult.rows[0];

  if (incident.status === 'ditutup') {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Insiden yang telah ditutup tidak dapat ditugaskan ulang.' } },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateResult = await client.query(
      `UPDATE incidents SET ditugaskan_ke = $1, status = 'ditugaskan', updated_at = NOW() WHERE id = $2 RETURNING *`,
      [body.ditugaskan_ke, params.id]
    );
    const updated = updateResult.rows[0];

    const note = body.catatan || `Penugasan insiden kepada petugas: ${targetUser.nama}.`;

    await client.query(
      `INSERT INTO incident_updates (id, incident_id, status_lama, status_baru, catatan, oleh, waktu)
       VALUES (gen_random_uuid(), $1, $2, 'ditugaskan', $3, $4, NOW())`,
      [params.id, incident.status, note, authUser!.sub]
    );

    await client.query('COMMIT');

    await logAudit(authUser!.sub, 'ASSIGN_INCIDENT', 'incident', params.id, ip, {
      ditugaskan_ke: body.ditugaskan_ke,
      petugas_nama: targetUser.nama,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error assigning incident:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Gagal menugaskan insiden.' } }, { status: 500 });
  } finally {
    client.release();
  }
}

