import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, requireRole, logAudit } from '@/lib/server-auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req);
  const roleCheck = requireRole(authUser, ['admin']);
  if (roleCheck.error) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: roleCheck.error } }, { status: roleCheck.status });
  }

  if (authUser!.sub === params.id) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Anda tidak dapat menonaktifkan akun sendiri.' } },
      { status: 400 }
    );
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  const result = await pool.query(
    `UPDATE users
     SET aktif = NOT aktif, updated_at = NOW()
     WHERE id = $1
     RETURNING id, nama, username, email, role, aktif, last_login_at, created_at`,
    [params.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Pengguna tidak ditemukan.' } }, { status: 404 });
  }

  const updated = result.rows[0];
  await logAudit(authUser!.sub, 'TOGGLE_USER_ACTIVE', 'user', params.id, ip, {
    username: updated.username,
    aktif: updated.aktif,
  });

  return NextResponse.json(updated);
}

