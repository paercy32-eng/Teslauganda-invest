import { SignJWT, jwtVerify } from 'jose';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET!;

if (!ADMIN_JWT_SECRET || ADMIN_JWT_SECRET.length < 16) {
  throw new Error('ADMIN_JWT_SECRET is missing or too short (min 16 chars).');
}

const secret = new TextEncoder().encode(ADMIN_JWT_SECRET);

export const ADMIN_SESSION_COOKIE = 'tesla_admin_session';

export type AdminSession = {
  username: string;
  role: 'admin';
};

export function verifyAdminCredentials(username: string, password: string): boolean {
  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;

  if (!validUser || !validPass) return false;

  return username === validUser && password === validPass;
}

export async function signAdminSession(payload: AdminSession): Promise<string> {
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
      username: payload.username as string,
      role: 'admin',
    };
  } catch {
    return null;
  }
}
