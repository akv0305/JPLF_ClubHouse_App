import { formatDistanceToNow } from "date-fns";
import { requireBlock } from "@/lib/auth";
import { query } from "@/lib/db";
import type { Booking } from "@/lib/types";
import { FilterBar } from "./FilterBar";
import { RequestsView } from "./RequestsView";
import type { RepRow } from "./types";

export const dynamic = "force-dynamic";

interface RepPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

function toRepRow(booking: Booking): RepRow {
  const requestedAt = new Date(booking.requested_at).toISOString();
  const decidedAt = booking.decided_at ? new Date(booking.decided_at).toISOString() : null;
  return {
    id: String(booking.id),
    kind: booking.kind,
    status: booking.status,
    startsAt: new Date(booking.starts_at).toISOString(),
    endsAt: new Date(booking.ends_at).toISOString(),
    requesterName: booking.requester_name,
    block: booking.block,
    flatNo: booking.flat_no,
    phone: booking.phone,
    remarks: booking.remarks,
    ownerBlock: booking.owner_block,
    amountCollected: booking.amount_collected,
    requestedAt,
    requestedAgo: formatDistanceToNow(new Date(requestedAt), { addSuffix: true }),
    decidedAt,
    decidedAgo: decidedAt ? formatDistanceToNow(new Date(decidedAt), { addSuffix: true }) : null,
    decidedByBlock: booking.decided_by_block,
    decisionReason: booking.decision_reason,
  };
}

export default async function RepRequestsPage({ searchParams }: RepPageProps) {
  const myBlock = await requireBlock();

  const blockFilter = searchParams.block === "mine" ? "mine" : "all";
  const whenParam = searchParams.when;
  const whenFilter =
    whenParam === "upcoming" || whenParam === "past" ? whenParam : "all";
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const pattern = `%${q}%`;

  const pendingRaw = await query<Booking>`
    select * from bookings
    where status = 'pending'
      and (${blockFilter} = 'all' or owner_block = ${myBlock})
      and (${whenFilter} = 'all'
        or (${whenFilter} = 'upcoming' and starts_at >= now())
        or (${whenFilter} = 'past' and starts_at < now()))
      and (${q} = '' or requester_name ilike ${pattern} or flat_no ilike ${pattern} or phone ilike ${pattern})
    order by starts_at asc
  `;

  const decisionsRaw = await query<Booking>`
    select * from bookings
    where status in ('confirmed', 'rejected', 'cancelled')
    order by decided_at desc nulls last
    limit 20
  `;

  return (
    <div>
      <FilterBar block={blockFilter} when={whenFilter} q={q} />
      <div className="mt-5">
        <RequestsView
          pending={pendingRaw.map(toRepRow)}
          decisions={decisionsRaw.map(toRepRow)}
          myBlock={myBlock}
        />
      </div>
    </div>
  );
}
