import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CopyMessageButton } from "@/components/CopyMessageButton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { requireBlock } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { buildBookingMessage } from "@/lib/message";
import { formatINR } from "@/lib/money";
import { durationLabel, fmtDate, fmtRange, fmtTime } from "@/lib/time";
import type { Booking, BookingEvent, BookingKind, BookingStatus } from "@/lib/types";
import { BookingActions } from "./BookingActions";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const KIND_LABEL: Record<BookingKind, string> = {
  resident: "Resident booking",
  outsider: "Outsider booking",
  blackout: "Blackout",
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

type Tone = "confirmed" | "pending" | "blackout" | "closed";

function statusTone(status: BookingStatus, kind: BookingKind): Tone {
  if (kind === "blackout") return "blackout";
  if (status === "pending") return "pending";
  if (status === "confirmed") return "confirmed";
  return "closed";
}

function describeEvent(event: BookingEvent): string {
  const actor = event.actor_block ? `${event.actor_block} Block` : "the requester";
  const when = `${fmtDate(event.at)} at ${fmtTime(event.at)}`;

  switch (event.event) {
    case "requested":
      return `Requested on ${when}${event.note ? ` — ${event.note}` : ""}.`;
    case "created_by_rep":
      return `Created by ${actor} on ${when}${event.note ? ` — ${event.note}` : ""}.`;
    case "confirmed":
      return `Confirmed by ${actor} on ${when}${event.amount ? ` — ${formatINR(event.amount)} collected` : ""}${event.note ? `. ${event.note}` : ""}.`;
    case "amended_and_confirmed":
      return `Confirmed by ${actor} on ${when} (time amended)${event.amount ? ` — ${formatINR(event.amount)} collected` : ""}${event.note ? `. ${event.note}` : ""}.`;
    case "postponed": {
      const from =
        event.old_starts_at && event.old_ends_at
          ? fmtRange(event.old_starts_at, event.old_ends_at)
          : "the previous time";
      const to =
        event.new_starts_at && event.new_ends_at
          ? fmtRange(event.new_starts_at, event.new_ends_at)
          : "a new time";
      return `Postponed by ${actor} — moved from ${from} to ${to}.${event.note ? ` Reason: ${event.note}.` : ""}`;
    }
    case "rejected":
      return `Rejected by ${actor} on ${when}${event.note ? ` — ${event.note}` : ""}.`;
    case "auto_rejected":
      return `Auto-rejected by ${actor} on ${when}${event.note ? ` — ${event.note}` : ""}.`;
    case "cancelled":
      return `Cancelled by ${actor} on ${when}${event.note ? ` — ${event.note}` : ""}.`;
    default:
      return `${event.event} by ${actor} on ${when}.`;
  }
}

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const myBlock = await requireBlock();
  const id = params.id;
  if (!UUID_RE.test(id)) notFound();

  const booking = await queryOne<Booking>`select * from bookings where id = ${id} limit 1`;
  if (!booking) notFound();

  const events = await query<BookingEvent>`
    select * from booking_events where booking_id = ${id} order by at desc, id desc`;

  const startsAt = new Date(booking.starts_at).toISOString();
  const endsAt = new Date(booking.ends_at).toISOString();
  const message = buildBookingMessage({
    kind: booking.kind,
    status: booking.status,
    startsAt,
    endsAt,
    requesterName: booking.requester_name,
    block: booking.block,
    flatNo: booking.flat_no,
    amountCollected: booking.amount_collected,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/rep"
        className="inline-flex items-center gap-1 text-sm text-[#78716C] transition hover:text-[#0F766E]"
      >
        <ArrowLeft className="h-4 w-4" />
        Requests
      </Link>

      <Card className="mt-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#1C1917]">{fmtRange(startsAt, endsAt)}</p>
            <p className="text-xs text-[#78716C]">
              {durationLabel(startsAt, endsAt)} · {KIND_LABEL[booking.kind]}
            </p>
          </div>
          <Badge tone={statusTone(booking.status, booking.kind)}>
            {STATUS_LABEL[booking.status]}
          </Badge>
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          {booking.requester_name && (
            <div className="flex justify-between gap-4">
              <dt className="text-[#78716C]">Requester</dt>
              <dd className="text-right font-medium text-[#1C1917]">{booking.requester_name}</dd>
            </div>
          )}
          {booking.block && (
            <div className="flex justify-between gap-4">
              <dt className="text-[#78716C]">Flat</dt>
              <dd className="text-right font-medium text-[#1C1917]">
                {booking.block}-{booking.flat_no}
              </dd>
            </div>
          )}
          {booking.phone && (
            <div className="flex justify-between gap-4">
              <dt className="text-[#78716C]">Phone</dt>
              <dd className="text-right font-medium">
                <a href={`tel:${booking.phone}`} className="text-[#0F766E] underline">
                  {booking.phone}
                </a>
              </dd>
            </div>
          )}
          {booking.amount_collected && (
            <div className="flex justify-between gap-4">
              <dt className="text-[#78716C]">Amount collected</dt>
              <dd className="text-right font-medium text-[#1C1917]">
                {formatINR(booking.amount_collected)}
              </dd>
            </div>
          )}
          {booking.remarks && (
            <div className="flex justify-between gap-4">
              <dt className="text-[#78716C]">Remarks</dt>
              <dd className="text-right text-[#1C1917]">{booking.remarks}</dd>
            </div>
          )}
          {booking.confirm_remarks && booking.confirm_remarks !== booking.remarks && (
            <div className="flex justify-between gap-4">
              <dt className="text-[#78716C]">Confirm remarks</dt>
              <dd className="text-right text-[#1C1917]">{booking.confirm_remarks}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          <CopyMessageButton text={message} />
        </div>

        <div className="mt-5 border-t border-[#E7E5E4] pt-5">
          <BookingActions
            booking={{
              id: String(booking.id),
              status: booking.status,
              kind: booking.kind,
              startsAt,
              endsAt,
              requesterName: booking.requester_name,
              block: booking.block,
              flatNo: booking.flat_no,
              phone: booking.phone,
              remarks: booking.remarks,
              ownerBlock: booking.owner_block,
            }}
            myBlock={myBlock}
          />
        </div>
      </Card>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#78716C]">
          Activity
        </h2>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-[#78716C]">No activity recorded.</p>
        ) : (
          <ol className="mt-4 space-y-4 border-l border-[#E7E5E4] pl-4">
            {events.map((event) => (
              <li key={String(event.id)} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#0F766E] ring-2 ring-white" />
                <p className="text-sm text-[#1C1917]">{describeEvent(event)}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
