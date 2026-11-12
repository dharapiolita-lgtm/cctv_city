import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, requireRole, logAudit } from '@/lib/server-auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req);
  const roleCheck = requireRole(authUser, ['admin', 'operator']);
  if (roleCheck.error) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: roleCheck.error } }, { status: roleCheck.status });
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const body = await req.json();
  const validasi = (body.validasi || '').trim().toLowerCase();

  if (validasi !== 'valid' && validasi !== 'false_alarm') {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: "Status validasi wajib bernilai 'valid' atau 'false_alarm'." } },
      { status: 400 }
    );
  }

  // ATOMIC CONDITIONAL UPDATE: hanya update jika validasi IS NULL
  const updateResult = await pool.query(
    `UPDATE detection_events
     SET validasi = $1, divalidasi_oleh = $2, divalidasi_pada = NOW()
     WHERE id = $3 AND validasi IS NULL
     RETURNING id, validasi`,
    [validasi, authUser!.sub, params.id]
  );

  if (updateResult.rows.length === 0) {
    // Check if event exists
    const checkResult = await pool.query('SELECT id, validasi FROM detection_events WHERE id = $1', [params.id]);
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event deteksi tidak ditemukan.' } }, { status: 404 });
    }

    const previousStatus = checkResult.rows[0].validasi;
    return NextResponse.json(
      {
        error: {
          code: 'CONFLICT',
          message: `Konflik: Event ini sudah divalidasi sebelumnya sebagai '${previousStatus}' dan tidak dapat diubah kembali.`,
        },
      },
      { status: 409 }
    );
  }

  await logAudit(authUser!.sub, 'VALIDASI_EVENT', 'detection_event', params.id, ip, {
    validasi,
    operator: authUser!.username,
  });

  return NextResponse.json({
    message: `Event berhasil divalidasi sebagai ${validasi === 'valid' ? 'VALID' : 'FALSE ALARM'}.`,
    event_id: params.id,
    validasi,
  });
}

