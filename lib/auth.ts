import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET || JWT_SECRET.length < 16) {
  throw new Error('JWT_SECRET is missing or too short (min 16 chars).');
}

const secret = new TextEncoder().encode(JWT_SECRET);

// ---------- Passwords ----------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ---------- JWT ----------

export type SessionPayload = {
  userId: string;
  phone: string;
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      phone: payload.phone as string,
    };
  } catch {
    return null;
  }
}

// ---------- Cookie name (used across the app) ----------

export const SESSION_COOKIE = 'tesla_session';
