import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const CODES = ["C1", "C2", "D", "E"] as const;
type Code = (typeof CODES)[number];

const SUFFIXES = ["USERNAME", "PASSWORD", "CODE", "REPS", "PHONES", "EMAILS"] as const;

function env(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim() !== "" ? value : undefined;
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

const missing: string[] = [];
if (!env("DATABASE_URL")) missing.push("DATABASE_URL");
for (const code of CODES) {
  for (const suffix of SUFFIXES) {
    if (!env(`BLOCK_${code}_${suffix}`)) missing.push(`BLOCK_${code}_${suffix}`);
  }
}
if (missing.length > 0) {
  console.error("Seed aborted — missing environment variables in .env.local:");
  for (const name of missing) console.error(`  - ${name}`);
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL as string);

interface SeedRow {
  code: Code;
  sort: number;
  displayName: string;
  username: string;
  reps: string[];
  phones: string[];
  emails: string[];
  action: "created" | "exists";
}

function printSummary(rows: SeedRow[]): void {
  const headers = ["BLOCK", "SORT", "DISPLAY", "USERNAME", "REPS", "PHONES", "EMAILS", "ACTION"];
  const data = rows.map((r) => [
    r.code,
    String(r.sort),
    r.displayName,
    r.username,
    String(r.reps.length),
    String(r.phones.length),
    String(r.emails.length),
    r.action,
  ]);
  const widths = headers.map((h, i) => Math.max(h.length, ...data.map((row) => row[i].length)));
  const line = (cells: string[]) => cells.map((c, i) => c.padEnd(widths[i])).join("  ");
  console.log("");
  console.log(line(headers));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of data) console.log(line(row));
}

async function main(): Promise<void> {
  const rows: SeedRow[] = [];

  for (let i = 0; i < CODES.length; i++) {
    const code = CODES[i];
    const sort = i + 1;
    const username = env(`BLOCK_${code}_USERNAME`) as string;
    const password = env(`BLOCK_${code}_PASSWORD`) as string;
    const blockCode = env(`BLOCK_${code}_CODE`) as string;
    const reps = splitList(env(`BLOCK_${code}_REPS`) as string);
    const phones = splitList(env(`BLOCK_${code}_PHONES`) as string);
    const emails = splitList(env(`BLOCK_${code}_EMAILS`) as string);
    const displayName = `${code} Block`;

    const existing = await sql`select code from blocks where code = ${code} limit 1`;

    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash(password, 10);
      const blockCodeHash = await bcrypt.hash(blockCode, 10);
      await sql`
        insert into blocks
          (code, sort_order, display_name, username, password_hash, block_code_hash,
           rep_names, phones, emails, failed_attempts)
        values
          (${code}, ${sort}, ${displayName}, ${username}, ${passwordHash}, ${blockCodeHash},
           ${reps}, ${phones}, ${emails}, 0)
      `;
      console.log(`Created ${code}`);
      rows.push({ code, sort, displayName, username, reps, phones, emails, action: "created" });
    } else {
      await sql`
        update blocks
        set display_name = ${displayName},
            rep_names = ${reps},
            phones = ${phones},
            emails = ${emails},
            sort_order = ${sort}
        where code = ${code}
      `;
      console.log(`${code} exists — credentials untouched`);
      rows.push({ code, sort, displayName, username, reps, phones, emails, action: "exists" });
    }
  }

  printSummary(rows);
}

main().catch((err: unknown) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
