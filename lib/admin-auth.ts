import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { supabaseAdmin } from './supabase-admin';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET!;

if (!ADMIN_JWT_SECRET || ADMIN_JWT_SECRET.length < 16) {
  throw new Error('ADMIN_JWT_SECRET is missing or too short (min 16 chars).');
}

const secret = new TextEncoder().encode(ADMIN_JWT_SECRET);

export const ADMIN_SESSION_COOKIE = 'tesla_admin_session';

export type AdminSession = {
  userId: string;
  username: string;
  name: string;
  role: 'admin';
};

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<{
  id: string;
  username: string;
  name: string | null;
} | null> {
  if (!username || !password) return null;

  const cleanUsername = username.trim().toLowerCase();

  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('id, username, name, password_hash')
    .eq('username', cleanUsername)
    .maybeSingle();

  if (!admin) return null;

  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return null;

  return {
    id: admin.id,
    username: admin.username,
    name: admin.name,
  };
}

export async function signAdminSession(
  payload: AdminSession
): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyAdminSession(
  token: string
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'admin') return null;
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      name: payload.name as string,
      role: 'admin',
    };
  } catch {
    return null;
  }
}
