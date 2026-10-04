import Link from "next/link";
import { Calendar } from "@/components/Calendar";
import { query } from "@/lib/db";
import { istMonthBounds, todayIst } from "@/lib/time";
import type { PublicCalendarRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MONTH_RE = /^\d{4}-\d{2}$/;

interface HomePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const requested = typeof searchParams.m === "string" ? searchParams.m : undefined;
  const month = requested && MONTH_RE.test(requested) ? requested : todayIst().slice(0, 7);
  const { startUtc, endUtc } = istMonthBounds(month);

  const raw = await query<PublicCalendarRow>`
    select id, starts_at, ends_at, status, kind, label
    from public_calendar
    where starts_at < ${endUtc} and ends_at > ${startUtc}
    order by starts_at asc
  `;

  const rows = raw.map((row) => ({
    id: String(row.id),
    starts_at: new Date(row.starts_at).toISOString(),
    ends_at: new Date(row.ends_at).toISOString(),
    status: row.status,
    kind: row.kind,
    label: row.label,
  }));

  return (
    <div>
      <div className="flex flex-col gap-3">
        <Link
          href="/request"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#0F766E] px-5 text-sm font-medium text-white transition hover:bg-[#0d6a63] sm:w-auto sm:self-start"
        >
          Submit Booking Request
        </Link>
        <p className="text-sm text-[#78716C]">
          Your block representative confirms every booking request.
        </p>
      </div>

      <div className="mt-6">
        <Calendar
          month={month}
          monthStartUtc={startUtc}
          monthEndUtc={endUtc}
          rows={rows}
        />
      </div>
    </div>
  );
}
