import "server-only";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "MissingEnvError: DATABASE_URL is not set. Add it to .env.local — use the " +
      'POOLED Neon endpoint (hostname containing "-pooler") and keep sslmode=require.',
  );
}

/**
 * Tagged-template query client. Every value is bound as a parameter by the
 * driver — never concatenate a value into the SQL string.
 */
export const sql = neon(connectionString);

/** Run a parameterised query and return all rows. */
export async function query<T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  return (await sql(strings, ...values)) as T[];
}

/** Run a parameterised query and return the first row, or null. */
export async function queryOne<T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T | null> {
  const rows = await query<T>(strings, ...values);
  return rows[0] ?? null;
}
