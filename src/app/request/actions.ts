"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import { parseRpcError } from "@/lib/errors";
import { istLocalToUtc } from "@/lib/time";
import { BLOCKS, type BlockCode, type BookingStatus } from "@/lib/types";

export interface ConflictWindow {
  id: string;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
}

export interface AvailabilityResult {
  confirmed: ConflictWindow[];
  pending: ConflictWindow[];
}

/** Overlapping confirmed and pending bookings for a UTC window. */
export async function checkAvailability(
  startUtc: string,
  endUtc: string,
): Promise<AvailabilityResult> {
  const start = new Date(startUtc);
  const end = new Date(endUtc);
  if (!(start.getTime() < end.getTime())) return { confirmed: [], pending: [] };

  const rows = await query<{ id: string; status: BookingStatus; starts_at: Date; ends_at: Date }>`
    select id, status, starts_at, ends_at
    from bookings
    where status in ('confirmed', 'pending')
      and starts_at < ${end.toISOString()}
      and ends_at > ${start.toISOString()}
    order by starts_at asc
  `;

  const windows: ConflictWindow[] = rows.map((row) => ({
    id: String(row.id),
    status: row.status,
    startsAt: new Date(row.starts_at).toISOString(),
    endsAt: new Date(row.ends_at).toISOString(),
  }));

  return {
    confirmed: windows.filter((window) => window.status === "confirmed"),
    pending: windows.filter((window) => window.status === "pending"),
  };
}

const RequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name (at least 2 characters).")
    .max(60, "Name must be 60 characters or fewer."),
  block: z
    .string()
    .refine((value): value is BlockCode => (BLOCKS as readonly string[]).includes(value), {
      message: "Select a valid block.",
    }),
  flatNo: z
    .string()
    .trim()
    .min(1, "Enter your flat number.")
    .max(10, "Flat number must be 10 characters or fewer."),
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit mobile number."),
  fromLocal: z.string().min(1, "Choose a start date and time."),
  toLocal: z.string().min(1, "Choose an end date and time."),
  remarks: z.string().trim().max(500, "Remarks must be 500 characters or fewer."),
});

export type RequestField = "name" | "block" | "flatNo" | "phone" | "fromLocal" | "toLocal" | "remarks";

export interface SubmitState {
  error?: string;
  fieldErrors?: Partial<Record<RequestField, string>>;
}

export async function submitRequest(formData: FormData): Promise<SubmitState> {
  const parsed = RequestSchema.safeParse({
    name: formData.get("name") ?? "",
    block: formData.get("block") ?? "",
    flatNo: formData.get("flatNo") ?? "",
    phone: formData.get("phone") ?? "",
    fromLocal: formData.get("fromLocal") ?? "",
    toLocal: formData.get("toLocal") ?? "",
    remarks: formData.get("remarks") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: SubmitState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as RequestField;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please check the highlighted fields.", fieldErrors };
  }

  const data = parsed.data;
  const startsAt = istLocalToUtc(data.fromLocal);
  const endsAt = istLocalToUtc(data.toLocal);

  if (!(new Date(endsAt).getTime() > new Date(startsAt).getTime())) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: { toLocal: "The end time must be after the start time." },
    };
  }

  let id: string | undefined;
  try {
    const row = await queryOne<{ id: string }>`
      select submit_booking_request(
        ${data.name}, ${data.block}, ${data.flatNo}, ${data.phone}, ${startsAt}, ${endsAt}, ${data.remarks}
      ) as id
    `;
    id = row ? String(row.id) : undefined;
  } catch (err) {
    const info = parseRpcError(err);
    if (info.code === "BAD_PHONE") {
      return { error: "Please check the highlighted fields.", fieldErrors: { phone: info.friendlyMessage } };
    }
    if (info.code === "BAD_BLOCK") {
      return { error: "Please check the highlighted fields.", fieldErrors: { block: info.friendlyMessage } };
    }
    return { error: info.friendlyMessage };
  }

  if (!id) return { error: "Could not submit the request. Please try again." };
  redirect(`/request/success?id=${id}`);
}
