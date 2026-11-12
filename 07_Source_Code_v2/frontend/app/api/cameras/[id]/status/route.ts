import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, requireRole, logAudit } from '@/lib/server-auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req);
  const roleCheck = requireRole(authUser, ['admin', 'operator']);
  if (roleCheck.error) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: roleCheck.error } }, { status: roleCheck.status });
  }

  const body = await req.json();
  const status = body.status;

  if (!['online', 'offline', 'nonaktif'].includes(status)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Status kamera tidak valid.' } },
      { status: 400 }
    );
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  const result = await pool.query(
    `UPDATE cameras
     SET status = $1,
         last_seen_at = CASE WHEN $1 = 'online' THEN NOW() ELSE last_seen_at END,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, params.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Kamera tidak ditemukan.' } }, { status: 404 });
  }

  const updated = result.rows[0];
  await logAudit(authUser!.sub, 'UPDATE_CAMERA_STATUS', 'camera', params.id, ip, {
    status: updated.status,
  });

  return NextResponse.json(updated);
}

