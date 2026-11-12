import { NextResponse } from 'next/server';
import { getAuthUser, logAudit } from '@/lib/server-auth';

export async function POST(req: Request) {
  const user = await getAuthUser(req);
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  if (user) {
    await logAudit(user.sub, 'LOGOUT', 'user', user.sub, ip, { username: user.username });
  }

  return NextResponse.json({ message: 'Sesi berhasil diakhiri.' });
}

