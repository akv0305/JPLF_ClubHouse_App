"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CancelBookingModal } from "@/components/CancelBookingModal";
import { ConfirmBookingModal } from "@/components/ConfirmBookingModal";
import { PostponeBookingModal } from "@/components/PostponeBookingModal";
import { RejectBookingModal } from "@/components/RejectBookingModal";
import { Toast } from "@/components/Toast";
import type { ActionBooking } from "@/app/rep/types";

type Mode = "confirm" | "reject" | "postpone" | "cancel";

export function BookingActions({ booking, myBlock }: { booking: ActionBooking; myBlock: string }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(handle);
  }, [toast]);

  function handleSuccess(message: string) {
    setMode(null);
    setToast(message);
  }

  const isOwner = booking.ownerBlock === myBlock;

  return (
    <div>
      {!isOwner ? (
        <p className="text-sm text-[#78716C]">
          Only {booking.ownerBlock} Block can act on this booking.
        </p>
      ) : booking.status === "pending" ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setMode("confirm")}>
            Confirm
          </Button>
          <Button type="button" variant="secondary" onClick={() => setMode("reject")}>
            Reject
          </Button>
        </div>
      ) : booking.status === "confirmed" ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setMode("postpone")}>
            Postpone
          </Button>
          <Button type="button" variant="danger" onClick={() => setMode("cancel")}>
            Cancel
          </Button>
        </div>
      ) : (
        <p className="text-sm text-[#78716C]">This booking has already been actioned.</p>
      )}

      {mode === "confirm" && (
        <ConfirmBookingModal booking={booking} onClose={() => setMode(null)} onSuccess={handleSuccess} />
      )}
      {mode === "reject" && (
        <RejectBookingModal booking={booking} onClose={() => setMode(null)} onSuccess={handleSuccess} />
      )}
      {mode === "postpone" && (
        <PostponeBookingModal booking={booking} onClose={() => setMode(null)} onSuccess={handleSuccess} />
      )}
      {mode === "cancel" && (
        <CancelBookingModal booking={booking} onClose={() => setMode(null)} onSuccess={handleSuccess} />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
