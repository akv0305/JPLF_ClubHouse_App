"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import {
  checkConfirmConflicts,
  confirmBookingAction,
  type ConflictBooking,
} from "@/app/rep/actions";
import type { RepRow } from "@/app/rep/types";
import { parseAmount } from "@/lib/money";
import { durationLabel, fmtRange, istLocalToUtc, utcToIstLocal } from "@/lib/time";
import { RejectForm } from "./RejectForm";

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]";

export function ConfirmBookingModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: RepRow;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const bookingId = booking.id;
  const [mode, setMode] = useState<"confirm" | "reject">("confirm");
  const [amending, setAmending] = useState(false);
  const [fromLocal, setFromLocal] = useState(() => utcToIstLocal(booking.startsAt));
  const [toLocal, setToLocal] = useState(() => utcToIstLocal(booking.endsAt));
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [conflict, setConflict] = useState<ConflictBooking | null>(null);
  const [overlappingPending, setOverlappingPending] = useState<ConflictBooking[]>([]);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [recheck, setRecheck] = useState(0);

  const effectiveStart = amending
    ? fromLocal
      ? istLocalToUtc(fromLocal)
      : ""
    : booking.startsAt;
  const effectiveEnd = amending ? (toLocal ? istLocalToUtc(toLocal) : "") : booking.endsAt;
  const rangeValid = Boolean(
    effectiveStart &&
      effectiveEnd &&
      new Date(effectiveEnd).getTime() > new Date(effectiveStart).getTime(),
  );

  useEffect(() => {
    if (mode !== "confirm") return;
    if (!rangeValid) {
      setConflict(null);
      setOverlappingPending([]);
      setChecking(false);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(
      async () => {
        setChecking(true);
        try {
          const result = await checkConfirmConflicts(bookingId, effectiveStart, effectiveEnd);
          if (cancelled) return;
          setConflict(result.confirmedClash);
          setOverlappingPending(result.overlappingPending);
          if (result.confirmedClash) setAmending(true);
        } catch {
          if (!cancelled) setConflict(null);
        } finally {
          if (!cancelled) setChecking(false);
        }
      },
      amending ? 400 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [mode, bookingId, effectiveStart, effectiveEnd, rangeValid, amending, recheck]);

  const amountValid = parseAmount(amount) !== null;
  const canConfirm = rangeValid && !conflict && !checking && amountValid && !submitting;

  async function submitConfirm() {
    if (!canConfirm) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const result = await confirmBookingAction(
        bookingId,
        effectiveStart,
        effectiveEnd,
        amount,
        remarks,
      );
      if (result.ok) {
        onSuccess("Booking confirmed.");
        return;
      }
      setError(result.error);
      if (result.code === "SLOT_CONFLICT" || result.code === "23P01") {
        setAmending(true);
        setConflict(result.conflict ?? null);
        setRecheck((value) => value + 1);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (mode === "reject") {
    return (
      <Modal open onClose={onClose} title="Reject request">
        <RejectForm booking={booking} onSuccess={onSuccess} onCancel={() => setMode("confirm")} />
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Confirm booking">
      <div className="space-y-4">
        <dl className="rounded-xl border border-[#E7E5E4] p-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[#78716C]">Requester</dt>
            <dd className="text-right font-medium text-[#1C1917]">{booking.requesterName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#78716C]">Flat</dt>
            <dd className="text-right font-medium text-[#1C1917]">
              {booking.block}-{booking.flatNo}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#78716C]">When</dt>
            <dd className="text-right font-medium text-[#1C1917]">
              {fmtRange(booking.startsAt, booking.endsAt)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#78716C]">Duration</dt>
            <dd className="text-right font-medium text-[#1C1917]">
              {durationLabel(booking.startsAt, booking.endsAt)}
            </dd>
          </div>
          {booking.remarks && (
            <div className="flex justify-between gap-4">
              <dt className="text-[#78716C]">Remarks</dt>
              <dd className="text-right text-[#1C1917]">{booking.remarks}</dd>
            </div>
          )}
        </dl>

        {checking && <p className="text-sm text-[#78716C]">Checking availability…</p>}

        {conflict && (
          <div
            role="alert"
            className="rounded-xl border border-[#B91C1C]/30 bg-[#B91C1C]/10 px-3 py-2 text-sm text-[#B91C1C]"
          >
            <p className="font-medium">This time clashes with a confirmed booking:</p>
            <p>
              {conflict.label} — {fmtRange(conflict.startsAt, conflict.endsAt)}
            </p>
            <p className="mt-1">Pick a different time to confirm this booking, or reject it.</p>
          </div>
        )}

        {amending && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From" htmlFor="amendFrom">
              <input
                id="amendFrom"
                type="datetime-local"
                step={900}
                value={fromLocal}
                onChange={(event) => setFromLocal(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="To" htmlFor="amendTo">
              <input
                id="amendTo"
                type="datetime-local"
                step={900}
                value={toLocal}
                onChange={(event) => setToLocal(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        )}

        <Field label="Amount collected (₹)" htmlFor="amount" hint="Required.">
          <input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              if (error) setError(undefined);
            }}
            className={inputClass}
          />
        </Field>

        <Field
          label="Remarks (optional)"
          htmlFor="confirmRemarks"
          hint="e.g. UPI ref 4412xxxx, or cash collected by Ramesh"
        >
          <textarea
            id="confirmRemarks"
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            rows={2}
            className={`${inputClass} min-h-[72px] py-2`}
          />
        </Field>

        {overlappingPending.length > 0 && (
          <div className="rounded-xl bg-[#D97706]/10 px-3 py-2 text-sm text-[#D97706]">
            <p className="font-medium">
              Confirming will automatically reject {overlappingPending.length} other pending
              request{overlappingPending.length === 1 ? "" : "s"}.
            </p>
            <ul className="mt-1 list-disc pl-5">
              {overlappingPending.map((pending) => (
                <li key={pending.id}>
                  {pending.label} — {fmtRange(pending.startsAt, pending.endsAt)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-[#B91C1C]/10 px-3 py-2 text-sm text-[#B91C1C]">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => setMode("reject")}>
            Reject instead
          </Button>
          <Button type="button" loading={submitting} disabled={!canConfirm} onClick={submitConfirm}>
            Confirm booking
          </Button>
        </div>
      </div>
    </Modal>
  );
}
