import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { queryOne } from "@/lib/db";
import { durationLabel, fmtRange } from "@/lib/time";
import type { Booking } from "@/lib/types";
import { CopyDetailsButton } from "./CopyDetailsButton";

export const dynamic = "force-dynamic";

export const metadata = { title: "Request submitted" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SuccessPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "your mobile number";
  return `+91 ${"•".repeat(digits.length - 4)}${digits.slice(-4)}`;
}

export default async function RequestSuccessPage({ searchParams }: SuccessPageProps) {
  const id = typeof searchParams.id === "string" ? searchParams.id : "";
  const booking = UUID_RE.test(id)
    ? await queryOne<Booking>`select * from bookings where id = ${id} and kind = 'resident' limit 1`
    : null;

  if (!booking) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <h1 className="text-lg font-semibold text-[#1C1917]">Request not found</h1>
          <p className="mt-1 text-sm text-[#78716C]">
            We could not find that booking request.
          </p>
          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#0F766E] px-5 text-sm font-medium text-white transition hover:bg-[#0d6a63]"
            >
              Back to calendar
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const startsAt = new Date(booking.starts_at).toISOString();
  const endsAt = new Date(booking.ends_at).toISOString();
  const duration = durationLabel(startsAt, endsAt);
  const blockLabel = `${booking.block} Block`;
  const maskedPhone = maskPhone(booking.phone ?? "");

  const summaryText = [
    "Clubhouse booking request",
    `Name: ${booking.requester_name}`,
    `Block: ${blockLabel}`,
    `Flat: ${booking.flat_no}`,
    `Mobile: ${booking.phone}`,
    `From: ${fmtRange(startsAt, endsAt)}`,
    `Duration: ${duration}`,
    booking.remarks ? `Remarks: ${booking.remarks}` : null,
    `Request id: ${booking.id}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-[#0F766E]" aria-hidden="true" />
          <h1 className="text-lg font-semibold text-[#1C1917]">Request submitted</h1>
        </div>
        <p className="mt-2 text-sm text-[#78716C]">
          Your {blockLabel} representative will review this and contact you on {maskedPhone}.
        </p>

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[#78716C]">Name</dt>
            <dd className="text-right font-medium text-[#1C1917]">{booking.requester_name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#78716C]">Block</dt>
            <dd className="text-right font-medium text-[#1C1917]">{blockLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#78716C]">Flat</dt>
            <dd className="text-right font-medium text-[#1C1917]">{booking.flat_no}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#78716C]">When</dt>
            <dd className="text-right font-medium text-[#1C1917]">
              {fmtRange(startsAt, endsAt)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#78716C]">Duration</dt>
            <dd className="text-right font-medium text-[#1C1917]">{duration}</dd>
          </div>
          {booking.remarks && (
            <div className="flex justify-between gap-4">
              <dt className="text-[#78716C]">Remarks</dt>
              <dd className="text-right font-medium text-[#1C1917]">{booking.remarks}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <CopyDetailsButton text={summaryText} />
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#0F766E] px-5 text-sm font-medium text-white transition hover:bg-[#0d6a63]"
          >
            Back to calendar
          </Link>
        </div>
      </Card>
    </div>
  );
}
