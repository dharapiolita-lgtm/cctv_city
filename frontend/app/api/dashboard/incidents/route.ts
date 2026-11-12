import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser } from '@/lib/server-auth';

export async function GET(req: Request) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Otorisasi diperlukan.' } }, { status: 401 });
  }

  const [jenisRes, keparahanRes, statusRes] = await Promise.all([
    pool.query('SELECT jenis as name, COUNT(*)::int as count FROM incidents GROUP BY jenis ORDER BY count DESC'),
    pool.query('SELECT keparahan as name, COUNT(*)::int as count FROM incidents GROUP BY keparahan ORDER BY count DESC'),
    pool.query('SELECT status as name, COUNT(*)::int as count FROM incidents GROUP BY status ORDER BY count DESC'),
  ]);

  return NextResponse.json({
    by_jenis: jenisRes.rows,
    by_keparahan: keparahanRes.rows,
    by_status: statusRes.rows,
  });
}

