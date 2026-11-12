import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser } from '@/lib/server-auth';

export async function GET(req: Request) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Sesi tidak valid atau telah berakhir.' } },
      { status: 401 }
    );
  }

  const result = await pool.query(
    `SELECT id, nama, username, email, role, aktif, last_login_at, created_at
     FROM users WHERE id = $1`,
    [authUser.sub]
  );

  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Profil pengguna tidak ditemukan.' } },
      { status: 404 }
    );
  }

  return NextResponse.json(result.rows[0]);
}

