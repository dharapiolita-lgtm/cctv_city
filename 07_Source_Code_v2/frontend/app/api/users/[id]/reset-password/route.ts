import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, requireRole, hashPassword, logAudit } from '@/lib/server-auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req);
  const roleCheck = requireRole(authUser, ['admin']);
  if (roleCheck.error) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: roleCheck.error } }, { status: roleCheck.status });
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const body = await req.json();
  const newPassword = body.new_password || '';

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Kata sandi baru minimal 6 karakter.' } },
      { status: 400 }
    );
  }

  const password_hash = await hashPassword(newPassword);

  const result = await pool.query(
    `UPDATE users
     SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
     WHERE id = $2`,
    [password_hash, params.id]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Pengguna tidak ditemukan.' } }, { status: 404 });
  }

  await logAudit(authUser!.sub, 'RESET_PASSWORD', 'user', params.id, ip, {
    action: 'Admin mereset password pengguna',
  });

  return NextResponse.json({ message: 'Kata sandi pengguna berhasil diatur ulang.' });
}

