import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, requireRole } from '@/lib/server-auth';

export async function GET(req: Request) {
  const authUser = await getAuthUser(req);
  const roleCheck = requireRole(authUser, ['admin']);
  if (roleCheck.error) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: roleCheck.error } }, { status: roleCheck.status });
  }

  const { searchParams } = new URL(req.url);
  const aksi = searchParams.get('aksi');
  const objek_tipe = searchParams.get('objek_tipe');
  const user_id = searchParams.get('user_id');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const per_page = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));
  const offset = (page - 1) * per_page;

  let query = `
    SELECT 
      a.id, a.user_id, u.nama as user_nama, u.username, u.role as user_role,
      a.aksi, a.objek_tipe, a.objek_id, a.ip, a.waktu, a.detail
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;

  let countQuery = 'SELECT COUNT(*) FROM audit_logs a WHERE 1=1';
  const params: any[] = [];

  if (aksi && aksi !== 'all') {
    params.push(aksi);
    query += ` AND a.aksi = $${params.length}`;
    countQuery += ` AND a.aksi = $${params.length}`;
  }

  if (objek_tipe && objek_tipe !== 'all') {
    params.push(objek_tipe);
    query += ` AND a.objek_tipe = $${params.length}`;
    countQuery += ` AND a.objek_tipe = $${params.length}`;
  }

  if (user_id) {
    params.push(user_id);
    query += ` AND a.user_id = $${params.length}`;
    countQuery += ` AND a.user_id = $${params.length}`;
  }

  query += ` ORDER BY a.waktu DESC LIMIT ${per_page} OFFSET ${offset}`;

  const [dataResult, countResult] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, params),
  ]);

  return NextResponse.json({
    data: dataResult.rows,
    meta: {
      page,
      per_page,
      total: parseInt(countResult.rows[0].count, 10),
    },
  });
}

