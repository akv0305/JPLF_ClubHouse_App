"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { expandToDays, type Segment } from "@/lib/expand";
import { durationLabel, fmtRange, fmtTime, todayIst } from "@/lib/time";
import type { BookingKind, BookingStatus, PublicCalendarRow } from "@/lib/types";

export interface CalendarDetails {
  requesterName?: string;
  block?: string | null;
  flatNo?: string | null;
  phone?: string | null;
  remarks?: string | null;
  amountCollected?: string | null;
}

export interface CalendarRow extends PublicCalendarRow {
  details?: CalendarDetails;
}

interface CalendarProps {
  month: string;
  monthStartUtc: string;
  monthEndUtc: string;
  rows: CalendarRow[];
  showFullDetails?: boolean;
}

type Category = "confirmed" | "pending" | "blackout" | "closed";

const CATEGORY_CHIP: Record<Category, string> = {
  confirmed: "bg-[#0F766E]/10 text-[#0F766E]",
  pending: "bg-[#D97706]/10 text-[#D97706]",
  blackout: "bg-[#57534E]/10 text-[#57534E]",
  closed: "bg-[#A8A29E]/15 text-[#A8A29E]",
};

const CATEGORY_DOT: Record<Category, string> = {
  confirmed: "bg-[#0F766E]",
  pending: "bg-[#D97706]",
  blackout: "bg-[#57534E]",
  closed: "bg-[#A8A29E]",
};

const CATEGORY_LABEL: Record<Category, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  blackout: "Blackout",
  closed: "Closed",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const FOCUSABLE =
  'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

function categoryOf(status: BookingStatus, kind: BookingKind): Category {
  if (kind === "blackout") return "blackout";
  if (status === "pending") return "pending";
  if (status === "confirmed") return "confirmed";
  return "closed";
}

