import jwt from 'jsonwebtoken';
import { argon2Verify, argon2id } from 'hash-wasm';
import pool from '@/lib/db';
import { UserRole } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'waterwatch-super-secret-jwt-key-2026-cctv-secure-dev';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION_MINUTES ? `${process.env.JWT_EXPIRATION_MINUTES}m` : '480m';

export interface TokenPayload {
  sub: string;
  username: string;
  nama: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return argon2id({
    password,
    salt,
    parallelism: 4,
    iterations: 3,
    memorySize: 65536,
    hashLength: 32,
    outputType: 'encoded',
  });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2Verify({ password: plain, hash });
  } catch (err) {
    console.error('Argon2 verify error:', err);
    return false;
  }
}

export function createToken(user: { id: string; username: string; nama: string; role: UserRole }): string {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(req: Request): Promise<TokenPayload | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function requireRole(user: TokenPayload | null, allowed: UserRole[]): { error?: string; status?: number } {
  if (!user) {
    return { error: 'Otorisasi diperlukan. Silakan login kembali.', status: 401 };
  }
  if (!allowed.includes(user.role)) {
    return { error: `Akses ditolak. Peran '${user.role}' tidak memiliki hak akses.`, status: 403 };
  }
  return {};
}

export async function logAudit(
  userId: string | null,
  action: string,
  objectType: string,
  objectId: string | null,
  ip: string | null,
  detail: Record<string, any> = {}
) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, aksi, objek_tipe, objek_id, ip, waktu, detail)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), $6)`,
      [userId, action, objectType, objectId, ip || '127.0.0.1', JSON.stringify(detail)]
    );
  } catch (err) {
    console.error('Gagal mencatat audit log:', err);
  }
}

