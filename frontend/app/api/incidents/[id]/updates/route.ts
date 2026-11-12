import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, logAudit } from '@/lib/server-auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Otorisasi diperlukan.' } }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const body = await req.json();
  const catatan = (body.catatan || '').trim();

  if (!catatan) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Catatan tidak boleh kosong.' } }, { status: 400 });
  }

  const incidentResult = await pool.query('SELECT id, status, ditugaskan_ke FROM incidents WHERE id = $1', [params.id]);
  if (incidentResult.rows.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Insiden tidak ditemukan.' } }, { status: 404 });
  }
  const incident = incidentResult.rows[0];

  if (authUser.role === 'petugas' && incident.ditugaskan_ke !== authUser.sub) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Anda tidak memiliki akses ke insiden ini.' } }, { status: 403 });
  }

  await pool.query(
    `INSERT INTO incident_updates (id, incident_id, status_lama, status_baru, catatan, oleh, waktu)
     VALUES (gen_random_uuid(), $1, $2, $2, $3, $4, NOW())`,
    [params.id, incident.status, catatan, authUser.sub]
  );

  await logAudit(authUser.sub, 'ADD_INCIDENT_NOTE', 'incident', params.id, ip, { catatan });

  return NextResponse.json({ message: 'Catatan berhasil ditambahkan.' });
}

