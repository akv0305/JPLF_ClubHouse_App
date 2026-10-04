import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type SessionPayload,
} from "./session-token";

export type { SessionPayload } from "./session-token";

/** Sign a session and store it in the httpOnly "cb_session" cookie. */
export async function createSession(block: string, username: string): Promise<void> {
  const token = await signSession({ block, username });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Read and verify the current session. Cached for the lifetime of the request. */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  return verifySession(cookies().get(SESSION_COOKIE)?.value);
});

/** Clear the session cookie. */
export function destroySession(): void {
  cookies().delete(SESSION_COOKIE);
}
