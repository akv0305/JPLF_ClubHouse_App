import { formatINR } from "./money";
import { durationLabel, fmtRange } from "./time";
import type { BookingKind, BookingStatus } from "./types";

export interface MessageBooking {
  kind: BookingKind;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  requesterName: string | null;
  block: string | null;
  flatNo: string | null;
  amountCollected: string | null;
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Requested",
  confirmed: "Confirmed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

/** A plain-text, WhatsApp-ready booking summary. No markdown. */
export function buildBookingMessage(booking: MessageBooking): string {
  const clubName = process.env.CLUBHOUSE_NAME ?? "Clubhouse";
  const lines: string[] = [
    clubName,
    "",
    `${STATUS_LABEL[booking.status]}: ${fmtRange(booking.startsAt, booking.endsAt)}`,
    `Duration: ${durationLabel(booking.startsAt, booking.endsAt)}`,
  ];

  if (booking.kind === "outsider") {
    lines.push(`Guest: ${booking.requesterName ?? "Guest"}`);
  } else if (booking.kind === "resident") {
    lines.push(`Flat: ${booking.block ?? ""}-${booking.flatNo ?? ""}`);
  }

  if (booking.amountCollected) {
    lines.push(`Amount collected: ${formatINR(booking.amountCollected)}`);
  }

  lines.push("", "Please keep the hall clean and vacate on time. Thank you.");
  return lines.join("\n");
}
