import { Calendar, type CalendarRow } from "@/components/Calendar";
import { requireBlock } from "@/lib/auth";
import { query } from "@/lib/db";
import { istMonthBounds, todayIst } from "@/lib/time";
import type { BookingKind, BookingStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Calendar" };

const MONTH_RE = /^\d{4}-\d{2}$/;

interface RepCalendarBooking {
  id: string;
  starts_at: Date;
  ends_at: Date;
  status: BookingStatus;
  kind: BookingKind;
  requester_name: string | null;
  block: string | null;
  flat_no: string | null;
  phone: string | null;
  remarks: string | null;
}

function labelFor(row: RepCalendarBooking): string {
  if (row.kind === "blackout") return row.remarks ?? "Not available";
  if (row.kind === "outsider") return "Guest booking";
  return `${row.block ?? ""}-${row.flat_no ?? ""}`;
}

interface RepCalendarPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function RepCalendarPage({ searchParams }: RepCalendarPageProps) {
  await requireBlock();

  const requested = typeof searchParams.m === "string" ? searchParams.m : undefined;
  const month = requested && MONTH_RE.test(requested) ? requested : todayIst().slice(0, 7);
  const { startUtc, endUtc } = istMonthBounds(month);

  const raw = await query<RepCalendarBooking>`
    select id, starts_at, ends_at, status, kind, requester_name, block, flat_no, phone, remarks
    from bookings
    where status in ('pending', 'confirmed')
      and starts_at < ${endUtc} and ends_at > ${startUtc}
    order by starts_at asc
  `;

  const rows: CalendarRow[] = raw.map((row) => ({
    id: String(row.id),
    starts_at: new Date(row.starts_at).toISOString(),
    ends_at: new Date(row.ends_at).toISOString(),
    status: row.status,
    kind: row.kind,
    label: labelFor(row),
    details: {
      requesterName: row.requester_name ?? undefined,
      block: row.block,
      flatNo: row.flat_no,
      phone: row.phone,
      remarks: row.remarks,
    },
  }));

  return (
    <Calendar
      month={month}
      monthStartUtc={startUtc}
      monthEndUtc={endUtc}
      rows={rows}
      showFullDetails
    />
  );
}
