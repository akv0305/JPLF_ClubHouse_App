"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { cancelBookingAction } from "@/app/rep/actions";
import type { ActionBooking } from "@/app/rep/types";
import { fmtRange } from "@/lib/time";

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]";

function describe(booking: ActionBooking): string {
  if (booking.kind === "blackout") return "this blackout";
  if (booking.kind === "outsider") return "this guest booking";
  return `the booking for ${booking.block}-${booking.flatNo}`;
}

export function CancelBookingModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: ActionBooking;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setError(undefined);
    try {
      const result = await cancelBookingAction(booking.id, reason);
      if (result.ok) {
        onSuccess("Booking cancelled.");
        return;
      }
      setError(result.error);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Cancel booking">
      <div className="space-y-4">
        <p className="text-sm text-[#78716C]">
          Cancel {describe(booking)} on {fmtRange(booking.startsAt, booking.endsAt)}. This cannot be
          undone.
        </p>
        <Field
          label="Reason"
          htmlFor="cancelReason"
          error={error}
          hint="Required, up to 200 characters."
        >
          <textarea
            id="cancelReason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError(undefined);
            }}
            maxLength={200}
            rows={3}
            className={`${inputClass} min-h-[88px] py-2`}
          />
        </Field>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Keep booking
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={pending}
            disabled={pending || !reason.trim()}
            onClick={submit}
          >
            Cancel booking
          </Button>
        </div>
      </div>
    </Modal>
  );
}
