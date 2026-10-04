"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { query, queryOne } from "@/lib/db";
import { parseRpcError } from "@/lib/errors";
import { requireBlock } from "@/lib/auth";
import { parseAmount } from "@/lib/money";
import { destroySession } from "@/lib/session";
import { istLocalToUtc } from "@/lib/time";
import { BLOCKS } from "@/lib/types";

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

  revalidatePath(`/rep/booking/${bookingId}`);
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

  revalidatePath(`/rep/booking/${bookingId}`);
  revalidatePath("/rep");
  return { ok: true };
}

const RepBookingSchema = z.object({
  kind: z.enum(["outsider", "resident", "blackout"]),
  name: z.string().trim(),
  block: z.string().trim(),
  flatNo: z.string().trim(),
  phone: z.string().trim(),
  fromLocal: z.string().min(1, "Choose a start date and time."),
  toLocal: z.string().min(1, "Choose an end date and time."),
  amount: z.string().trim(),
  remarks: z.string().trim().max(500, "Remarks must be 500 characters or fewer."),
});

export type RepBookingField =
  | "name"
  | "block"
  | "flatNo"
  | "phone"
  | "fromLocal"
  | "toLocal"
  | "amount"
  | "remarks";

export interface RepBookingState {
  error?: string;
  fieldErrors?: Partial<Record<RepBookingField, string>>;
}

export async function createRepBookingAction(formData: FormData): Promise<RepBookingState> {
  const actor = await requireBlock();

  const parsed = RepBookingSchema.safeParse({
    kind: formData.get("kind") ?? "",
    name: formData.get("name") ?? "",
    block: formData.get("block") ?? "",
    flatNo: formData.get("flatNo") ?? "",
    phone: formData.get("phone") ?? "",
    fromLocal: formData.get("fromLocal") ?? "",
    toLocal: formData.get("toLocal") ?? "",
    amount: formData.get("amount") ?? "",
    remarks: formData.get("remarks") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: RepBookingState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as RepBookingField;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please check the highlighted fields.", fieldErrors };
  }

  const data = parsed.data;
  const isBlackout = data.kind === "blackout";
  const fieldErrors: RepBookingState["fieldErrors"] = {};

  if (isBlackout) {
    if (!data.remarks) fieldErrors.remarks = "A reason is required.";
  } else {
    if (data.name.length < 2 || data.name.length > 60) {
      fieldErrors.name = "Enter the name (2–60 characters).";
    }
    if (!/^\d{10}$/.test(data.phone)) {
      fieldErrors.phone = "Enter a valid 10-digit mobile number.";
    }
    if (parseAmount(data.amount) === null) {
      fieldErrors.amount = "Enter an amount greater than zero.";
    }
    if (data.kind === "resident") {
      if (!(BLOCKS as readonly string[]).includes(data.block)) {
        fieldErrors.block = "Select a valid block.";
      }
      if (!data.flatNo) fieldErrors.flatNo = "Enter the flat number.";
      else if (data.flatNo.length > 10) {
        fieldErrors.flatNo = "Flat number must be 10 characters or fewer.";
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please check the highlighted fields.", fieldErrors };
  }

  const startsAt = istLocalToUtc(data.fromLocal);
  const endsAt = istLocalToUtc(data.toLocal);
  if (!(new Date(endsAt).getTime() > new Date(startsAt).getTime())) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: { toLocal: "The end time must be after the start time." },
    };
  }

  const name = isBlackout ? null : data.name;
  const block = data.kind === "resident" ? data.block : null;
  const flat = data.kind === "resident" ? data.flatNo.toUpperCase() : null;
  const phone = isBlackout ? null : data.phone;
  const amount = isBlackout ? null : parseAmount(data.amount);
  const remarks = data.remarks || null;

  let id: string | undefined;
  try {
    const row = await queryOne<{ id: string }>`
      select create_rep_booking(
        ${actor}, ${data.kind}::booking_kind, ${name}, ${block}, ${flat}, ${phone},
        ${startsAt}, ${endsAt}, ${amount}, ${remarks}
      ) as id
    `;
    id = row ? String(row.id) : undefined;
  } catch (err) {
    return { error: parseRpcError(err).friendlyMessage };
  }

  if (!id) return { error: "Could not create the booking. Please try again." };
  revalidatePath("/rep");
  redirect(`/rep/booking/${id}`);
}

export interface PostponeResult {
  ok?: boolean;
  error?: string;
  code?: string;
  conflict?: ConflictBooking;
}

export async function postponeBookingAction(
  bookingId: string,
  startsAt: string,
  endsAt: string,
  reason: string,
): Promise<PostponeResult> {
  const actor = await requireBlock();
  const trimmed = reason.trim();
  if (!trimmed) return { error: "A reason is required." };
  if (trimmed.length > 200) return { error: "Reason must be 200 characters or fewer." };

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (!(start.getTime() < end.getTime())) {
    return { error: "The end time must be after the start time." };
  }

  try {
    await query`select postpone_booking(${bookingId}, ${actor}, ${start.toISOString()}, ${end.toISOString()}, ${trimmed}) as id`;
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

  revalidatePath(`/rep/booking/${bookingId}`);
  revalidatePath("/rep");
  return { ok: true };
}

export async function cancelBookingAction(
  bookingId: string,
  reason: string,
): Promise<ActionResult> {
  const actor = await requireBlock();
  const trimmed = reason.trim();
  if (!trimmed) return { error: "A reason is required." };
  if (trimmed.length > 200) return { error: "Reason must be 200 characters or fewer." };

  try {
    await query`select close_booking(${bookingId}, ${actor}, 'cancel', ${trimmed}) as id`;
  } catch (err) {
    return { error: parseRpcError(err).friendlyMessage };
  }

  revalidatePath(`/rep/booking/${bookingId}`);
  revalidatePath("/rep");
  return { ok: true };
}
