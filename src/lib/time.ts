import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const IST = "Asia/Kolkata";

const LOCAL_INPUT = "yyyy-MM-dd'T'HH:mm";

function nextDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function nextMonth(ym: string): string {
  const d = new Date(`${ym}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 7);
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

/** 'yyyy-MM-ddTHH:mm' interpreted as IST -> ISO UTC string. */
export function istLocalToUtc(local: string): string {
  return fromZonedTime(local, IST).toISOString();
}

/** ISO UTC string -> 'yyyy-MM-ddTHH:mm' for a datetime-local input (IST wall clock). */
export function utcToIstLocal(iso: string): string {
  return formatInTimeZone(new Date(iso), IST, LOCAL_INPUT);
}

/** ISO UTC -> 'Sat, 14 Mar 2026'. */
export function fmtDate(iso: string): string {
  return formatInTimeZone(new Date(iso), IST, "EEE, d MMM yyyy");
}

/** ISO UTC -> '6:00 PM'. */
export function fmtTime(iso: string): string {
  return formatInTimeZone(new Date(iso), IST, "h:mm a");
}

/**
 * ISO UTC range -> same IST day: 'Sat, 14 Mar 2026, 6:00 PM – 11:00 PM';
 * crossing midnight: 'Sat, 14 Mar, 6:00 PM – Sun, 15 Mar, 1:00 AM'.
 */
export function fmtRange(startIso: string, endIso: string): string {
  const startDay = formatInTimeZone(new Date(startIso), IST, "yyyy-MM-dd");
  const endDay = formatInTimeZone(new Date(endIso), IST, "yyyy-MM-dd");
  if (startDay === endDay) {
    return `${fmtDate(startIso)}, ${fmtTime(startIso)} – ${fmtTime(endIso)}`;
  }
  const startLabel = formatInTimeZone(new Date(startIso), IST, "EEE, d MMM");
  const endLabel = formatInTimeZone(new Date(endIso), IST, "EEE, d MMM");
  return `${startLabel}, ${fmtTime(startIso)} – ${endLabel}, ${fmtTime(endIso)}`;
}

/** ISO UTC range -> '7 hours' / '6 hours 30 minutes'. */
export function durationLabel(startIso: string, endIso: string): string {
  const minutes = Math.max(
    0,
    Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000),
  );
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0 && rest > 0) return `${plural(hours, "hour")} ${plural(rest, "minute")}`;
  if (hours > 0) return plural(hours, "hour");
  return plural(rest, "minute");
}

/** IST midnight-to-midnight for 'yyyy-MM-dd', expressed in UTC. */
export function istDayBounds(dateStr: string): { startUtc: string; endUtc: string } {
  return {
    startUtc: fromZonedTime(`${dateStr}T00:00`, IST).toISOString(),
    endUtc: fromZonedTime(`${nextDay(dateStr)}T00:00`, IST).toISOString(),
  };
}

/** IST first-of-month to first-of-next-month for 'yyyy-MM', expressed in UTC. */
export function istMonthBounds(ym: string): { startUtc: string; endUtc: string } {
  return {
    startUtc: fromZonedTime(`${ym}-01T00:00`, IST).toISOString(),
    endUtc: fromZonedTime(`${nextMonth(ym)}-01T00:00`, IST).toISOString(),
  };
}

/** Today's date in IST as 'yyyy-MM-dd'. */
export function todayIst(): string {
  return formatInTimeZone(new Date(), IST, "yyyy-MM-dd");
}
