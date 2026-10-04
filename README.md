# Clubhouse Booking

Banquet hall booking for an Indian residential society.
Next.js 14 (App Router) + TypeScript + Tailwind CSS. Database is Neon Postgres,
accessed **server-side only** through `@neondatabase/serverless` (raw parameterised SQL, no ORM).

All dates are displayed and entered in **Asia/Kolkata (IST)**; the database stores `timestamptz` (UTC).

## Local setup

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm run seed                        # create/update the four block rows
npm run dev                         # http://localhost:3000
```

Use the **pooled** Neon endpoint (the hostname contains `-pooler`) and keep `sslmode=require`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run seed` | Seed/update blocks from the `BLOCK_<CODE>_*` env vars |

`npm run seed` never overwrites credentials (`password_hash`, `block_code_hash`) on an existing row.

## Environment variables

- `DATABASE_URL` — pooled Neon connection string
- `SESSION_SECRET` — long random string used to sign session tokens
- `CLUBHOUSE_NAME` — wordmark shown in the header
- For each block (`C1`, `C2`, `D`, `E`):
  `BLOCK_<CODE>_USERNAME`, `BLOCK_<CODE>_PASSWORD`, `BLOCK_<CODE>_CODE`,
  `BLOCK_<CODE>_REPS`, `BLOCK_<CODE>_PHONES`, `BLOCK_<CODE>_EMAILS`

## Deploy (Netlify)

`netlify.toml` builds with `npm run build` and the `@netlify/plugin-nextjs` plugin.
Add the same environment variables in the Netlify UI before deploying.
