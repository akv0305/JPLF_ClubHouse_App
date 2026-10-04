# Clubhouse Booking

Banquet-hall booking for an Indian residential society. Residents request a date anonymously; each
block's two representatives share one login and confirm, reject, postpone or cancel bookings.

- **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database:** Neon Postgres, accessed server-side only via `@neondatabase/serverless` (raw
  parameterised SQL — no ORM, no Prisma, no Drizzle)
- **Time:** everything is displayed and entered in **Asia/Kolkata (IST)**; the database stores
  `timestamptz` (UTC) and the boundary is converted with `date-fns-tz`

## Prerequisites

- Node.js 20+ and npm
- A Neon Postgres database with the schema below applied
- The connection string for the **pooled** endpoint (hostname contains `-pooler`)

## Environment variables

Copy `.env.local.example` to `.env.local` and fill it in. `.env.local` is git-ignored.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled Neon connection string; keep `sslmode=require` |
| `SESSION_SECRET` | Long random string used to sign rep session JWTs |
| `CLUBHOUSE_NAME` | Wordmark shown in the header and in copied messages |
| `BLOCK_<CODE>_USERNAME` | Login username for the block (`C1`, `C2`, `D`, `E`) |
| `BLOCK_<CODE>_PASSWORD` | Login password (hashed at seed time) |
| `BLOCK_<CODE>_CODE` | Block code — second factor for password rotation |
| `BLOCK_<CODE>_REPS` | Comma-separated rep names |
| `BLOCK_<CODE>_PHONES` | Comma-separated 10-digit mobile numbers |
| `BLOCK_<CODE>_EMAILS` | Comma-separated email addresses |

`_REPS`, `_PHONES` and `_EMAILS` are split on commas, trimmed, and empty items dropped.
**Quote any value that contains `#`** — an unquoted `#` starts a comment and the rest is dropped.

## Database

The schema lives in your Neon project; this app never creates, alters or migrates tables.

Objects used by the app:

- tables `blocks`, `bookings`, `booking_events`
- view `public_calendar`
- functions `submit_booking_request`, `confirm_booking`, `postpone_booking`, `close_booking`,
  `create_rep_booking`

To apply the schema to a fresh Neon database, open the **Neon SQL Editor** (or run
`psql "$DATABASE_URL" -f schema.sql`) and execute your schema SQL, then seed the blocks.

> Neon's HTTP driver does not support interactive transactions. All atomic operations live inside
> the Postgres functions above — never add `BEGIN`/`COMMIT` in TypeScript.

## Seed the blocks

```bash
npm install
npm run seed
```

`npm run seed` reads `BLOCK_<CODE>_*` from `.env.local` and, for each of `C1, C2, D, E`:

- **creates** the row (bcrypt-hashing the password and block code at 10 rounds) if it is missing, or
- **updates only** `display_name`, `rep_names`, `phones`, `emails` and `sort_order` if it exists.

It never overwrites `password_hash` or `block_code_hash` for an existing row. If a variable is
missing it exits `1` and lists the missing names.

## Run locally

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # run the production build
npm run lint     # ESLint
```

## Add or rotate a block credential

- **Add a block:** set every `BLOCK_<CODE>_*` variable for it in `.env.local`, add the code to the
  `blocks.code` CHECK constraint / enum if it is brand new, then run `npm run seed`.
- **Rotate a password:** sign in as the block and use **Block Profile → Password** (`/rep/password`).
  It requires the current password **and** the block code, then signs you out.
- **Rotate the block code:** there is no UI for this. Hash the new code with bcrypt (10 rounds) and
  update `blocks.block_code_hash` directly, e.g. in the Neon SQL Editor.
- **Edit contacts:** sign in and use **Block Profile** (`/rep/profile`) to edit rep names, phones
  and emails.

## How passwords and block codes work

- One shared login per block; both reps use it. The audit trail records the **block**, never a person.
- Passwords and block codes are stored only as bcrypt hashes (10 rounds).
- After **5** failed logins the block is locked for **15 minutes** (`failed_attempts`, `locked_until`).
- Changing a password requires the current password **and** the block code, so a leaked password
  alone is not enough.
- The seed never rewrites credentials of an existing block.

## Deployment

The repository is configured for **Netlify** (`netlify.toml`, `@netlify/plugin-nextjs`):

1. Push the repo and connect it in Netlify.
2. Add every environment variable above in **Site settings → Environment variables**.
3. Build command `npm run build`, publish directory `.next` (already set), `NODE_VERSION=20`.

**Vercel (alternative):** import the repo, set the same environment variables in
**Project → Settings → Environment Variables**, and deploy — the framework preset detects Next.js.
No `output` mode is set, so both platforms use the standard Next.js server output.

## What v1 deliberately does not do

- No email, SMS or WhatsApp — communication is a **Copy message** button only.
- No online payments; `amount_collected` is recorded by the rep, and there are no refunds.
- No admin or fifth role; there is no way to edit or delete a booking after a decision
  (mistakes are fixed by cancelling and re-creating).
- No notifications of any kind; rep email/phone details are stored for a future feature only.
- No recurring bookings, no slot presets, and no minimum notice or booking horizon.
- Residents never log in; outsiders never use the public form (a rep creates those bookings).
