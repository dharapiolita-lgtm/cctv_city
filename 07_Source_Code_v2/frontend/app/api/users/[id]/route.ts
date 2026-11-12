import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, requireRole, logAudit } from '@/lib/server-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req);
  const roleCheck = requireRole(authUser, ['admin']);
  if (roleCheck.error) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: roleCheck.error } }, { status: roleCheck.status });
  }

  const result = await pool.query(
    'SELECT id, nama, username, email, role, aktif, last_login_at, created_at FROM users WHERE id = $1',
    [params.id]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Pengguna tidak ditemukan.' } }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser(req);
  const roleCheck = requireRole(authUser, ['admin']);
  if (roleCheck.error) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: roleCheck.error } }, { status: roleCheck.status });
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const body = await req.json();

  const existingResult = await pool.query('SELECT * FROM users WHERE id = $1', [params.id]);
  if (existingResult.rows.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Pengguna tidak ditemukan.' } }, { status: 404 });
  }
  const existing = existingResult.rows[0];

  const nama = body.nama ?? existing.nama;
  const email = body.email ?? existing.email;
  const role = body.role ?? existing.role;
  const aktif = body.aktif ?? existing.aktif;

  if (!['admin', 'operator', 'petugas', 'pimpinan'].includes(role)) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Role tidak valid.' } }, { status: 400 });
  }

  const result = await pool.query(
    `UPDATE users
     SET nama = $1, email = $2, role = $3, aktif = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING id, nama, username, email, role, aktif, last_login_at, created_at`,
    [nama, email, role, aktif, params.id]
  );

  const updated = result.rows[0];
  await logAudit(authUser!.sub, 'UPDATE_USER', 'user', params.id, ip, {
    username: updated.username,
    role: updated.role,
    aktif: updated.aktif,
  });

  return NextResponse.json(updated);
}

