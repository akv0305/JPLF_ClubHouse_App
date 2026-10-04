import "server-only";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { query, queryOne } from "./db";
import { createSession, getSession } from "./session";
import type { BlockCode, BlockRow } from "./types";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const GENERIC_INVALID = "Invalid username or password.";

export class AuthError extends Error {
  readonly code: string;
  readonly lockedUntil?: string;
  readonly lockedMinutes?: number;

  constructor(
    code: string,
    message: string,
    options: { lockedUntil?: string; lockedMinutes?: number } = {},
  ) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.lockedUntil = options.lockedUntil;
    this.lockedMinutes = options.lockedMinutes;
  }
}

/** The full blocks row (includes hashes) — server-side use only. */
export async function getBlock(code: string): Promise<BlockRow | null> {
  return queryOne<BlockRow>`select * from blocks where code = ${code} limit 1`;
}

/**
 * Verify a username/password pair. On success resets the lockout counters and
 * creates the session. Throws AuthError("LOCKED") while a lockout is active and
 * AuthError("INVALID") for both an unknown username and a wrong password.
 */
export async function login(
  username: string,
  password: string,
): Promise<{ block: BlockCode; username: string }> {
  const user = username.trim();
  const row = await queryOne<BlockRow>`select * from blocks where username = ${user} limit 1`;

  if (!row) {
    throw new AuthError("INVALID", GENERIC_INVALID);
  }

  const lockedUntilMs = row.locked_until ? new Date(row.locked_until).getTime() : 0;
  if (lockedUntilMs > Date.now()) {
    const minutes = Math.max(1, Math.ceil((lockedUntilMs - Date.now()) / 60000));
    throw new AuthError(
      "LOCKED",
      `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      { lockedUntil: new Date(lockedUntilMs).toISOString(), lockedMinutes: minutes },
    );
  }

  const matches = await bcrypt.compare(password, row.password_hash);
  if (!matches) {
    await query`
      update blocks
      set failed_attempts = case
            when failed_attempts + 1 >= ${MAX_FAILED} then 0
            else failed_attempts + 1
          end,
          locked_until = case
            when failed_attempts + 1 >= ${MAX_FAILED} then now() + make_interval(mins => ${LOCK_MINUTES})
            else locked_until
          end
      where code = ${row.code}
    `;
    throw new AuthError("INVALID", GENERIC_INVALID);
  }

  await query`update blocks set failed_attempts = 0, locked_until = null where code = ${row.code}`;
  await createSession(row.code, row.username);
  return { block: row.code, username: row.username };
}

/**
 * Rotate the shared block password. Requires the current password AND the block
 * code; failures share one message so neither factor is revealed.
 */
export async function changePassword(
  block: string,
  oldPassword: string,
  blockCode: string,
  newPassword: string,
): Promise<void> {
  const generic = new AuthError(
    "INVALID_CREDENTIALS",
    "Current password or block code is incorrect.",
  );

  const row = await getBlock(block);
  if (!row) throw generic;

  const [passwordOk, codeOk] = await Promise.all([
    bcrypt.compare(oldPassword, row.password_hash),
    bcrypt.compare(blockCode, row.block_code_hash),
  ]);
  if (!passwordOk || !codeOk) throw generic;

  if (newPassword.length < 8) {
    throw new AuthError("WEAK_PASSWORD", "New password must be at least 8 characters.");
  }
  if (newPassword === oldPassword) {
    throw new AuthError("SAME_PASSWORD", "New password must be different from the current password.");
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await query`update blocks set password_hash = ${hash}, password_changed_at = now() where code = ${block}`;
}

/** Return the signed-in block code, or redirect to /login. */
export async function requireBlock(): Promise<BlockCode> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.block as BlockCode;
}
