import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser } from '@/lib/server-auth';

export async function GET(req: Request) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Otorisasi diperlukan.' } }, { status: 401 });
  }

  const result = await pool.query(`
    WITH dates AS (
      SELECT generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        INTERVAL '1 day'
      )::date AS tgl
    )
    SELECT 
      TO_CHAR(d.tgl, 'DD Mon') as tanggal,
      (SELECT COUNT(*)::int FROM detection_events e WHERE e.waktu_deteksi::date = d.tgl) as total_events,
      (SELECT COUNT(*)::int FROM incidents i WHERE i.dibuat_pada::date = d.tgl) as total_incidents
    FROM dates d
    ORDER BY d.tgl ASC
  `);

  return NextResponse.json(result.rows);
}

