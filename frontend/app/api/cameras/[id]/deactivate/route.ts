import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, requireRole, logAudit } from '@/lib/server-auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req);
  const roleCheck = requireRole(authUser, ['admin']);
  if (roleCheck.error) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: roleCheck.error } }, { status: roleCheck.status });
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  const result = await pool.query(
    `UPDATE cameras SET status = 'nonaktif', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [params.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Kamera tidak ditemukan.' } }, { status: 404 });
  }

  const updated = result.rows[0];
  await logAudit(authUser!.sub, 'DEACTIVATE_CAMERA', 'camera', params.id, ip, {
    nama: updated.nama,
    status: 'nonaktif',
  });

  return NextResponse.json(updated);
}

