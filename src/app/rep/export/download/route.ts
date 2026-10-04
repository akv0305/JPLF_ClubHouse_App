import { formatInTimeZone } from "date-fns-tz";
import { requireBlock } from "@/lib/auth";
import { query } from "@/lib/db";
import { IST, istDayBounds } from "@/lib/time";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const HEADER = [
  "booking_id",
  "status",
  "kind",
  "start_ist",
  "end_ist",
  "duration_hours",
  "requester_name",
  "block",
  "flat_no",
  "phone",
  "remarks",
  "amount_collected",
  "confirm_remarks",
  "requested_at_ist",
  "decided_at_ist",
  "decided_by_block",
  "decision_reason",
];

interface ExportRow {
  id: string;
  status: string;
  kind: string;
  starts_at: Date;
  ends_at: Date;
  requester_name: string | null;
  block: string | null;
  flat_no: string | null;
  phone: string | null;
  remarks: string | null;
  amount_collected: string | null;
  confirm_remarks: string | null;
  requested_at: Date;
  decided_at: Date | null;
  decided_by_block: string | null;
  decision_reason: string | null;
}

function ist(value: Date | null): string {
  return value ? formatInTimeZone(value, IST, "yyyy-MM-dd HH:mm") : "";
}

function csvCell(value: string | null | undefined): string {
  const text = value ?? "";
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: Request) {
  await requireBlock();

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return new Response("Invalid date range", { status: 400 });
  }

  const { startUtc } = istDayBounds(from);
  const { endUtc } = istDayBounds(to);

  const rows = await query<ExportRow>`
    select id, status, kind, starts_at, ends_at, requester_name, block, flat_no, phone, remarks,
           amount_collected, confirm_remarks, requested_at, decided_at, decided_by_block, decision_reason
    from bookings
    where starts_at < ${endUtc} and ends_at > ${startUtc}
    order by starts_at asc`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(HEADER.join(",") + "\n"));
      for (const row of rows) {
        const hours =
          (new Date(row.ends_at).getTime() - new Date(row.starts_at).getTime()) / 3_600_000;
        const cells = [
          String(row.id),
          row.status,
          row.kind,
          ist(new Date(row.starts_at)),
          ist(new Date(row.ends_at)),
          String(Number(hours.toFixed(2))),
          row.requester_name,
          row.block,
          row.flat_no,
          row.phone,
          row.remarks,
          row.amount_collected,
          row.confirm_remarks,
          ist(new Date(row.requested_at)),
          ist(row.decided_at ? new Date(row.decided_at) : null),
          row.decided_by_block,
          row.decision_reason,
        ];
        controller.enqueue(encoder.encode(cells.map((cell) => csvCell(cell)).join(",") + "\n"));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clubhouse-bookings-${from}-to-${to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
