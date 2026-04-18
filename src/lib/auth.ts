import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
  return new TextEncoder().encode(secret);
};

export async function signToken(payload: { userId: string, username: string }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecretKey());
  return token;
}

export async function verifyToken(token: string) {
  try {
    const verified = await jwtVerify(token, getJwtSecretKey());
    return verified.payload as { userId: string, username: string };
  } catch (err) {
    return null;
  }
}

export async function getUserFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;
  return await verifyToken(token);
}
