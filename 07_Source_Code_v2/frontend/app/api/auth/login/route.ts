import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, createToken, logAudit } from '@/lib/server-auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    if (!username || !password) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Nama pengguna dan kata sandi wajib diisi.' } },
        { status: 400 }
      );
    }

    const userResult = await pool.query(
      `SELECT id, nama, username, email, password_hash, role, aktif, failed_login_attempts, locked_until, last_login_at, created_at, updated_at
       FROM users WHERE LOWER(username) = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      await logAudit(null, 'LOGIN_FAILED', 'user', null, ip, { username, alasan: 'Pengguna tidak ditemukan' });
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Nama pengguna atau kata sandi tidak sesuai.' } },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    if (!user.aktif) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Akun Anda telah dinonaktifkan oleh administrator.' } },
        { status: 401 }
      );
    }

    const now = new Date();
    if (user.locked_until && new Date(user.locked_until) > now) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until).getTime() - now.getTime()) / 60000);
      return NextResponse.json(
        {
          error: {
            code: 'ACCOUNT_LOCKED',
            message: `Akun terkunci sementara karena 5 kali login gagal. Silakan coba kembali dalam ${remainingMinutes} menit.`,
          },
        },
        { status: 423 }
      );
    }

    const passwordValid = await verifyPassword(user.password_hash, password);

    if (!passwordValid) {
      const newFailed = (user.failed_login_attempts || 0) + 1;
      let lockedUntil: Date | null = null;

      if (newFailed >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      }

      await pool.query(
        `UPDATE users SET failed_login_attempts = $1, locked_until = $2, updated_at = NOW() WHERE id = $3`,
        [newFailed, lockedUntil, user.id]
      );

      await logAudit(user.id, 'LOGIN_FAILED', 'user', user.id, ip, {
        username: user.username,
        failed_attempts: newFailed,
        locked: !!lockedUntil,
      });

      if (lockedUntil) {
        return NextResponse.json(
          {
            error: {
              code: 'ACCOUNT_LOCKED',
              message: 'Batas 5 kali percobaan gagal terlampaui. Akun Anda dikunci sementara selama 15 menit.',
            },
          },
          { status: 423 }
        );
      }

      const sisa = 5 - newFailed;
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: `Nama pengguna atau kata sandi salah. Sisa kesempatan: ${sisa}.`,
          },
        },
        { status: 401 }
      );
    }

    // Login Sukses
    await pool.query(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [user.id]
    );

    const token = createToken({
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
    });

    await logAudit(user.id, 'LOGIN_SUCCESS', 'user', user.id, ip, {
      username: user.username,
      role: user.role,
    });

    const userProfile = {
      id: user.id,
      nama: user.nama,
      username: user.username,
      email: user.email,
      role: user.role,
      aktif: user.aktif,
      last_login_at: now.toISOString(),
      created_at: user.created_at,
    };

    return NextResponse.json({
      token,
      user: userProfile,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan sistem saat proses masuk.' } },
      { status: 500 }
    );
  }
}

