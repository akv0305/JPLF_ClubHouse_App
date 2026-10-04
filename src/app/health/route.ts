import { NextResponse } from "next/server";
import { formatInTimeZone } from "date-fns-tz";
import { queryOne } from "@/lib/db";
import { runCheck } from "@/lib/__timecheck";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const timecheck = runCheck();
  try {
    const bookings = await queryOne<{ count: number }>`select count(*)::int as count from bookings`;
    const blocks = await queryOne<{ count: number }>`select count(*)::int as count from blocks`;
    return NextResponse.json({
      ok: timecheck.ok,
      bookings: bookings?.count ?? 0,
      blocks: blocks?.count ?? 0,
      istNow: formatInTimeZone(new Date(), "Asia/Kolkata", "yyyy-MM-dd'T'HH:mm:ssXXX"),
      timecheck,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
        timecheck,
      },
      { status: 500 },
    );
  }
}
