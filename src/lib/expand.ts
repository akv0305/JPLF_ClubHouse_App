import { formatInTimeZone } from "date-fns-tz";
import { IST, istDayBounds } from "./time";
import type { BookingKind, BookingStatus, PublicCalendarRow } from "./types";

export interface Segment {
  bookingId: string;
  label: string;
  status: BookingStatus;
  kind: BookingKind;
  startsAt: string;
  endsAt: string;
  continuesFromPrevDay: boolean;
  continuesToNextDay: boolean;
}

function nextIstDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Split calendar rows into per-IST-day segments. A booking crossing midnight
 * appears on every IST day it touches. `continuesFromPrevDay` is true when the
 * booking starts before that IST day, `continuesToNextDay` when it ends after it.
 * Segments within a day are sorted by start time.
 */
export function expandToDays(
  rows: PublicCalendarRow[],
  monthStartUtc: string,
  monthEndUtc: string,
): Map<string, Segment[]> {
  const result = new Map<string, Segment[]>();
  const monthStart = new Date(monthStartUtc).getTime();
  const monthEnd = new Date(monthEndUtc).getTime();

  for (const row of rows) {
    const startMs = new Date(row.starts_at).getTime();
    const endMs = new Date(row.ends_at).getTime();
    if (!(startMs < monthEnd && endMs > monthStart)) continue;

    const startDay = formatInTimeZone(new Date(row.starts_at), IST, "yyyy-MM-dd");
    const endDay = formatInTimeZone(new Date(row.ends_at), IST, "yyyy-MM-dd");

    let day = startDay;
    while (true) {
      const { startUtc, endUtc } = istDayBounds(day);
      const dayStart = new Date(startUtc).getTime();
      const dayEnd = new Date(endUtc).getTime();

      if (startMs < dayEnd && endMs > dayStart) {
        const segment: Segment = {
          bookingId: String(row.id),
          label: row.label,
          status: row.status,
          kind: row.kind,
          startsAt: row.starts_at,
          endsAt: row.ends_at,
          continuesFromPrevDay: startMs < dayStart,
          continuesToNextDay: endMs > dayEnd,
        };
        const existing = result.get(day);
        if (existing) existing.push(segment);
        else result.set(day, [segment]);
      }

      if (day === endDay) break;
      day = nextIstDay(day);
    }
  }

  for (const segments of result.values()) {
    segments.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }

  return result;
}
