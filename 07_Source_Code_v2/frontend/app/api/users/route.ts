import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, requireRole, hashPassword, logAudit } from '@/lib/server-auth';

export async function GET(req: Request) {
  const authUser = await getAuthUser(req);
  const roleCheck = requireRole(authUser, ['admin', 'operator']);
  if (roleCheck.error) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: roleCheck.error } }, { status: roleCheck.status });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  const aktif = searchParams.get('aktif');
  const q = searchParams.get('q');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const per_page = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));
  const offset = (page - 1) * per_page;

  let query = 'SELECT id, nama, username, email, role, aktif, last_login_at, created_at FROM users WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
  const params: any[] = [];

  if (role && role !== 'all') {
    params.push(role);
    query += ` AND role = $${params.length}`;
    countQuery += ` AND role = $${params.length}`;
  }

  if (aktif !== null && aktif !== undefined && aktif !== '') {
    params.push(aktif === 'true');
    query += ` AND aktif = $${params.length}`;
    countQuery += ` AND aktif = $${params.length}`;
  }

  if (q && q.trim()) {
    params.push(`%${q.trim()}%`);
    query += ` AND (nama ILIKE $${params.length} OR username ILIKE $${params.length})`;
    countQuery += ` AND (nama ILIKE $${params.length} OR username ILIKE $${params.length})`;
  }

  query += ` ORDER BY created_at DESC LIMIT ${per_page} OFFSET ${offset}`;

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

export async function POST(req: Request) {
  const authUser = await getAuthUser(req);
  const roleCheck = requireRole(authUser, ['admin']);
  if (roleCheck.error) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: roleCheck.error } }, { status: roleCheck.status });
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const body = await req.json();

  const nama = (body.nama || '').trim();
  const username = (body.username || '').trim().toLowerCase();
  const password = body.password || '';
  const role = (body.role || '').trim().toLowerCase();

  if (!nama || !username || !password || !role) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Nama, username, password, dan peran wajib diisi.' } },
      { status: 400 }
    );
  }

  if (!['admin', 'operator', 'petugas', 'pimpinan'].includes(role)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Role harus: admin, operator, petugas, atau pimpinan.' } },
      { status: 400 }
    );
  }

  const checkDuplicate = await pool.query('SELECT id FROM users WHERE LOWER(username) = $1', [username]);
  if (checkDuplicate.rows.length > 0) {
    return NextResponse.json(
      { error: { code: 'CONFLICT', message: 'Username tersebut sudah digunakan oleh akun lain.' } },
      { status: 409 }
    );
  }

  const password_hash = await hashPassword(password);

  const result = await pool.query(
    `INSERT INTO users (id, nama, username, email, password_hash, role, aktif, failed_login_attempts, locked_until, last_login_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, 0, NULL, NULL, NOW(), NOW())
     RETURNING id, nama, username, email, role, aktif, last_login_at, created_at`,
    [nama, username, body.email || null, password_hash, role]
  );

  const newUser = result.rows[0];
  await logAudit(authUser!.sub, 'CREATE_USER', 'user', newUser.id, ip, {
    username: newUser.username,
    role: newUser.role,
  });

  return NextResponse.json(newUser, { status: 201 });
}

