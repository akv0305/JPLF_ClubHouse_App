import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "cb_session";
export const SESSION_MAX_AGE = 60 * 60 * 12;
export const SESSION_TTL = "12h";

export interface SessionPayload {
  block: string;
  username: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("MissingEnvError: SESSION_SECRET is not set. Add it to .env.local.");
  }
  return new TextEncoder().encode(secret);
}

/** Sign a 12-hour session JWT. Edge-safe (no Node APIs). */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ block: payload.block, username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(getSecret());
}

/** Verify a session JWT. Any failure (bad signature, expired, malformed) means no session. */
export async function verifySession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (typeof payload.block !== "string" || typeof payload.username !== "string") return null;
    return { block: payload.block, username: payload.username };
  } catch {
    return null;
  }
}
