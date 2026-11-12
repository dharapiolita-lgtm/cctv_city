import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, logAudit } from '@/lib/server-auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Otorisasi diperlukan.' } }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const body = await req.json();

  const status_baru = (body.status || '').trim().toLowerCase();
  const catatan = (body.catatan || '').trim();

  if (!catatan) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Catatan pembaruan status wajib diisi.' } }, { status: 400 });
  }

  const incidentResult = await pool.query('SELECT * FROM incidents WHERE id = $1', [params.id]);
  if (incidentResult.rows.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Insiden tidak ditemukan.' } }, { status: 404 });
  }
  const incident = incidentResult.rows[0];
  const status_lama = incident.status;

  // WORKFLOW TRANSITION VALIDATION
  const validTransitions: Record<string, string[]> = {
    baru: ['ditugaskan'],
    ditugaskan: ['diterima'],
    diterima: ['di_lokasi'],
    di_lokasi: ['selesai'],
    selesai: ['ditutup'],
  };

  const allowedNext = validTransitions[status_lama] || [];
  if (!allowedNext.includes(status_baru)) {
    return NextResponse.json(
      {
        error: {
          code: 'CONFLICT',
          message: `Transisi status dari '${status_lama}' ke '${status_baru}' tidak sah. Alur SOP: BARU -> DITUGASKAN -> DITERIMA -> DI LOKASI -> SELESAI -> DITUTUP.`,
        },
      },
      { status: 409 }
    );
  }

  // ROLE PERMISSIONS
  if (['diterima', 'di_lokasi', 'selesai'].includes(status_baru)) {
    if (authUser.role === 'petugas') {
      if (incident.ditugaskan_ke !== authUser.sub) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Anda hanya dapat memperbarui status insiden yang ditugaskan kepada Anda.' } },
          { status: 403 }
        );
      }
    } else if (authUser.role !== 'admin' && authUser.role !== 'operator') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Peran Anda tidak memiliki izin memperbarui status penanganan.' } },
        { status: 403 }
      );
    }
  } else if (status_baru === 'ditutup') {
    if (authUser.role !== 'admin' && authUser.role !== 'operator') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Hanya Operator Command Center atau Administrator yang berwenang menutup insiden.' } },
        { status: 403 }
      );
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const selesai_pada = status_baru === 'selesai' || status_baru === 'ditutup' ? (incident.selesai_pada || new Date()) : null;

    const updateResult = await client.query(
      `UPDATE incidents
       SET status = $1, selesai_pada = COALESCE(selesai_pada, $2), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status_baru, selesai_pada, params.id]
    );
    const updated = updateResult.rows[0];

    await client.query(
      `INSERT INTO incident_updates (id, incident_id, status_lama, status_baru, catatan, oleh, waktu)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
      [params.id, status_lama, status_baru, catatan, authUser.sub]
    );

    await client.query('COMMIT');

    await logAudit(authUser.sub, 'UPDATE_INCIDENT_STATUS', 'incident', params.id, ip, {
      status_lama,
      status_baru,
      catatan,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error updating status:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Gagal memperbarui status insiden.' } }, { status: 500 });
  } finally {
    client.release();
  }
}

