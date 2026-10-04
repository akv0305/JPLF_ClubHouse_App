"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { checkAvailability } from "@/app/request/actions";
import { postponeBookingAction } from "@/app/rep/actions";
import type { ActionBooking } from "@/app/rep/types";
import { fmtRange, istLocalToUtc, utcToIstLocal } from "@/lib/time";

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]";

interface Clash {
  startsAt: string;
  endsAt: string;
  label?: string;
}

export function PostponeBookingModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: ActionBooking;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [fromLocal, setFromLocal] = useState(() => utcToIstLocal(booking.startsAt));
  const [toLocal, setToLocal] = useState(() => utcToIstLocal(booking.endsAt));
  const [reason, setReason] = useState("");
  const [clash, setClash] = useState<Clash | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const startsAt = fromLocal ? istLocalToUtc(fromLocal) : "";
  const endsAt = toLocal ? istLocalToUtc(toLocal) : "";
  const rangeValid = Boolean(
    startsAt && endsAt && new Date(endsAt).getTime() > new Date(startsAt).getTime(),
  );

  useEffect(() => {
    if (!rangeValid) {
      setClash(null);
      setChecking(false);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      setChecking(true);
      try {
        const result = await checkAvailability(startsAt, endsAt, booking.id);
        if (cancelled) return;
        const confirmed = result.confirmed[0];
        setClash(confirmed ? { startsAt: confirmed.startsAt, endsAt: confirmed.endsAt } : null);
      } catch {
        if (!cancelled) setClash(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [rangeValid, startsAt, endsAt, booking.id]);

  const canSubmit = rangeValid && !clash && !checking && reason.trim().length > 0 && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const result = await postponeBookingAction(booking.id, startsAt, endsAt, reason);
      if (result.ok) {
        onSuccess("Booking postponed.");
        return;
      }
      setError(result.error);
      if (result.conflict) {
        setClash({ startsAt: result.conflict.startsAt, endsAt: result.conflict.endsAt, label: result.conflict.label });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Postpone booking">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-[#E7E5E4] p-3">
            <p className="text-xs text-[#78716C]">Current</p>
            <p className="mt-1 text-[#1C1917]">{fmtRange(booking.startsAt, booking.endsAt)}</p>
          </div>
          <div className="rounded-xl border border-[#0F766E]/40 bg-[#0F766E]/5 p-3">
            <p className="text-xs text-[#78716C]">New</p>
            <p className="mt-1 text-[#1C1917]">{rangeValid ? fmtRange(startsAt, endsAt) : "—"}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New From" htmlFor="postponeFrom">
            <input
              id="postponeFrom"
              type="datetime-local"
              step={900}
              value={fromLocal}
              onChange={(event) => setFromLocal(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="New To" htmlFor="postponeTo">
            <input
              id="postponeTo"
              type="datetime-local"
              step={900}
              value={toLocal}
              onChange={(event) => setToLocal(event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {checking && <p className="text-sm text-[#78716C]">Checking availability…</p>}
        {!checking && clash && (
          <div
            role="alert"
            className="rounded-xl border border-[#B91C1C]/30 bg-[#B91C1C]/10 px-3 py-2 text-sm text-[#B91C1C]"
          >
            <p className="font-medium">This new time clashes with a confirmed booking:</p>
            <p>
              {clash.label ? `${clash.label} — ` : ""}
              {fmtRange(clash.startsAt, clash.endsAt)}
            </p>
          </div>
        )}

        <Field
          label="Reason"
          htmlFor="postponeReason"
          error={error}
          hint="Required, up to 200 characters."
        >
          <textarea
            id="postponeReason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError(undefined);
            }}
            maxLength={200}
            rows={2}
            className={`${inputClass} min-h-[72px] py-2`}
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" loading={submitting} disabled={!canSubmit} onClick={submit}>
            Postpone booking
          </Button>
        </div>
      </div>
    </Modal>
  );
}