function monthLabel(month: string): string {
  return `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
}

function shiftMonth(month: string, delta: number): string {
  const date = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthDays(month: string): string[] {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days: string[] = [];
  for (let d = 1; d <= count; d++) days.push(`${month}-${String(d).padStart(2, "0")}`);
  return days;
}

function weekdayMon(dateStr: string): number {
  return (new Date(`${dateStr}T00:00:00Z`).getUTCDay() + 6) % 7;
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  return `${weekday}, ${Number(dateStr.slice(8, 10))} ${MONTH_NAMES[Number(dateStr.slice(5, 7)) - 1].slice(0, 3)} ${dateStr.slice(0, 4)}`;
}

function timeRange(segment: Segment): string {
  return `${fmtTime(segment.startsAt)}–${fmtTime(segment.endsAt)}`;
}

function Chip({ segment }: { segment: Segment }) {
  const category = categoryOf(segment.status, segment.kind);
  return (
    <span className={`flex w-full items-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] leading-tight ${CATEGORY_CHIP[category]}`}>
      {segment.continuesFromPrevDay && <ArrowLeft className="h-2.5 w-2.5 shrink-0" />}
      <span className="shrink-0 font-medium">{timeRange(segment)}</span>
      <span className="truncate">{segment.label}</span>
      {segment.continuesToNextDay && <ArrowRight className="h-2.5 w-2.5 shrink-0" />}
    </span>
  );
}

function DayDrawer({
  dateStr,
  segments,
  rowById,
  showFullDetails,
  onClose,
}: {
  dateStr: string;
  segments: Segment[];
  rowById: Map<string, CalendarRow>;
  showFullDetails: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const getEls = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    getEls()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab") return;
      const els = getEls();
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-stretch sm:justify-end" onMouseDown={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Bookings on ${dayLabel(dateStr)}`}
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:h-full sm:max-h-none sm:w-96 sm:rounded-none sm:rounded-l-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold text-[#1C1917]">{dayLabel(dateStr)}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-[#78716C] hover:bg-[#FAFAF9]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {segments.length === 0 ? (
          <p className="mt-4 text-sm text-[#78716C]">Nothing booked on this day.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {segments.map((segment, index) => {
              const category = categoryOf(segment.status, segment.kind);
              const details = showFullDetails ? rowById.get(String(segment.bookingId))?.details : undefined;
              return (
                <li key={index} className="rounded-xl border border-[#E7E5E4] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-[#1C1917]">{segment.label}</p>
                    <Badge tone={category}>{CATEGORY_LABEL[category]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[#78716C]">{fmtRange(segment.startsAt, segment.endsAt)}</p>
                  <p className="text-xs text-[#78716C]">{durationLabel(segment.startsAt, segment.endsAt)}</p>
                  {details && (
                    <dl className="mt-2 space-y-0.5 text-xs text-[#78716C]">
                      {details.requesterName && (
                        <div><dt className="inline font-medium text-[#1C1917]">Requester: </dt><dd className="inline">{details.requesterName}</dd></div>
                      )}
                      {details.block && (
                        <div><dt className="inline font-medium text-[#1C1917]">Block: </dt><dd className="inline">{details.block}</dd></div>
                      )}
                      {details.flatNo && (
                        <div><dt className="inline font-medium text-[#1C1917]">Flat: </dt><dd className="inline">{details.flatNo}</dd></div>
                      )}
                      {details.phone && (
                        <div><dt className="inline font-medium text-[#1C1917]">Phone: </dt><dd className="inline">{details.phone}</dd></div>
                      )}
                      {details.amountCollected && (
                        <div><dt className="inline font-medium text-[#1C1917]">Amount: </dt><dd className="inline">{details.amountCollected}</dd></div>
                      )}
                      {details.remarks && (
                        <div><dt className="inline font-medium text-[#1C1917]">Remarks: </dt><dd className="inline">{details.remarks}</dd></div>
                      )}
                    </dl>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-5">
          <Link
            href={`/request?date=${dateStr}`}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#0F766E] px-4 text-sm font-medium text-white transition hover:bg-[#0d6a63]"
          >
            Request this date
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Calendar({
  month,
  monthStartUtc,
  monthEndUtc,
  rows,
  showFullDetails = false,
}: CalendarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [today] = useState(() => todayIst());

  const expanded = useMemo(
    () => expandToDays(rows, monthStartUtc, monthEndUtc),
    [rows, monthStartUtc, monthEndUtc],
  );

  const rowById = useMemo(() => {
    const map = new Map<string, CalendarRow>();
    for (const row of rows) map.set(String(row.id), row);
    return map;
  }, [rows]);

  const days = useMemo(() => monthDays(month), [month]);
  const lead = weekdayMon(`${month}-01`);

  const agendaDays = useMemo(() => {
    const max = addDaysStr(today, 60);
    return Array.from(expanded.keys())
      .filter((day) => day >= today && day <= max && (expanded.get(day)?.length ?? 0) > 0)
      .sort();
  }, [expanded, today]);

  function goToMonth(next: string) {
    router.push(`${pathname}?m=${next}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => goToMonth(shiftMonth(month, -1))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#78716C] transition hover:bg-white hover:text-[#0F766E]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="min-w-[9rem] text-center text-base font-semibold text-[#1C1917]">
            {monthLabel(month)}
          </h2>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => goToMonth(shiftMonth(month, 1))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#78716C] transition hover:bg-white hover:text-[#0F766E]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <Button type="button" variant="secondary" onClick={() => goToMonth(today.slice(0, 7))}>
          Today
        </Button>
      </div>

      <div className="mt-4 hidden sm:block">
        <div className="grid grid-cols-7 gap-1 pb-2 text-center text-xs font-medium text-[#78716C]">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday}>{weekday}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: lead }).map((_, index) => (
            <div key={`lead-${index}`} />
          ))}
          {days.map((dateStr) => {
            const segments = expanded.get(dateStr) ?? [];
            const isToday = dateStr === today;
            const isPast = dateStr < today;
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setOpenDay(dateStr)}
                aria-label={`${dayLabel(dateStr)}, ${segments.length} booking${segments.length === 1 ? "" : "s"}`}
                className={`flex min-h-[96px] flex-col items-stretch rounded-xl border p-1.5 text-left transition hover:bg-[#FAFAF9] ${
                  isToday ? "border-[#0F766E] ring-1 ring-[#0F766E]" : "border-[#E7E5E4]"
                } ${isPast ? "bg-[#FAFAF9] text-[#A8A29E]" : "bg-white text-[#1C1917]"}`}
              >
                <span className={`text-xs font-medium ${isToday ? "text-[#0F766E]" : ""}`}>
                  {Number(dateStr.slice(8, 10))}
                </span>
                <span className="mt-1 flex flex-col gap-0.5">
                  {segments.slice(0, 2).map((segment, index) => (
                    <Chip key={index} segment={segment} />
                  ))}
                  {segments.length > 2 && (
                    <span className="px-1 text-[10px] text-[#78716C]">+{segments.length - 2} more</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 sm:hidden">
        {agendaDays.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#E7E5E4] bg-white px-4 py-8 text-center text-sm text-[#78716C]">
            No bookings in the next 60 days.
          </p>
        ) : (
          <div className="space-y-3">
            {agendaDays.map((dateStr) => (
              <section key={dateStr}>
                <h3 className="sticky top-0 z-10 -mx-4 bg-[#FAFAF9] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#78716C]">
                  {dayLabel(dateStr)}
                </h3>
                <div className="space-y-1.5">
                  {(expanded.get(dateStr) ?? []).map((segment, index) => {
                    const category = categoryOf(segment.status, segment.kind);
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setOpenDay(dateStr)}
                        className="flex w-full items-center gap-2 rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-left"
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${CATEGORY_CHIP[category]}`}>
                          {segment.continuesFromPrevDay ? (
                            <ArrowLeft className="h-3.5 w-3.5" />
                          ) : segment.continuesToNextDay ? (
                            <ArrowRight className="h-3.5 w-3.5" />
                          ) : (
                            <CalendarDays className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[#1C1917]">{segment.label}</span>
                          <span className="block text-xs text-[#78716C]">{timeRange(segment)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#78716C]">
        {(Object.keys(CATEGORY_LABEL) as Category[]).map((category) => (
          <span key={category} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${CATEGORY_DOT[category]}`} />
            {CATEGORY_LABEL[category]}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-[#78716C]">
        Amber means someone has requested this time but it is not confirmed yet — you can still request it.
      </p>

      {openDay && (
        <DayDrawer
          dateStr={openDay}
          segments={expanded.get(openDay) ?? []}
          rowById={rowById}
          showFullDetails={showFullDetails}
          onClose={() => setOpenDay(null)}
        />
      )}
    </div>
  );
}
