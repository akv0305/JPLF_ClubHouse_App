"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { rejectBookingAction } from "@/app/rep/actions";
import type { RepRow } from "@/app/rep/types";

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]";

export function RejectForm({
  booking,
  onSuccess,
  onCancel,
}: {
  booking: RepRow;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setError(undefined);
    try {
      const result = await rejectBookingAction(booking.id, reason);
      if (result.ok) {
        onSuccess("Request rejected.");
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
    <div className="space-y-4">
      <p className="text-sm text-[#78716C]">
        Reject the request from {booking.requesterName} ({booking.block}-{booking.flatNo}).
      </p>
      <Field
        label="Reason"
        htmlFor="rejectReason"
        error={error}
        hint="Required, up to 200 characters."
      >
        <textarea
          id="rejectReason"
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
        <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          loading={pending}
          disabled={pending || !reason.trim()}
          onClick={submit}
        >
          Reject request
        </Button>
      </div>
    </div>
  );
}
