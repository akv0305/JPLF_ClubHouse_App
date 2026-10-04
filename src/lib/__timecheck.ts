import {
  fmtRange,
  istLocalToUtc,
  istMonthBounds,
  utcToIstLocal,
} from "./time";

export interface TimeCheckItem {
  name: string;
  passed: boolean;
  detail: string;
}

export interface TimeCheckResult {
  ok: boolean;
  checks: TimeCheckItem[];
}

function assertEqual(name: string, actual: string, expected: string): TimeCheckItem {
  return {
    name,
    passed: actual === expected,
    detail: `expected "${expected}", got "${actual}"`,
  };
}

/**
 * Worked timezone assertions. Every display/entry boundary is Asia/Kolkata (IST,
 * UTC+5:30, no DST) while the database stores timestamptz (UTC). If a refactor
 * breaks the boundary, /health reports it immediately.
 */
export function runCheck(): TimeCheckResult {
  const checks: TimeCheckItem[] = [
    // 1. A 6:00 PM IST start is 12:30 UTC the same day (IST = UTC + 5:30).
    assertEqual(
      "6pm IST start -> UTC",
      istLocalToUtc("2026-03-14T18:00"),
      "2026-03-14T12:30:00.000Z",
    ),

    // 2. A booking crossing midnight must render on BOTH IST days, with the
    //    second day showing the next date.
    assertEqual(
      "midnight crossing range",
      fmtRange(istLocalToUtc("2026-03-14T18:00"), istLocalToUtc("2026-03-15T01:00")),
      "Sat, 14 Mar, 6:00 PM – Sun, 15 Mar, 1:00 AM",
    ),

    // 3. A month boundary: IST 1 March 00:00 is 28 February 18:30 UTC.
    assertEqual(
      "month boundary start (IST 1 Mar -> UTC)",
      istMonthBounds("2026-03").startUtc,
      "2026-02-28T18:30:00.000Z",
    ),

    // 4. New Year: IST 1 January 2027 00:00 is 31 December 2026 18:30 UTC,
    //    so the year rolls back across the boundary.
    assertEqual(
      "1 Jan IST -> UTC",
      istLocalToUtc("2027-01-01T00:00"),
      "2026-12-31T18:30:00.000Z",
    ),

    // Round-trip: UTC -> IST local -> UTC must be stable (guards the form boundary).
    assertEqual(
      "round-trip UTC -> IST -> UTC",
      istLocalToUtc(utcToIstLocal("2026-03-14T12:30:00.000Z")),
      "2026-03-14T12:30:00.000Z",
    ),
  ];

  return { ok: checks.every((check) => check.passed), checks };
}
