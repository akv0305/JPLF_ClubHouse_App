"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { parseRpcError } from "@/lib/errors";
import { requireBlock } from "@/lib/auth";
import { parseAmount } from "@/lib/money";
import { destroySession } from "@/lib/session";

export async function signOutAction(): Promise<void> {
  destroySession();
  redirect("/login");
}

export interface ConflictBooking {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string;
}

export interface ConflictCheck {
  confirmedClash: ConflictBooking | null;
  overlappingPending: ConflictBooking[];
}

interface CalendarRow {
  id: string;
  label: string;
  starts_at: Date;
  ends_at: Date;
}

function toConflict(row: CalendarRow): ConflictBooking {
  return {
    id: String(row.id),
    label: row.label,
    startsAt: new Date(row.starts_at).toISOString(),
    endsAt: new Date(row.ends_at).toISOString(),
  };
}

/** Re-check the confirmed clash and overlapping pending requests for a window, right now. */
export async function checkConfirmConflicts(
  bookingId: string,
  startsAt: string,
  endsAt: string,
): Promise<ConflictCheck> {
  await requireBlock();
  const start = new Date(startsAt).toISOString();
  const end = new Date(endsAt).toISOString();

  const confirmed = await queryOne<CalendarRow>`
    select id, label, starts_at, ends_at from public_calendar
    where status = 'confirmed' and id <> ${bookingId}
      and starts_at < ${end} and ends_at > ${start}
    order by starts_at asc limit 1`;

  const pending = await query<CalendarRow>`
    select id, label, starts_at, ends_at from public_calendar
    where status = 'pending' and id <> ${bookingId}
      and starts_at < ${end} and ends_at > ${start}
    order by starts_at asc`;

  return {
    confirmedClash: confirmed ? toConflict(confirmed) : null,
    overlappingPending: pending.map(toConflict),
  };
}

export interface ConfirmResult {
  ok?: boolean;
  error?: string;
  code?: string;
  conflict?: ConflictBooking;
}

export async function confirmBookingAction(
  bookingId: string,
  startsAt: string,
  endsAt: string,
  amountInput: string,
  remarks: string,
): Promise<ConfirmResult> {
  const actor = await requireBlock();
  const amount = parseAmount(amountInput);
  if (amount === null) return { error: "Enter an amount greater than zero." };

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (!(start.getTime() < end.getTime())) {
    return { error: "The end time must be after the start time." };
  }

  try {
    await query`select confirm_booking(${bookingId}, ${actor}, ${start.toISOString()}, ${end.toISOString()}, ${amount}, ${remarks}) as id`;
  } catch (err) {
    const info = parseRpcError(err);
    if (info.code === "SLOT_CONFLICT" || info.code === "23P01") {
      const clash = await queryOne<CalendarRow>`
        select id, label, starts_at, ends_at from public_calendar
        where status = 'confirmed' and id <> ${bookingId}
          and starts_at < ${end.toISOString()} and ends_at > ${start.toISOString()}
        order by starts_at asc limit 1`;
      return {
        error: info.friendlyMessage,
        code: info.code,
        conflict: clash ? toConflict(clash) : undefined,
      };
    }
    return { error: info.friendlyMessage, code: info.code };
  }

  revalidatePath("/rep");
  return { ok: true };
}

export interface ActionResult {
  ok?: boolean;
  error?: string;
}

export async function rejectBookingAction(bookingId: string, reason: string): Promise<ActionResult> {
  const actor = await requireBlock();
  const trimmed = reason.trim();
  if (!trimmed) return { error: "A reason is required." };
  if (trimmed.length > 200) return { error: "Reason must be 200 characters or fewer." };

  try {
    await query`select close_booking(${bookingId}, ${actor}, 'reject', ${trimmed}) as id`;
  } catch (err) {
    return { error: parseRpcError(err).friendlyMessage };
  }

  revalidatePath("/rep");
  return { ok: true };
}
